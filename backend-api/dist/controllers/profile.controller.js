"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadAvatar = uploadAvatar;
exports.getNotifications = getNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.getDocuments = getDocuments;
exports.uploadDocument = uploadDocument;
exports.updateProfile = updateProfile;
exports.getProfile = getProfile;
const db_1 = __importDefault(require("../config/db"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
// Ensure upload directory exists
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Multer Config
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const uniqueName = `${crypto_1.default.randomUUID()}${ext}`;
        cb(null, uniqueName);
    },
});
exports.upload = (0, multer_1.default)({ storage });
async function uploadAvatar(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier fourni.' });
        }
        const avatarUrl = req.file.filename;
        await db_1.default.user.update({
            where: { id: user.id },
            data: { avatarUrl },
        });
        return res.json({ avatarUrl });
    }
    catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ message: "Erreur lors du téléchargement de l'avatar.", error: error.message });
    }
}
async function getNotifications(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const notifications = await db_1.default.notification.findMany({
            where: { userId: user.id },
            orderBy: { dateCreation: 'desc' },
        });
        return res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des notifications.', error: error.message });
    }
}
async function markNotificationAsRead(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const notification = await db_1.default.notification.findUnique({
            where: { id: parseInt(id) },
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée.' });
        }
        if (notification.userId !== user.id) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }
        await db_1.default.notification.update({
            where: { id: notification.id },
            data: { lu: true },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Mark notification error:', error);
        return res.status(500).json({ message: 'Erreur lors de la modification de la notification.', error: error.message });
    }
}
async function getDocuments(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            return res.status(403).json({ message: 'Seuls les patients ont des documents médicaux.' });
        }
        const documents = await db_1.default.documentMedical.findMany({
            where: { patientId: user.patientId },
            orderBy: { dateUpload: 'desc' },
        });
        return res.json(documents);
    }
    catch (error) {
        console.error('Get documents error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération des documents.', error: error.message });
    }
}
async function uploadDocument(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            return res.status(403).json({ message: 'Seuls les patients peuvent charger des documents.' });
        }
        const { nom } = req.body;
        if (!nom) {
            return res.status(400).json({ message: 'Le nom du document est requis.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier fourni.' });
        }
        const document = await db_1.default.documentMedical.create({
            data: {
                nom,
                type: req.file.mimetype,
                url: req.file.filename,
                patientId: user.patientId,
            },
        });
        return res.status(201).json(document);
    }
    catch (error) {
        console.error('Upload document error:', error);
        return res.status(500).json({ message: 'Erreur lors du téléchargement du document.', error: error.message });
    }
}
async function updateProfile(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const { nom, prenom, telephone, historiqueMedical } = req.body;
        // Update User table
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                nom,
                prenom,
                telephone,
            },
        });
        // If patient, update Patient table
        if (user.role === 'PATIENT' && user.patientId) {
            await db_1.default.patient.update({
                where: { id: user.patientId },
                data: {
                    historiqueMedical,
                },
            });
        }
        return res.json({ message: 'Profil mis à jour avec succès' });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
    }
}
async function getProfile(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const userData = await db_1.default.user.findUnique({
            where: { id: user.id },
            include: {
                patient: true,
                medecin: true,
            },
        });
        if (!userData) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        // Exclude password
        const { motDePasse, ...userWithoutPassword } = userData;
        return res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ message: 'Erreur lors de la récupération du profil.', error: error.message });
    }
}
