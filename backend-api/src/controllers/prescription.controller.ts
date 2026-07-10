import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

export async function createPrescription(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'MEDECIN' || !user.medecinId) {
      return res.status(403).json({ message: 'Seuls les médecins peuvent créer des prescriptions.' });
    }

    const { patientId, medicaments, posologie, instructions } = req.body;

    if (!patientId || !medicaments || !posologie) {
      return res.status(400).json({ message: 'patientId, medicaments et posologie sont requis.' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        medecinId: user.medecinId,
        patientId: parseInt(patientId),
        medicaments,
        posologie,
        instructions: instructions || '',
      },
      include: {
        medecin: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    // Notification pour le patient
    await prisma.notification.create({
      data: {
        userId: prescription.patient.userId,
        titre: 'Nouvelle prescription',
        message: `Le Dr. ${prescription.medecin.user.nom} a créé une nouvelle prescription pour vous.`,
      },
    });

    return res.status(201).json(prescription);
  } catch (error: any) {
    console.error('Create prescription error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la prescription.', error: error.message });
  }
}

export async function getPatientPrescriptions(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'PATIENT' || !user.patientId) {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: user.patientId },
      include: {
        medecin: { include: { user: true, specialite: true } },
      },
      orderBy: { datePrescription: 'desc' },
    });

    return res.json(prescriptions);
  } catch (error: any) {
    console.error('Get prescriptions error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des prescriptions.', error: error.message });
  }
}

export async function getMedecinPrescriptions(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'MEDECIN' || !user.medecinId) {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { medecinId: user.medecinId },
      include: {
        patient: { include: { user: true } },
      },
      orderBy: { datePrescription: 'desc' },
    });

    return res.json(prescriptions);
  } catch (error: any) {
    console.error('Get prescriptions error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des prescriptions.', error: error.message });
  }
}
