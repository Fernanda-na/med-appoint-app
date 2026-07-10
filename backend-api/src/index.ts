import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import prisma from './config/db';
import { authenticateToken } from './middlewares/auth';
import { register, authenticate } from './controllers/auth.controller';
import { getAllDoctors, getAllSpecialties, getDoctorAvailability, addAvailability, deleteAvailability, getDoctorAvailabilities } from './controllers/doctor.controller';
import {
  getAllUsers,
  createUser,
  deleteUser,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  getStatistics,
  getAllAppointmentsAdmin,
} from './controllers/admin.controller';
import { recommendDoctors, chatbotQuery, analyzeFeedback, automatedBooking, sendNoShowReminder, confirmAppointmentReminder } from './controllers/ai.controller';
import { getMyAppointments, bookAppointment, updateAppointment, cancelAppointment, updateAppointmentStatus } from './controllers/appointment.controller';
import {
  uploadAvatar,
  getNotifications,
  markNotificationAsRead,
  getDocuments,
  uploadDocument,
  upload,
  updateProfile,
  getProfile,
} from './controllers/profile.controller';
import { sendMessageRest, getHistory, setIoInstance } from './controllers/chat.controller';
import { TwilioService } from './services/twilio.service';
import { createTeleconsultation, getMyTeleconsultations, updateTeleconsultationStatus } from './controllers/teleconsultation.controller';
import { createPrescription, getPatientPrescriptions, getMedecinPrescriptions } from './controllers/prescription.controller';
import { createPayment, getMyPayments, updatePaymentStatus } from './controllers/payment.controller';
import { createReview, getMedecinReviews, getMyReviews } from './controllers/review.controller';

const app = express();
const port = process.env.PORT || 8081;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration matching typical Angular/React/Mobile needs
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Authentication
app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/authenticate', authenticate);

// Doctors
app.get('/api/v1/doctors', getAllDoctors);
app.get('/api/v1/doctors/specialties', getAllSpecialties);
app.get('/api/v1/doctors/:id/availability', getDoctorAvailability);
app.get('/api/v1/doctors/:id/availabilities', getDoctorAvailabilities);
app.post('/api/v1/doctors/availability', authenticateToken as any, addAvailability as any);
app.delete('/api/v1/doctors/availability/:id', authenticateToken as any, deleteAvailability as any);

// Appointments (requires token)
app.get('/api/v1/appointments/me', authenticateToken as any, getMyAppointments as any);
app.post('/api/v1/appointments/book', authenticateToken as any, bookAppointment as any);
app.patch('/api/v1/appointments/:id', authenticateToken as any, updateAppointment as any);
app.delete('/api/v1/appointments/:id', authenticateToken as any, cancelAppointment as any);
app.patch('/api/v1/appointments/:id/status', authenticateToken as any, updateAppointmentStatus as any);

// Profile, Documents and Notifications (requires token)
app.get('/api/v1/profile', authenticateToken as any, getProfile as any);
app.put('/api/v1/profile', authenticateToken as any, updateProfile as any);
app.post('/api/v1/profile/avatar', authenticateToken as any, upload.single('file'), uploadAvatar as any);
app.get('/api/v1/profile/notifications', authenticateToken as any, getNotifications as any);
app.patch('/api/v1/profile/notifications/:id/read', authenticateToken as any, markNotificationAsRead as any);
app.get('/api/v1/profile/documents', authenticateToken as any, getDocuments as any);
app.post('/api/v1/profile/documents', authenticateToken as any, upload.single('file'), uploadDocument as any);

// Chat REST API
app.post('/api/v1/chat/send-rest', sendMessageRest);
app.get('/api/v1/chat/history', getHistory);

// Admin routes (requires admin role)
app.get('/api/v1/admin/users', authenticateToken as any, getAllUsers as any);
app.post('/api/v1/admin/users', authenticateToken as any, createUser as any);
app.delete('/api/v1/admin/users/:id', authenticateToken as any, deleteUser as any);
app.post('/api/v1/admin/doctors', authenticateToken as any, addDoctor as any);
app.put('/api/v1/admin/doctors/:id', authenticateToken as any, updateDoctor as any);
app.delete('/api/v1/admin/doctors/:id', authenticateToken as any, deleteDoctor as any);
app.get('/api/v1/admin/statistics', authenticateToken as any, getStatistics as any);
app.get('/api/v1/admin/appointments', authenticateToken as any, getAllAppointmentsAdmin as any);

// AI routes
app.post('/api/v1/ai/recommend', recommendDoctors);
app.post('/api/v1/ai/chatbot', chatbotQuery);
app.post('/api/v1/ai/analyze-feedback', analyzeFeedback);
app.post('/api/v1/ai/automated-booking', authenticateToken as any, automatedBooking as any);
app.post('/api/v1/ai/no-show-reminder', authenticateToken as any, sendNoShowReminder as any);
app.post('/api/v1/ai/confirm-reminder', authenticateToken as any, confirmAppointmentReminder as any);

