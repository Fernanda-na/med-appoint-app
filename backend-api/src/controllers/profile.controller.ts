import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });

export async function uploadAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    const avatarUrl = req.file.filename;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return res.json({ avatarUrl });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ message: "Erreur lors du téléchargement de l'avatar.", error: error.message });
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { dateCreation: 'desc' },
    });

    return res.json(notifications);
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des notifications.', error: error.message });
  }
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée.' });
    }

    if (notification.userId !== user.id) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { lu: true },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error('Mark notification error:', error);
    return res.status(500).json({ message: 'Erreur lors de la modification de la notification.', error: error.message });
  }
}

export async function getDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'PATIENT' || !user.patientId) {
      return res.status(403).json({ message: 'Seuls les patients ont des documents médicaux.' });
    }

    const documents = await prisma.documentMedical.findMany({
      where: { patientId: user.patientId },
      orderBy: { dateUpload: 'desc' },
    });

    return res.json(documents);
  } catch (error: any) {
    console.error('Get documents error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des documents.', error: error.message });
  }
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
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

    const document = await prisma.documentMedical.create({
      data: {
        nom,
        type: req.file.mimetype,
        url: req.file.filename,
        patientId: user.patientId,
      },
    });

    return res.status(201).json(document);
  } catch (error: any) {
    console.error('Upload document error:', error);
    return res.status(500).json({ message: 'Erreur lors du téléchargement du document.', error: error.message });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const { nom, prenom, telephone, historiqueMedical } = req.body;

    // Update User table
    await prisma.user.update({
      where: { id: user.id },
      data: {
        nom,
        prenom,
        telephone,
      },
    });

    // If patient, update Patient table
    if (user.role === 'PATIENT' && user.patientId) {
      await prisma.patient.update({
        where: { id: user.patientId },
        data: {
          historiqueMedical,
        },
      });
    }

    return res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const userData = await prisma.user.findUnique({
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
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil.', error: error.message });
  }
}
