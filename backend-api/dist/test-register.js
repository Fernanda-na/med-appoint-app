"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("./config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function createTestUser(role) {
    const nom = 'TestNom';
    const prenom = 'TestPrenom';
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    console.log('Starting transaction...');
    const createdUser = await db_1.default.$transaction(async (tx) => {
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
        if (role === client_1.Role.PATIENT) {
            console.log('Creating patient record...');
            const patient = await tx.patient.create({
                data: {
                    userId: user.id,
                    numeroPatient: `PAT-${Date.now()}`,
                },
            });
            console.log('Patient created:', patient.id);
            return { ...user, patientId: patient.id };
        }
        else if (role === client_1.Role.MEDECIN) {
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
        const createdUser = await createTestUser(client_1.Role.MEDECIN);
        console.log('Registration succeeded!', createdUser);
    }
    catch (error) {
        console.error('Registration failed with error:');
        console.error(error);
    }
    finally {
        // clean up
        try {
            await db_1.default.user.deleteMany({ where: { email: 'test@example.com' } });
        }
        catch (e) { }
        await db_1.default.$disconnect();
    }
}
testRegister();
