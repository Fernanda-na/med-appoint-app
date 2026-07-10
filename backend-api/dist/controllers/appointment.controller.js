"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAppointments = getMyAppointments;
exports.bookAppointment = bookAppointment;
exports.updateAppointment = updateAppointment;
exports.cancelAppointment = cancelAppointment;
exports.updateAppointmentStatus = updateAppointmentStatus;
const db_1 = __importDefault(require("../config/db"));
const twilio_service_1 = require("../services/twilio.service");
function translateDayToFrench(dayIndex) {
    const days = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    return days[dayIndex];
}
async function getMyAppointments(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        let appointments = [];
        if (user.role === 'PATIENT' && user.patientId) {
            appointments = await db_1.default.rendezVous.findMany({
                where: { patientId: user.patientId },
                include: {
                    patient: { include: { user: true } },
                    medecin: { include: { user: true, specialite: true } },
                },
                orderBy: { dateHeureDebut: 'asc' },
            });
        }
        else if (user.role === 'MEDECIN' && user.medecinId) {
            appointments = await db_1.default.rendezVous.findMany({
                where: { medecinId: user.medecinId },
                include: {
                    patient: { include: { user: true } },
                    medecin: { include: { user: true, specialite: true } },
                },
                orderBy: { dateHeureDebut: 'asc' },
            });
        }
        const formatted = appointments.map((app) => ({
            id: app.id,
            patientNom: `${app.patient.user.nom} ${app.patient.user.prenom}`,
            medecinNom: `Dr. ${app.medecin.user.nom}`,
            specialite: app.medecin.specialite?.nom || 'Généraliste',
            dateHeureDebut: app.dateHeureDebut,
            dateHeureFin: app.dateHeureFin,
            motif: app.motif,
            statut: app.statut,
        }));
        return res.json(formatted);
    }
    catch (error) {
        console.error('Get appointments error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous.', error: error.message });
    }
}
async function bookAppointment(req, res) {
    try {
        const user = req.user;
        console.log('Book appointment - User info:', {
            id: user?.id,
            email: user?.email,
            role: user?.role,
            patientId: user?.patientId,
            medecinId: user?.medecinId
        });
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            console.log('Access denied - User is not a patient or missing patientId');
            return res.status(403).json({ message: 'Seuls les patients peuvent réserver des rendez-vous.' });
        }
        const { medecinId, dateHeureDebut, motif } = req.body;
        if (!medecinId || !dateHeureDebut || !motif) {
            return res.status(400).json({ message: 'medecinId, dateHeureDebut et motif sont requis.' });
        }
        const medecin = await db_1.default.medecin.findUnique({
            where: { id: parseInt(medecinId) },
            include: {
                user: true,
                specialite: true,
            },
        });
        if (!medecin) {
            return res.status(404).json({ message: 'Médecin non trouvé.' });
        }
        const start = new Date(dateHeureDebut);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ message: 'Date de début invalide.' });
        }
        const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 minutes
        // 1. Vérifier si le jour et l'heure sont dans les disponibilités du médecin
        const jourFR = translateDayToFrench(start.getDay());
        const hours = start.getHours().toString().padStart(2, '0');
        const minutes = start.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        const availabilities = await db_1.default.disponibilite.findMany({
            where: {
                medecinId: medecin.id,
                jourSemaine: jourFR,
            },
        });
        const isAvailable = availabilities.some((a) => {
            // Comparaison simple HH:mm
            return timeStr >= a.heureDebut && timeStr < a.heureFin;
        });
        if (!isAvailable && availabilities.length > 0) {
            // S'il n'y a pas de disponibilités configurées du tout, on pourrait laisser passer en dev,
            // mais s'il y en a et que ça ne correspond pas, on bloque comme en Java
            return res.status(400).json({ message: "Le médecin n'est pas disponible sur ce créneau." });
        }
        // 2. Vérifier les conflits d'horaires
        const conflicts = await db_1.default.rendezVous.findMany({
            where: {
                medecinId: medecin.id,
                statut: { not: 'ANNULE' },
                AND: [
                    { dateHeureDebut: { lt: end } },
                    { dateHeureFin: { gt: start } },
                ],
            },
        });
        if (conflicts.length > 0) {
            return res.status(400).json({ message: 'Ce créneau est déjà réservé.' });
        }
        // 3. Créer le rendez-vous
        const appointment = await db_1.default.rendezVous.create({
            data: {
                patientId: user.patientId,
                medecinId: medecin.id,
                dateHeureDebut: start,
                dateHeureFin: end,
                motif,
                statut: 'EN_ATTENTE',
            },
            include: {
                patient: { include: { user: true } },
            },
        });
        // 4. Notifications internes
        await db_1.default.notification.createMany({
            data: [
                {
                    userId: user.id,
                    titre: 'Rendez-vous réservé',
                    message: `Votre demande de rendez-vous avec le Dr. ${medecin.user.nom} est en attente de confirmation.`,
                },
                {
                    userId: medecin.userId,
                    titre: 'Nouveau rendez-vous',
                    message: `Le patient ${appointment.patient.user.nom} ${appointment.patient.user.prenom} a demandé un rendez-vous le ${start.toLocaleString()}.`,
                },
            ],
        });
        // 5. Envoi SMS Twilio
        const patientPhone = appointment.patient.user.telephone || user.email; // fallback
        const dateFormatted = start.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
        await twilio_service_1.TwilioService.sendAppointmentConfirmation(patientPhone, `${appointment.patient.user.prenom} ${appointment.patient.user.nom}`, medecin.user.nom, dateFormatted);
        return res.status(201).json({
            id: appointment.id,
            patientNom: `${appointment.patient.user.nom} ${appointment.patient.user.prenom}`,
            medecinNom: `Dr. ${medecin.user.nom}`,
            specialite: medecin.specialite?.nom || 'Généraliste',
            dateHeureDebut: appointment.dateHeureDebut,
            dateHeureFin: appointment.dateHeureFin,
            motif: appointment.motif,
            statut: appointment.statut,
        });
    }
    catch (error) {
        console.error('Book appointment error:', error);
        return res.status(500).json({ message: 'Erreur lors de la réservation du rendez-vous.', error: error.message });
    }
}
async function updateAppointment(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const { id } = req.params;
        const { dateHeureDebut, motif } = req.body;
        const appointment = await db_1.default.rendezVous.findUnique({
            where: { id: parseInt(id) },
            include: {
                patient: { include: { user: true } },
                medecin: { include: { user: true } },
            },
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }
        // Vérifier les permissions
        if (user.role === 'PATIENT' && appointment.patientId !== user.patientId) {
            return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres rendez-vous.' });
        }
        if (user.role === 'MEDECIN' && appointment.medecinId !== user.medecinId) {
            return res.status(403).json({ message: 'Vous ne pouvez modifier que vos rendez-vous.' });
        }
        // Si modification de la date, vérifier les disponibilités et conflits
        if (dateHeureDebut) {
            const start = new Date(dateHeureDebut);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ message: 'Date de début invalide.' });
            }
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            const jourFR = translateDayToFrench(start.getDay());
            const hours = start.getHours().toString().padStart(2, '0');
            const minutes = start.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            const availabilities = await db_1.default.disponibilite.findMany({
                where: {
                    medecinId: appointment.medecinId,
                    jourSemaine: jourFR,
                },
            });
            const isAvailable = availabilities.some((a) => {
                return timeStr >= a.heureDebut && timeStr < a.heureFin;
            });
            if (!isAvailable && availabilities.length > 0) {
                return res.status(400).json({ message: "Le médecin n'est pas disponible sur ce créneau." });
            }
            const conflicts = await db_1.default.rendezVous.findMany({
                where: {
                    medecinId: appointment.medecinId,
                    statut: { not: 'ANNULE' },
                    id: { not: appointment.id },
                    AND: [
                        { dateHeureDebut: { lt: end } },
                        { dateHeureFin: { gt: start } },
                    ],
                },
            });
            if (conflicts.length > 0) {
                return res.status(400).json({ message: 'Ce créneau est déjà réservé.' });
            }
        }
        const updateData = {};
        if (dateHeureDebut) {
            const start = new Date(dateHeureDebut);
            updateData.dateHeureDebut = start;
            updateData.dateHeureFin = new Date(start.getTime() + 30 * 60 * 1000);
        }
        if (motif) {
            updateData.motif = motif;
        }
        const updated = await db_1.default.rendezVous.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                patient: { include: { user: true } },
                medecin: { include: { user: true, specialite: true } },
            },
        });
        // Notification
        await db_1.default.notification.create({
            data: {
                userId: user.role === 'PATIENT' ? appointment.medecin.userId : appointment.patient.userId,
                titre: 'Rendez-vous modifié',
                message: `Un rendez-vous a été modifié par ${user.role === 'PATIENT' ? 'le patient' : 'le médecin'}.`,
            },
        });
        return res.json({
            id: updated.id,
            patientNom: `${updated.patient.user.nom} ${updated.patient.user.prenom}`,
            medecinNom: `Dr. ${updated.medecin.user.nom}`,
            specialite: updated.medecin.specialite?.nom || 'Généraliste',
            dateHeureDebut: updated.dateHeureDebut,
            dateHeureFin: updated.dateHeureFin,
            motif: updated.motif,
            statut: updated.statut,
        });
    }
    catch (error) {
        console.error('Update appointment error:', error);
        return res.status(500).json({ message: 'Erreur lors de la modification du rendez-vous.', error: error.message });
    }
}
async function cancelAppointment(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const { id } = req.params;
        const appointment = await db_1.default.rendezVous.findUnique({
            where: { id: parseInt(id) },
            include: {
                patient: { include: { user: true } },
                medecin: { include: { user: true } },
            },
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }
        // Vérifier les permissions
        if (user.role === 'PATIENT' && appointment.patientId !== user.patientId) {
            return res.status(403).json({ message: 'Vous ne pouvez annuler que vos propres rendez-vous.' });
        }
        if (user.role === 'MEDECIN' && appointment.medecinId !== user.medecinId) {
            return res.status(403).json({ message: 'Vous ne pouvez annuler que vos rendez-vous.' });
        }
        if (appointment.statut === 'ANNULE') {
            return res.status(400).json({ message: 'Ce rendez-vous est déjà annulé.' });
        }
        const updated = await db_1.default.rendezVous.update({
            where: { id: parseInt(id) },
            data: { statut: 'ANNULE' },
            include: {
                patient: { include: { user: true } },
                medecin: { include: { user: true, specialite: true } },
            },
        });
        // Notifications
        await db_1.default.notification.createMany({
            data: [
                {
                    userId: appointment.patient.userId,
                    titre: 'Rendez-vous annulé',
                    message: `Votre rendez-vous avec le Dr. ${appointment.medecin.user.nom} a été annulé.`,
                },
                {
                    userId: appointment.medecin.userId,
                    titre: 'Rendez-vous annulé',
                    message: `Le rendez-vous avec ${appointment.patient.user.prenom} ${appointment.patient.user.nom} a été annulé.`,
                },
            ],
        });
        return res.json({
            id: updated.id,
            patientNom: `${updated.patient.user.nom} ${updated.patient.user.prenom}`,
            medecinNom: `Dr. ${updated.medecin.user.nom}`,
            specialite: updated.medecin.specialite?.nom || 'Généraliste',
            dateHeureDebut: updated.dateHeureDebut,
            dateHeureFin: updated.dateHeureFin,
            motif: updated.motif,
            statut: updated.statut,
        });
    }
    catch (error) {
        console.error('Cancel appointment error:', error);
        return res.status(500).json({ message: 'Erreur lors de l\'annulation du rendez-vous.', error: error.message });
    }
}
async function updateAppointmentStatus(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'MEDECIN' || !user.medecinId) {
            return res.status(403).json({ message: 'Seuls les médecins peuvent valider/refuser les rendez-vous.' });
        }
        const { id } = req.params;
        const { statut } = req.body;
        if (!['VALIDE', 'REFUSE'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide. Doit être VALIDE ou REFUSE.' });
        }
        const appointment = await db_1.default.rendezVous.findUnique({
            where: { id: parseInt(id) },
            include: {
                patient: { include: { user: true } },
                medecin: { include: { user: true } },
            },
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
        }
        if (appointment.medecinId !== user.medecinId) {
            return res.status(403).json({ message: 'Ce rendez-vous ne vous appartient pas.' });
        }
        const updated = await db_1.default.rendezVous.update({
            where: { id: parseInt(id) },
            data: { statut },
            include: {
                patient: { include: { user: true } },
                medecin: { include: { user: true, specialite: true } },
            },
        });
        // Notification au patient
        await db_1.default.notification.create({
            data: {
                userId: appointment.patient.userId,
                titre: statut === 'VALIDE' ? 'Rendez-vous confirmé' : 'Rendez-vous refusé',
                message: statut === 'VALIDE'
                    ? `Votre rendez-vous avec le Dr. ${appointment.medecin.user.nom} a été confirmé.`
                    : `Votre rendez-vous avec le Dr. ${appointment.medecin.user.nom} a été refusé.`,
            },
        });
        return res.json({
            id: updated.id,
            patientNom: `${updated.patient.user.nom} ${updated.patient.user.prenom}`,
            medecinNom: `Dr. ${updated.medecin.user.nom}`,
            specialite: updated.medecin.specialite?.nom || 'Généraliste',
            dateHeureDebut: updated.dateHeureDebut,
            dateHeureFin: updated.dateHeureFin,
            motif: updated.motif,
            statut: updated.statut,
        });
    }
    catch (error) {
        console.error('Update appointment status error:', error);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour du statut.', error: error.message });
    }
}
