import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

export async function createTeleconsultation(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'MEDECIN' || !user.medecinId) {
      return res.status(403).json({ message: 'Seuls les médecins peuvent créer des téléconsultations.' });
    }

    const { patientId, dateHeure, motif } = req.body;

    if (!patientId || !dateHeure || !motif) {
      return res.status(400).json({ message: 'patientId, dateHeure et motif sont requis.' });
    }

    const teleconsultation = await prisma.teleconsultation.create({
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
    await prisma.notification.create({
      data: {
        userId: teleconsultation.patient.userId,
        titre: 'Nouvelle téléconsultation',
        message: `Le Dr. ${teleconsultation.medecin.user.nom} a planifié une téléconsultation le ${new Date(dateHeure).toLocaleString()}.`,
      },
    });

    return res.status(201).json(teleconsultation);
  } catch (error: any) {
    console.error('Create teleconsultation error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la téléconsultation.', error: error.message });
  }
}

export async function getMyTeleconsultations(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    let teleconsultations: any[] = [];

    if (user.role === 'PATIENT' && user.patientId) {
      teleconsultations = await prisma.teleconsultation.findMany({
        where: { patientId: user.patientId },
        include: {
          medecin: { include: { user: true, specialite: true } },
          patient: { include: { user: true } },
        },
        orderBy: { dateHeure: 'asc' },
      });
    } else if (user.role === 'MEDECIN' && user.medecinId) {
      teleconsultations = await prisma.teleconsultation.findMany({
        where: { medecinId: user.medecinId },
        include: {
          medecin: { include: { user: true, specialite: true } },
          patient: { include: { user: true } },
        },
        orderBy: { dateHeure: 'asc' },
      });
    }

    return res.json(teleconsultations);
  } catch (error: any) {
    console.error('Get teleconsultations error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des téléconsultations.', error: error.message });
  }
}

export async function updateTeleconsultationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const teleconsultation = await prisma.teleconsultation.update({
      where: { id: parseInt(id) },
      data: { statut },
      include: {
        medecin: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    return res.json(teleconsultation);
  } catch (error: any) {
    console.error('Update teleconsultation error:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la téléconsultation.', error: error.message });
  }
}
