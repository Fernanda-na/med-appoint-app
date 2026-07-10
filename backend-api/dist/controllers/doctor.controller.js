"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDoctors = getAllDoctors;
exports.getAllSpecialties = getAllSpecialties;
exports.getDoctorAvailability = getDoctorAvailability;
exports.addAvailability = addAvailability;
exports.deleteAvailability = deleteAvailability;
exports.getDoctorAvailabilities = getDoctorAvailabilities;
const db_1 = __importDefault(require("../config/db"));
function translateDayToFrench(dayIndex) {
    const days = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    return days[dayIndex];
}
async function getAllDoctors(req, res) {
    try {
        const { specialty } = req.query;
        let whereClause = {};
        if (specialty && typeof specialty === 'string') {
            whereClause = {
                specialite: {
                    nom: specialty,
                },
            };
        }
        const medecins = await db_1.default.medecin.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        telephone: true,
                        avatarUrl: true,
                        role: true,
                    },
                },
                specialite: true,
            },
        });
        // On formate pour aplatir la structure et ressembler au format Java attendu
        const formattedMedecins = medecins.map((m) => ({
            id: m.id,
            userId: m.userId,
            nom: m.user.nom,
            prenom: m.user.prenom,
            email: m.user.email,
            telephone: m.user.telephone,
            avatarUrl: m.user.avatarUrl,
            lieuConsultation: m.lieuConsultation,
            specialite: m.specialite,
        }));
        return res.json(formattedMedecins);
    }
    catch (error) {
        console.error('Get doctors error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des médecins.', error: error.message });
    }
}
async function getAllSpecialties(_req, res) {
    try {
        const specialties = await db_1.default.specialite.findMany();
        return res.json(specialties);
    }
    catch (error) {
        console.error('Get specialties error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des spécialités.', error: error.message });
    }
}
async function getDoctorAvailability(req, res) {
    try {
        const { id } = req.params;
        const { date } = req.query;
        const medecin = await db_1.default.medecin.findUnique({
            where: { id: parseInt(id) },
        });
        if (!medecin) {
            return res.status(404).json({ message: 'Médecin non trouvé.' });
        }
        // Récupérer les disponibilités du médecin
        const availabilities = await db_1.default.disponibilite.findMany({
            where: { medecinId: medecin.id },
        });
        // Si une date spécifique est demandée, calculer les créneaux disponibles
        if (date && typeof date === 'string') {
            const targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ message: 'Date invalide.' });
            }
            const jourFR = translateDayToFrench(targetDate.getDay());
            const dayAvailabilities = availabilities.filter((a) => a.jourSemaine === jourFR);
            // Récupérer les rendez-vous déjà pris ce jour-là
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);
            const existingAppointments = await db_1.default.rendezVous.findMany({
                where: {
                    medecinId: medecin.id,
                    statut: { not: 'ANNULE' },
                    dateHeureDebut: { gte: dayStart, lte: dayEnd },
                },
            });
            const bookedSlots = existingAppointments.map((app) => {
                const hours = app.dateHeureDebut.getHours().toString().padStart(2, '0');
                const minutes = app.dateHeureDebut.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            });
            // Générer les créneaux disponibles
            const availableSlots = [];
            for (const avail of dayAvailabilities) {
                const [startHour, startMin] = avail.heureDebut.split(':').map(Number);
                const [endHour, endMin] = avail.heureFin.split(':').map(Number);
                let currentMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                while (currentMinutes + 30 <= endMinutes) {
                    const slotHours = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
                    const slotMins = (currentMinutes % 60).toString().padStart(2, '0');
                    const slotTime = `${slotHours}:${slotMins}`;
                    if (!bookedSlots.includes(slotTime)) {
                        availableSlots.push(slotTime);
                    }
                    currentMinutes += 30;
                }
            }
            return res.json({
                date: date,
                jour: jourFR,
                creneauxDisponibles: availableSlots,
            });
        }
        // Sinon, retourner toutes les disponibilités hebdomadaires
        return res.json(availabilities);
    }
    catch (error) {
        console.error('Get doctor availability error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des disponibilités.', error: error.message });
    }
}
async function addAvailability(req, res) {
    try {
        const { medecinId, jourSemaine, heureDebut, heureFin } = req.body;
        if (!medecinId || !jourSemaine || !heureDebut || !heureFin) {
            return res.status(400).json({ message: 'medecinId, jourSemaine, heureDebut et heureFin sont requis.' });
        }
        const validDays = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        if (!validDays.includes(jourSemaine)) {
            return res.status(400).json({ message: 'jourSemaine invalide. Doit être LUNDI, MARDI, etc.' });
        }
        const medecin = await db_1.default.medecin.findUnique({
            where: { id: parseInt(medecinId) },
        });
        if (!medecin) {
            return res.status(404).json({ message: 'Médecin non trouvé.' });
        }
        const availability = await db_1.default.disponibilite.create({
            data: {
                medecinId: medecin.id,
                jourSemaine,
                heureDebut,
                heureFin,
            },
        });
        return res.status(201).json(availability);
    }
    catch (error) {
        console.error('Add availability error:', error);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de la disponibilité.', error: error.message });
    }
}
async function deleteAvailability(req, res) {
    try {
        const { id } = req.params;
        const availability = await db_1.default.disponibilite.findUnique({
            where: { id: parseInt(id) },
        });
        if (!availability) {
            return res.status(404).json({ message: 'Disponibilité non trouvée.' });
        }
        await db_1.default.disponibilite.delete({
            where: { id: parseInt(id) },
        });
        return res.json({ message: 'Disponibilité supprimée avec succès.' });
    }
    catch (error) {
        console.error('Delete availability error:', error);
        return res.status(500).json({ message: 'Erreur lors de la suppression de la disponibilité.', error: error.message });
    }
}
async function getDoctorAvailabilities(req, res) {
    try {
        const { id } = req.params;
        const medecin = await db_1.default.medecin.findUnique({
            where: { id: parseInt(id) },
        });
        if (!medecin) {
            return res.status(404).json({ message: 'Médecin non trouvé.' });
        }
        const availabilities = await db_1.default.disponibilite.findMany({
            where: { medecinId: medecin.id },
            orderBy: { jourSemaine: 'asc' },
        });
        return res.json(availabilities);
    }
    catch (error) {
        console.error('Get doctor availabilities error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des disponibilités.', error: error.message });
    }
}
