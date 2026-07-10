import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '86400000';

export async function register(req: Request, res: Response) {
  try {
    const { nom, prenom, email, password, role } = req.body;

    console.log('Registration attempt:', { nom, prenom, email, role });

    if (!nom || !prenom || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être renseignés.' });
    }

    console.log('Checking existing user...');
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé.' });
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'PATIENT';

    console.log('Creating user with role:', userRole);
    const createdUser = await prisma.$transaction(async (tx) => {
      console.log('Transaction started');
      const user = await tx.user.create({
        data: {
          nom,
          prenom,
          email,
          motDePasse: hashedPassword,
          role: userRole,
        },
      });
      console.log('User created:', user.id);

      if (userRole === 'PATIENT') {
        console.log('Creating patient record...');
        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            numeroPatient: `PAT-${Date.now()}`,
          },
        });
        console.log('Patient created:', patient.id);
        return { ...user, patientId: patient.id };
      } else if (userRole === 'MEDECIN') {
        console.log('Creating medecin record...');
        const medecin = await tx.medecin.create({
          data: {
            userId: user.id,
            lieuConsultation: 'Cabinet Médical',
          },
        });
        console.log('Medecin created:', medecin.id);
        return { ...user, medecinId: medecin.id };
      }

      return user;
    });

    const patientId = 'patientId' in createdUser ? createdUser.patientId : undefined;
    const medecinId = 'medecinId' in createdUser ? createdUser.medecinId : undefined;

    console.log('Generating token...');
    const token = jwt.sign(
      {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        patientId,
        medecinId,
      },
      JWT_SECRET,
      { expiresIn: parseInt(JWT_EXPIRATION) / 1000 }
    );

    console.log('Registration successful for:', email);
    return res.status(201).json({
      token,
      nom: createdUser.nom,
      prenom: createdUser.prenom,
      email: createdUser.email,
      role: createdUser.role,
      patientId,
      medecinId,
      avatarUrl: createdUser.avatarUrl,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return res.status(500).json({ 
      message: "Erreur interne lors de l'inscription.", 
      error: error.message,
      details: error.code 
    });
  }
}

export async function authenticate(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez saisir votre e-mail et votre mot de passe.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        medecin: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.motDePasse);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId: user.patient?.id,
        medecinId: user.medecin?.id,
      },
      JWT_SECRET,
      { expiresIn: parseInt(JWT_EXPIRATION) / 1000 }
    );

    return res.json({
      token,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      patientId: user.patient?.id,
      medecinId: user.medecin?.id,
      avatarUrl: user.avatarUrl,
    });
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Erreur interne lors de la connexion.', error: error.message });
  }
}
