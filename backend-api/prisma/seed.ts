import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing database
  await prisma.chatMessage.deleteMany({});
  await prisma.documentMedical.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.rendezVous.deleteMany({});
  await prisma.disponibilite.deleteMany({});
  await prisma.medecin.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.specialite.deleteMany({});

  // 2. Create Specialties
  const generaliste = await prisma.specialite.create({
    data: { nom: 'Généraliste', description: 'Médecine générale et de famille.' },
  });
  const cardiologue = await prisma.specialite.create({
    data: { nom: 'Cardiologie', description: 'Maladies du cœur et des vaisseaux.' },
  });
  const pediatre = await prisma.specialite.create({
    data: { nom: 'Pédiatrie', description: 'Santé et développement des enfants.' },
  });
  await prisma.specialite.create({
    data: { nom: 'Dermatologie', description: 'Maladies de la peau.' },
  });
  await prisma.specialite.create({
    data: { nom: 'Ophtalmologie', description: 'Troubles de la vision et maladies oculaires.' },
  });

  console.log('Specialties created.');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Create Patient
  const patientUser = await prisma.user.create({
    data: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'patient@test.com',
      motDePasse: hashedPassword,
      telephone: '+33612345678',
      role: 'PATIENT',
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      numeroPatient: 'PAT-12345',
      historiqueMedical: 'Pas d’allergie connue. Suivi annuel standard.',
    },
  });

  console.log('Patient created:', patientUser.email);

  // 4. Create Doctor 1 (Généraliste)
  const doctorUser1 = await prisma.user.create({
    data: {
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'doctor@test.com',
      motDePasse: hashedPassword,
      telephone: '+33687654321',
      role: 'MEDECIN',
    },
  });

  const doctor1 = await prisma.medecin.create({
    data: {
      userId: doctorUser1.id,
      lieuConsultation: 'Cabinet de Paris, 15 Rue de la Paix',
      specialiteId: generaliste.id,
    },
  });

  // Create Availabilities for Doctor 1
  const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
  for (const day of days) {
    await prisma.disponibilite.create({
      data: {
        medecinId: doctor1.id,
        jourSemaine: day,
        heureDebut: '09:00',
        heureFin: '17:00',
      },
    });
  }

  console.log('Doctor 1 (Généraliste) created:', doctorUser1.email);

  // 5. Create Doctor 2 (Cardiologue)
  const doctorUser2 = await prisma.user.create({
    data: {
      nom: 'Dubois',
      prenom: 'Sophie',
      email: 'doctor2@test.com',
      motDePasse: hashedPassword,
      telephone: '+33611223344',
      role: 'MEDECIN',
    },
  });

  const doctor2 = await prisma.medecin.create({
    data: {
      userId: doctorUser2.id,
      lieuConsultation: 'Clinique Cardiovasculaire, Lyon',
      specialiteId: cardiologue.id,
    },
  });

  // Create Availabilities for Doctor 2
  for (const day of ['MARDI', 'JEUDI']) {
    await prisma.disponibilite.create({
      data: {
        medecinId: doctor2.id,
        jourSemaine: day,
        heureDebut: '10:00',
        heureFin: '16:00',
      },
    });
  }

  console.log('Doctor 2 (Cardiologue) created:', doctorUser2.email);

  // 6. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      nom: 'Admin',
      prenom: 'System',
      email: 'admin@test.com',
      motDePasse: hashedPassword,
      telephone: '+33600000000',
      role: 'ADMINISTRATEUR',
    },
  });

  console.log('Admin created:', adminUser.email);

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
