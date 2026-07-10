import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { role } = req.query;

    let whereClause: any = {};
    if (role && typeof role === 'string') {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        patient: true,
        medecin: {
          include: {
            specialite: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      role: u.role,
      avatarUrl: u.avatarUrl,
      patient: u.patient,
      medecin: u.medecin,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.', error: error.message });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { nom, prenom, email, password, role, telephone } = req.body;

    if (!nom || !prenom || !email || !password || !role) {
      return res.status(400).json({ message: 'nom, prenom, email, password et role sont requis.' });
    }

    const validRoles = ['PATIENT', 'MEDECIN', 'ADMINISTRATEUR', 'RECEPTIONNISTE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nom,
          prenom,
          email,
          motDePasse: hashedPassword,
          role,
          telephone,
        },
      });

      if (role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: newUser.id,
            numeroPatient: `PAT-${Date.now()}`,
          },
        });
      } else if (role === 'MEDECIN') {
        await tx.medecin.create({
          data: {
            userId: newUser.id,
            lieuConsultation: 'Cabinet Médical',
          },
        });
      }

      return newUser;
    });

    return res.status(201).json({
      id: createdUser.id,
      nom: createdUser.nom,
      prenom: createdUser.prenom,
      email: createdUser.email,
      role: createdUser.role,
      telephone: createdUser.telephone,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur.', error: error.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (targetUser.id === user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur.', error: error.message });
  }
}

export async function addDoctor(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { nom, prenom, email, password, telephone, specialiteId, lieuConsultation } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ message: 'nom, prenom, email et password sont requis.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const medecin = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nom,
          prenom,
          email,
          motDePasse: hashedPassword,
          role: 'MEDECIN',
          telephone,
        },
      });

      const newMedecin = await tx.medecin.create({
        data: {
          userId: newUser.id,
          specialiteId: specialiteId ? parseInt(specialiteId) : null,
          lieuConsultation: lieuConsultation || 'Cabinet Médical',
        },
        include: {
          user: true,
          specialite: true,
        },
      });

      return newMedecin;
    });

    return res.status(201).json(medecin);
  } catch (error: any) {
    console.error('Add doctor error:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'ajout du médecin.', error: error.message });
  }
}

export async function updateDoctor(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { id } = req.params;
    const { nom, prenom, email, telephone, specialiteId, lieuConsultation } = req.body;

    const medecin = await prisma.medecin.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!medecin) {
      return res.status(404).json({ message: 'Médecin non trouvé.' });
    }

    const updateData: any = {};
    if (specialiteId !== undefined) {
      updateData.specialiteId = specialiteId ? parseInt(specialiteId) : null;
    }
    if (lieuConsultation !== undefined) {
      updateData.lieuConsultation = lieuConsultation;
    }

    const userUpdateData: any = {};
    if (nom) userUpdateData.nom = nom;
    if (prenom) userUpdateData.prenom = prenom;
    if (email) userUpdateData.email = email;
    if (telephone !== undefined) userUpdateData.telephone = telephone;

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.medecin.update({
          where: { id: parseInt(id) },
          data: updateData,
        });
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: medecin.userId },
          data: userUpdateData,
        });
      }

      return await tx.medecin.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: true,
          specialite: true,
        },
      });
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Update doctor error:', error);
    return res.status(500).json({ message: 'Erreur lors de la modification du médecin.', error: error.message });
  }
}

export async function deleteDoctor(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { id } = req.params;

    const medecin = await prisma.medecin.findUnique({
      where: { id: parseInt(id) },
    });

    if (!medecin) {
      return res.status(404).json({ message: 'Médecin non trouvé.' });
    }

    await prisma.medecin.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: 'Médecin supprimé avec succès.' });
  } catch (error: any) {
    console.error('Delete doctor error:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression du médecin.', error: error.message });
  }
}

export async function getStatistics(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Nombre total de rendez-vous
    const totalAppointments = await prisma.rendezVous.count();

    // Rendez-vous ce mois
    const appointmentsThisMonth = await prisma.rendezVous.count({
      where: {
        dateHeureDebut: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Rendez-vous par statut
    const appointmentsByStatus = await prisma.rendezVous.groupBy({
      by: ['statut'],
      _count: true,
    });

    // Nombre d'utilisateurs par rôle
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Spécialités les plus sollicitées
    const topSpecialties = await prisma.rendezVous.groupBy({
      by: ['medecinId'],
      _count: true,
      orderBy: {
        _count: {
          medecinId: 'desc',
        },
      },
      take: 5,
    });

    const specialtiesData = await Promise.all(
      topSpecialties.map(async (item) => {
        const medecin = await prisma.medecin.findUnique({
          where: { id: item.medecinId },
          include: { specialite: true },
        });
        return {
          specialite: medecin?.specialite?.nom || 'Non spécifié',
          count: item._count,
        };
      })
    );

    // Taux d'annulation
    const cancelledCount = appointmentsByStatus.find((s) => s.statut === 'ANNULE')?._count || 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0;

    return res.json({
      totalAppointments,
      appointmentsThisMonth,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item.statut] = item._count;
        return acc;
      }, {} as Record<string, number>),
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topSpecialties: specialtiesData,
      cancellationRate: parseFloat(cancellationRate.toFixed(2)),
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.', error: error.message });
  }
}

export async function getAllAppointmentsAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }

    const { statut, limit = 50, offset = 0 } = req.query;

    let whereClause: any = {};
    if (statut && typeof statut === 'string') {
      whereClause.statut = statut;
    }

    const appointments = await prisma.rendezVous.findMany({
      where: whereClause,
      include: {
        patient: { include: { user: true } },
        medecin: { include: { user: true, specialite: true } },
      },
      orderBy: { dateHeureDebut: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const formatted = appointments.map((app) => ({
      id: app.id,
      patientNom: `${app.patient.user.nom} ${app.patient.user.prenom}`,
      patientEmail: app.patient.user.email,
      medecinNom: `Dr. ${app.medecin.user.nom}`,
      medecinEmail: app.medecin.user.email,
      specialite: app.medecin.specialite?.nom || 'Généraliste',
      dateHeureDebut: app.dateHeureDebut,
      dateHeureFin: app.dateHeureFin,
      motif: app.motif,
      statut: app.statut,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Get all appointments admin error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous.', error: error.message });
  }
}
