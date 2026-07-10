"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../controllers/auth.controller");
const db_1 = __importDefault(require("../config/db"));
// Mock Prisma
jest.mock('../config/db', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        patient: {
            create: jest.fn(),
        },
        medecin: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));
// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('fake_token'),
}));
describe('Auth Controller', () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        mockReq = {
            body: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });
    describe('register', () => {
        it('should register a new patient successfully', async () => {
            mockReq.body = {
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@test.com',
                password: 'password123',
                role: 'PATIENT',
            };
            db_1.default.user.findUnique.mockResolvedValue(null);
            db_1.default.$transaction.mockImplementation(async (callback) => {
                return callback(db_1.default);
            });
            db_1.default.user.create.mockResolvedValue({
                id: 1,
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@test.com',
                role: 'PATIENT',
            });
            db_1.default.patient.create.mockResolvedValue({});
            await (0, auth_controller_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
        });
        it('should return error if email already exists', async () => {
            mockReq.body = {
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@test.com',
                password: 'password123',
                role: 'PATIENT',
            };
            db_1.default.user.findUnique.mockResolvedValue({ id: 1 });
            await (0, auth_controller_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('existe déjà') }));
        });
        it('should return error if required fields are missing', async () => {
            mockReq.body = {
                nom: 'Dupont',
                email: 'jean.dupont@test.com',
            };
            await (0, auth_controller_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('requis') }));
        });
    });
    describe('authenticate', () => {
        it('should authenticate user successfully', async () => {
            mockReq.body = {
                email: 'jean.dupont@test.com',
                password: 'password123',
            };
            const mockUser = {
                id: 1,
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@test.com',
                motDePasse: 'hashed_password',
                role: 'PATIENT',
            };
            db_1.default.user.findUnique.mockResolvedValue(mockUser);
            await (0, auth_controller_1.authenticate)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
        });
        it('should return error if user not found', async () => {
            mockReq.body = {
                email: 'nonexistent@test.com',
                password: 'password123',
            };
            db_1.default.user.findUnique.mockResolvedValue(null);
            await (0, auth_controller_1.authenticate)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Identifiants') }));
        });
    });
});
