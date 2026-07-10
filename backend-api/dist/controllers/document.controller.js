"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentUpload = void 0;
exports.getMyDocuments = getMyDocuments;
exports.uploadDocument = uploadDocument;
exports.downloadDocument = downloadDocument;
exports.deleteDocument = deleteDocument;
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
// Multer Config — secure disk storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        // Use UUID to prevent filename guessing
        const uniqueName = `${crypto_1.default.randomUUID()}${ext}`;
        cb(null, uniqueName);
    },
});
// Only allow safe document types
const fileFilter = (_req, file, cb) => {
    const ALLOWED_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Type de fichier non autorisé. Seuls PDF, images et documents Word sont acceptés.'));
    }
};
exports.documentUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});
/**
 * GET /api/v1/documents
 * Returns the list of medical documents belonging to the authenticated patient.
 */
async function getMyDocuments(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            return res.status(403).json({ message: 'Seuls les patients ont accès à leurs documents médicaux.' });
        }
        const documents = await db_1.default.documentMedical.findMany({
            where: { patientId: user.patientId },
            orderBy: { dateUpload: 'desc' },
            select: {
                id: true,
                nom: true,
                type: true,
                dateUpload: true,
                // Do NOT expose the internal filename (url) in the list
            },
        });
        return res.json(documents);
    }
    catch (error) {
        console.error('getMyDocuments error:', error);
        return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
}
/**
 * POST /api/v1/documents
 * Upload a new medical document. Patient only.
 */
async function uploadDocument(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'PATIENT' || !user.patientId) {
            return res.status(403).json({ message: 'Seuls les patients peuvent téléverser des documents.' });
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
                url: req.file.filename, // stored internally, never exposed directly
                patientId: user.patientId,
            },
        });
        return res.status(201).json({
            id: document.id,
            nom: document.nom,
            type: document.type,
            dateUpload: document.dateUpload,
        });
    }
    catch (error) {
        console.error('uploadDocument error:', error);
        return res.status(500).json({ message: 'Erreur lors du téléversement.', error: error.message });
    }
}
/**
 * GET /api/v1/documents/:id/download
 * Securely download a document. Only the patient who owns it can access it.
 */
async function downloadDocument(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json({ message: 'Non authentifié.' });
        }
        const document = await db_1.default.documentMedical.findUnique({
            where: { id: parseInt(id) },
            include: { patient: true },
        });
        if (!document) {
            return res.status(404).json({ message: 'Document introuvable.' });
        }
        // ─── SECURITY CHECK ───
        // Only the patient who owns this document can download it
        if (user.role === 'PATIENT' && document.patientId !== user.patientId) {
            return res.status(403).json({ message: 'Accès interdit. Ce document ne vous appartient pas.' });
        }
        // Non-patients (admin, receptionist) are forbidden for now
        if (user.role !== 'PATIENT') {
            return res.status(403).json({ message: 'Accès réservé aux patients.' });
        }
        const filePath = path_1.default.join(UPLOAD_DIR, document.url);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ message: 'Fichier physique introuvable sur le serveur.' });
        }
        // Force download with original document name
        res.setHeader('Content-Disposition', `attachment; filename="${document.nom}"`);
        res.setHeader('Content-Type', document.type);
        return res.sendFile(filePath);
    }
    catch (error) {
        console.error('downloadDocument error:', error);
        return res.status(500).json({ message: 'Erreur lors du téléchargement.', error: error.message });
    }
}
/**
 * DELETE /api/v1/documents/:id
 * Delete a document. Only the patient who owns it can delete it.
 */
async function deleteDocument(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || user.role !== 'PATIENT') {
            return res.status(403).json({ message: 'Accès interdit.' });
        }
        const document = await db_1.default.documentMedical.findUnique({
            where: { id: parseInt(id) },
        });
        if (!document) {
            return res.status(404).json({ message: 'Document introuvable.' });
        }
        if (document.patientId !== user.patientId) {
            return res.status(403).json({ message: 'Ce document ne vous appartient pas.' });
        }
        // Delete physical file first
        const filePath = path_1.default.join(UPLOAD_DIR, document.url);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete DB record
        await db_1.default.documentMedical.delete({ where: { id: parseInt(id) } });
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteDocument error:', error);
        return res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
    }
}
