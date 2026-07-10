import { Request, Response } from 'express';
import { register, authenticate } from '../controllers/auth.controller';
import prisma from '../config/db';

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
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

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

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@test.com',
        role: 'PATIENT',
      });
      (prisma.patient.create as jest.Mock).mockResolvedValue({});

      await register(mockReq as Request, mockRes as Response);

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

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      await register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('existe déjà') })
      );
    });

    it('should return error if required fields are missing', async () => {
      mockReq.body = {
        nom: 'Dupont',
        email: 'jean.dupont@test.com',
      };

      await register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('requis') })
      );
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

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      mockReq.body = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authenticate(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Identifiants') })
      );
    });
  });
});
