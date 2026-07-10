import { Role } from '@prisma/client';
import prisma from './config/db';
import bcrypt from 'bcryptjs';

async function createTestUser(role: Role) {
  const nom = 'TestNom';
  const prenom = 'TestPrenom';
  const email = 'test@example.com';
  const password = 'password123';

  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Starting transaction...');
  const createdUser = await prisma.$transaction(async (tx) => {
    console.log('Transaction started, creating user...');
    const user = await tx.user.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        role,
      },
    });
    console.log('User created:', user.id);

    if (role === Role.PATIENT) {
      console.log('Creating patient record...');
      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          numeroPatient: `PAT-${Date.now()}`,
        },
      });
      console.log('Patient created:', patient.id);
      return { ...user, patientId: patient.id };
    } else if (role === Role.MEDECIN) {
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

  return createdUser;
}

async function testRegister() {
  try {
    const createdUser = await createTestUser(Role.MEDECIN);
    console.log('Registration succeeded!', createdUser);
  } catch (error: any) {
    console.error('Registration failed with error:');
    console.error(error);
  } finally {
    // clean up
    try {
      await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    } catch (e) { }
    await prisma.$disconnect();
  }
}

testRegister();
