import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

export interface UserPayload {
  id: number;
  email: string;
  role: 'PATIENT' | 'MEDECIN' | 'ADMINISTRATEUR' | 'RECEPTIONNISTE';
  patientId?: number;
  medecinId?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token manquant. Authentification requise.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Token invalide ou expire.' });
      return;
    }

    req.user = decoded as UserPayload;
    next();
  });
}

export function requireRole(roles: Array<'PATIENT' | 'MEDECIN' | 'ADMINISTRATEUR' | 'RECEPTIONNISTE'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifie.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Acces interdit. Permissions insuffisantes.' });
      return;
    }

    next();
  };
}
