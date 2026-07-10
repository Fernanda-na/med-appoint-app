import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

export async function createPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'PATIENT' || !user.patientId) {
      return res.status(403).json({ message: 'Seuls les patients peuvent créer des paiements.' });
    }

    const { rendezVousId, montant, methode } = req.body;

    if (!montant || !methode) {
      return res.status(400).json({ message: 'montant et methode sont requis.' });
    }

    const payment = await prisma.paiement.create({
      data: {
        patientId: user.patientId,
        rendezVousId: rendezVousId ? parseInt(rendezVousId) : null,
        montant: parseFloat(montant),
        methode,
        statut: 'EN_ATTENTE',
        reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      include: {
        rendezVous: {
          include: {
            medecin: { include: { user: true } },
          },
        },
      },
    });

    return res.status(201).json(payment);
  } catch (error: any) {
    console.error('Create payment error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du paiement.', error: error.message });
  }
}

export async function getMyPayments(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'PATIENT' || !user.patientId) {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const payments = await prisma.paiement.findMany({
      where: { patientId: user.patientId },
      include: {
        rendezVous: {
          include: {
            medecin: { include: { user: true, specialite: true } },
          },
        },
      },
      orderBy: { datePaiement: 'desc' },
    });

    return res.json(payments);
  } catch (error: any) {
    console.error('Get payments error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des paiements.', error: error.message });
  }
}

export async function updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['EN_ATTENTE', 'PAYE', 'REFUSE', 'REMBOURSE'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const payment = await prisma.paiement.update({
      where: { id: parseInt(id) },
      data: { statut },
      include: {
        rendezVous: true,
        patient: { include: { user: true } },
      },
    });

    // Notification si le paiement est validé
    if (statut === 'PAYE') {
      await prisma.notification.create({
        data: {
          userId: payment.patient.userId,
          titre: 'Paiement validé',
          message: `Votre paiement de ${payment.montant} FCFA a été validé avec succès.`,
        },
      });
    }

    return res.json(payment);
  } catch (error: any) {
    console.error('Update payment error:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du paiement.', error: error.message });
  }
}
