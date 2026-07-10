"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeleconsultation = createTeleconsultation;
exports.getMyTeleconsultations = getMyTeleconsultations;
exports.updateTeleconsultationStatus = updateTeleconsultationStatus;
const db_1 = __importDefault(require("../config/db"));
async function createTeleconsultation(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'MEDECIN' || !user.medecinId) {
            return res.status(403).json({ message: 'Seuls les médecins peuvent créer des téléconsultations.' });
        }
        const { patientId, dateHeure, motif } = req.body;
        if (!patientId || !dateHeure || !motif) {
            return res.status(400).json({ message: 'patientId, dateHeure et motif sont requis.' });
        }
        const teleconsultation = await db_1.default.teleconsultation.create({
            data: {
                medecinId: user.medecinId,
                patientId: parseInt(patientId),
                dateHeure: new Date(dateHeure),
                motif,
                statut: 'PLANIFIEE',
                lienVideo: `https://meet.jit.si/medappoint-${Date.now()}`,
            },
            include: {
                medecin: { include: { user: true } },
                patient: { include: { user: true } },
            },
        });
        // Créer une notification pour le patient
        await db_1.default.notification.create({
            data: {
                userId: teleconsultation.patient.userId,
                titre: 'Nouvelle téléconsultation',
                message: `Le Dr. ${teleconsultation.medecin.user.nom} a planifié une téléconsultation le ${new Date(dateHeure).toLocaleString()}.`,
            },
        });
        return res.status(201).json(teleconsultation);
    }
    catch (error) {
        console.error('Create teleconsultation error:', error);
        return res.status(500).json({ message: 'Erreur lors de la création de la téléconsultation.', error: error.message });
    }
}
async function getMyTeleconsultations(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        let teleconsultations = [];
        if (user.role === 'PATIENT' && user.patientId) {
            teleconsultations = await db_1.default.teleconsultation.findMany({
                where: { patientId: user.patientId },
                include: {
                    medecin: { include: { user: true, specialite: true } },
                    patient: { include: { user: true } },
                },
                orderBy: { dateHeure: 'asc' },
            });
        }
        else if (user.role === 'MEDECIN' && user.medecinId) {
            teleconsultations = await db_1.default.teleconsultation.findMany({
                where: { medecinId: user.medecinId },
                include: {
                    medecin: { include: { user: true, specialite: true } },
                    patient: { include: { user: true } },
                },
                orderBy: { dateHeure: 'asc' },
            });
        }
        return res.json(teleconsultations);
    }
    catch (error) {
        console.error('Get teleconsultations error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des téléconsultations.', error: error.message });
    }
}
async function updateTeleconsultationStatus(req, res) {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        if (!['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide.' });
        }
        const teleconsultation = await db_1.default.teleconsultation.update({
            where: { id: parseInt(id) },
            data: { statut },
            include: {
                medecin: { include: { user: true } },
                patient: { include: { user: true } },
            },
        });
        return res.json(teleconsultation);
    }
    catch (error) {
        console.error('Update teleconsultation error:', error);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la téléconsultation.', error: error.message });
    }
}
