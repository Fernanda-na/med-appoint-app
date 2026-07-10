import { Request, Response } from 'express';
import prisma from '../config/db';

// Une référence globale vers le serveur Socket.io sera injectée depuis index.ts pour notifier
let ioInstance: any = null;
export function setIoInstance(io: any) {
  ioInstance = io;
}

export async function sendMessageRest(req: Request, res: Response) {
  try {
    const { expediteurEmail, destinataireEmail, contenu } = req.body;

    if (!expediteurEmail || !destinataireEmail || !contenu) {
      return res.status(400).json({ message: 'Expéditeur, destinataire et contenu sont requis.' });
    }

    const expediteur = await prisma.user.findUnique({ where: { email: expediteurEmail } });
    const destinataire = await prisma.user.findUnique({ where: { email: destinataireEmail } });

    if (!expediteur || !destinataire) {
      return res.status(404).json({ message: 'Expéditeur ou destinataire non trouvé.' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        contenu,
        expediteurId: expediteur.id,
        destinataireId: destinataire.id,
      },
    });

    const dto = {
      id: message.id,
      contenu: message.contenu,
      expediteurEmail: expediteur.email,
      destinataireEmail: destinataire.email,
      dateEnvoi: message.dateEnvoi,
    };

    // WebSocket notification to the recipient room
    if (ioInstance) {
      ioInstance.to(destinataire.email).emit('message', dto);
    }

    return res.status(201).json(dto);
  } catch (error: any) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Erreur lors de l’envoi du message.', error: error.message });
  }
}

export async function getHistory(req: Request, res: Response) {
  try {
    const { currentUser, withUser } = req.query;

    if (!currentUser || !withUser || typeof currentUser !== 'string' || typeof withUser !== 'string') {
      return res.status(400).json({ message: 'currentUser et withUser sont requis.' });
    }

    const user1 = await prisma.user.findUnique({ where: { email: currentUser } });
    const user2 = await prisma.user.findUnique({ where: { email: withUser } });

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'Utilisateur(s) non trouvé(s).' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { expediteurId: user1.id, destinataireId: user2.id },
          { expediteurId: user2.id, destinataireId: user1.id },
        ],
      },
      include: {
        expediteur: { select: { email: true } },
        destinataire: { select: { email: true } },
      },
      orderBy: { dateEnvoi: 'asc' },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      contenu: m.contenu,
      expediteurEmail: m.expediteur.email,
      destinataireEmail: m.destinataire.email,
      dateEnvoi: m.dateEnvoi,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement de l’historique.', error: error.message });
  }
}