// Teleconsultation routes (requires token)
app.post('/api/v1/teleconsultations', authenticateToken as any, createTeleconsultation as any);
app.get('/api/v1/teleconsultations/me', authenticateToken as any, getMyTeleconsultations as any);
app.patch('/api/v1/teleconsultations/:id/status', authenticateToken as any, updateTeleconsultationStatus as any);

// Prescription routes (requires token)
app.post('/api/v1/prescriptions', authenticateToken as any, createPrescription as any);
app.get('/api/v1/prescriptions/me', authenticateToken as any, getPatientPrescriptions as any);
app.get('/api/v1/prescriptions/medecin', authenticateToken as any, getMedecinPrescriptions as any);

// Payment routes (requires token)
app.post('/api/v1/payments', authenticateToken as any, createPayment as any);
app.get('/api/v1/payments/me', authenticateToken as any, getMyPayments as any);
app.patch('/api/v1/payments/:id/status', authenticateToken as any, updatePaymentStatus as any);

// Review routes
app.post('/api/v1/reviews', authenticateToken as any, createReview as any);
app.get('/api/v1/reviews/medecin/:medecinId', getMedecinReviews);
app.get('/api/v1/reviews/me', authenticateToken as any, getMyReviews as any);

// Simple Healthcheck and base path
app.get('/', (_req, res) => {
  res.json({ status: 'UP', message: 'Medical Appointment API is running.' });
});

// Create Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setIoInstance(io);

// ----------------------------------------------------
// WEBSOCKETS (Socket.io)
// ----------------------------------------------------
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // A user joins a room named after their email
  socket.on('join', (email: string) => {
    if (email) {
      socket.join(email);
      console.log(`User ${email} joined their private room.`);
    }
  });

  // Client sends message via WebSocket
  socket.on('sendMessage', async (payload: { expediteurEmail: string; destinataireEmail: string; contenu: string }) => {
    try {
      const { expediteurEmail, destinataireEmail, contenu } = payload;
      if (!expediteurEmail || !destinataireEmail || !contenu) return;

      const expediteur = await prisma.user.findUnique({ where: { email: expediteurEmail } });
      const destinataire = await prisma.user.findUnique({ where: { email: destinataireEmail } });

      if (!expediteur || !destinataire) return;

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

      // Emit to recipient and echo to sender
      io.to(destinataire.email).emit('message', dto);
      io.to(expediteur.email).emit('message', dto);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// ----------------------------------------------------
// REMINDER SCHEDULER (Every hour)
// ----------------------------------------------------
async function checkUpcomingAppointmentsAndSendSMS() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const upcoming = await prisma.rendezVous.findMany({
      where: {
        dateHeureDebut: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        statut: { not: 'ANNULE' },
      },
      include: {
        patient: { include: { user: true } },
        medecin: { include: { user: true } },
      },
    });

    for (const rdv of upcoming) {
      const phone = rdv.patient.user.telephone || rdv.patient.user.email;
      const hours = rdv.dateHeureDebut.getHours().toString().padStart(2, '0');
      const minutes = rdv.dateHeureDebut.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      await TwilioService.sendAppointmentReminder(
        phone,
        `${rdv.patient.user.prenom} ${rdv.patient.user.nom}`,
        rdv.medecin.user.nom,
        timeStr
      );
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
}

// Run scheduler every hour
setInterval(checkUpcomingAppointmentsAndSendSMS, 1000 * 60 * 60);

// HTTPS Configuration (Optional for development)
const sslKeyPath = path.join(__dirname, '../ssl/key.pem');
const sslCertPath = path.join(__dirname, '../ssl/cert.pem');

const useHttps = process.env.USE_HTTPS === 'true' && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

// Startup Server
if (useHttps) {
  const httpsOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };
  
  const httpsServer = https.createServer(httpsOptions, app);
  const ioHttps = new Server(httpsServer, {
    cors: { origin: '*' },
  });
  
  setIoInstance(ioHttps);
  
  ioHttps.on('connection', (socket) => {
    console.log(`Socket client connected (HTTPS): ${socket.id}`);
    socket.on('join', (email) => {
      socket.join(email);
      console.log(`User ${email} joined their room`);
    });
  
    socket.on('message', async (data) => {
      try {
        const { expediteurEmail, destinataireEmail, contenu } = data;
        const expediteur = await prisma.user.findUnique({ where: { email: expediteurEmail } });
        const destinataire = await prisma.user.findUnique({ where: { email: destinataireEmail } });
  
        if (!expediteur || !destinataire) {
          socket.emit('error', 'User not found');
          return;
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
  
        ioHttps.to(destinataireEmail).emit('message', dto);
        ioHttps.to(expediteurEmail).emit('message', dto);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
  
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected (HTTPS): ${socket.id}`);
    });
  });
  
  httpsServer.listen(8443, () => {
    console.log(`HTTPS Server is listening on port 8443`);
  });
} else {
  // HTTP Server (Development)
  server.listen(port, () => {
    console.log(`HTTP Server is listening on port ${port}`);
    console.log(`Note: To enable HTTPS, set USE_HTTPS=true and provide SSL certificates in ssl/ folder`);
  });
}
