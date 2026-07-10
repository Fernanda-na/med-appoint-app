"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getMedecinReviews = getMedecinReviews;
exports.getMyReviews = getMyReviews;
const db_1 = __importDefault(require("../config/db"));
async function createReview(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            return res.status(403).json({ message: 'Seuls les patients peuvent laisser des avis.' });
        }
        const { medecinId, note, commentaire } = req.body;
        if (!medecinId || !note) {
            return res.status(400).json({ message: 'medecinId et note sont requis.' });
        }
        if (note < 1 || note > 5) {
            return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
        }
        const review = await db_1.default.avis.create({
            data: {
                medecinId: parseInt(medecinId),
                patientId: user.patientId,
                note: parseInt(note),
                commentaire: commentaire || '',
            },
            include: {
                medecin: { include: { user: true, specialite: true } },
                patient: { include: { user: true } },
            },
        });
        return res.status(201).json(review);
    }
    catch (error) {
        console.error('Create review error:', error);
        return res.status(500).json({ message: 'Erreur lors de la création de l\'avis.', error: error.message });
    }
}
async function getMedecinReviews(req, res) {
    try {
        const { medecinId } = req.params;
        const reviews = await db_1.default.avis.findMany({
            where: { medecinId: parseInt(medecinId) },
            include: {
                patient: { include: { user: true } },
            },
            orderBy: { dateAvis: 'desc' },
        });
        // Calculer la moyenne
        const averageNote = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.note, 0) / reviews.length
            : 0;
        return res.json({
            reviews,
            averageNote: Math.round(averageNote * 10) / 10,
            totalReviews: reviews.length,
        });
    }
    catch (error) {
        console.error('Get reviews error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des avis.', error: error.message });
    }
}
async function getMyReviews(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            return res.status(403).json({ message: 'Accès non autorisé.' });
        }
        const reviews = await db_1.default.avis.findMany({
            where: { patientId: user.patientId },
            include: {
                medecin: { include: { user: true, specialite: true } },
            },
            orderBy: { dateAvis: 'desc' },
        });
        return res.json(reviews);
    }
    catch (error) {
        console.error('Get my reviews error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération de vos avis.', error: error.message });
    }
}
