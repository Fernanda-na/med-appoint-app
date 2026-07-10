"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = __importDefault(require("./config/db"));
const auth_1 = require("./middlewares/auth");
const auth_controller_1 = require("./controllers/auth.controller");
const doctor_controller_1 = require("./controllers/doctor.controller");
const admin_controller_1 = require("./controllers/admin.controller");
const ai_controller_1 = require("./controllers/ai.controller");
const appointment_controller_1 = require("./controllers/appointment.controller");
const profile_controller_1 = require("./controllers/profile.controller");
const chat_controller_1 = require("./controllers/chat.controller");
const twilio_service_1 = require("./services/twilio.service");
const teleconsultation_controller_1 = require("./controllers/teleconsultation.controller");
const prescription_controller_1 = require("./controllers/prescription.controller");
const payment_controller_1 = require("./controllers/payment.controller");
const review_controller_1 = require("./controllers/review.controller");
const app = (0, express_1.default)();
const port = process.env.PORT || 8081;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false,
}));
// Compression
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// CORS configuration matching typical Angular/React/Mobile needs
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files statically
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express_1.default.static(UPLOAD_DIR));
// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------
// Authentication
app.post('/api/v1/auth/register', auth_controller_1.register);
app.post('/api/v1/auth/authenticate', auth_controller_1.authenticate);
// Doctors
app.get('/api/v1/doctors', doctor_controller_1.getAllDoctors);
app.get('/api/v1/doctors/specialties', doctor_controller_1.getAllSpecialties);
app.get('/api/v1/doctors/:id/availability', doctor_controller_1.getDoctorAvailability);
app.get('/api/v1/doctors/:id/availabilities', doctor_controller_1.getDoctorAvailabilities);
app.post('/api/v1/doctors/availability', auth_1.authenticateToken, doctor_controller_1.addAvailability);
app.delete('/api/v1/doctors/availability/:id', auth_1.authenticateToken, doctor_controller_1.deleteAvailability);
// Appointments (requires token)
app.get('/api/v1/appointments/me', auth_1.authenticateToken, appointment_controller_1.getMyAppointments);
app.post('/api/v1/appointments/book', auth_1.authenticateToken, appointment_controller_1.bookAppointment);
app.patch('/api/v1/appointments/:id', auth_1.authenticateToken, appointment_controller_1.updateAppointment);
app.delete('/api/v1/appointments/:id', auth_1.authenticateToken, appointment_controller_1.cancelAppointment);
app.patch('/api/v1/appointments/:id/status', auth_1.authenticateToken, appointment_controller_1.updateAppointmentStatus);
// Profile, Documents and Notifications (requires token)
app.get('/api/v1/profile', auth_1.authenticateToken, profile_controller_1.getProfile);
app.put('/api/v1/profile', auth_1.authenticateToken, profile_controller_1.updateProfile);
app.post('/api/v1/profile/avatar', auth_1.authenticateToken, profile_controller_1.upload.single('file'), profile_controller_1.uploadAvatar);
app.get('/api/v1/profile/notifications', auth_1.authenticateToken, profile_controller_1.getNotifications);
app.patch('/api/v1/profile/notifications/:id/read', auth_1.authenticateToken, profile_controller_1.markNotificationAsRead);
app.get('/api/v1/profile/documents', auth_1.authenticateToken, profile_controller_1.getDocuments);
app.post('/api/v1/profile/documents', auth_1.authenticateToken, profile_controller_1.upload.single('file'), profile_controller_1.uploadDocument);
// Chat REST API
app.post('/api/v1/chat/send-rest', chat_controller_1.sendMessageRest);
app.get('/api/v1/chat/history', chat_controller_1.getHistory);
// Admin routes (requires admin role)
app.get('/api/v1/admin/users', auth_1.authenticateToken, admin_controller_1.getAllUsers);
app.post('/api/v1/admin/users', auth_1.authenticateToken, admin_controller_1.createUser);
app.delete('/api/v1/admin/users/:id', auth_1.authenticateToken, admin_controller_1.deleteUser);
app.post('/api/v1/admin/doctors', auth_1.authenticateToken, admin_controller_1.addDoctor);
app.put('/api/v1/admin/doctors/:id', auth_1.authenticateToken, admin_controller_1.updateDoctor);
app.delete('/api/v1/admin/doctors/:id', auth_1.authenticateToken, admin_controller_1.deleteDoctor);
app.get('/api/v1/admin/statistics', auth_1.authenticateToken, admin_controller_1.getStatistics);
app.get('/api/v1/admin/appointments', auth_1.authenticateToken, admin_controller_1.getAllAppointmentsAdmin);
// AI routes
app.post('/api/v1/ai/recommend', ai_controller_1.recommendDoctors);
app.post('/api/v1/ai/chatbot', ai_controller_1.chatbotQuery);
app.post('/api/v1/ai/analyze-feedback', ai_controller_1.analyzeFeedback);
app.post('/api/v1/ai/automated-booking', auth_1.authenticateToken, ai_controller_1.automatedBooking);
app.post('/api/v1/ai/no-show-reminder', auth_1.authenticateToken, ai_controller_1.sendNoShowReminder);
app.post('/api/v1/ai/confirm-reminder', auth_1.authenticateToken, ai_controller_1.confirmAppointmentReminder);
// Teleconsultation routes (requires token)
app.post('/api/v1/teleconsultations', auth_1.authenticateToken, teleconsultation_controller_1.createTeleconsultation);
app.get('/api/v1/teleconsultations/me', auth_1.authenticateToken, teleconsultation_controller_1.getMyTeleconsultations);
app.patch('/api/v1/teleconsultations/:id/status', auth_1.authenticateToken, teleconsultation_controller_1.updateTeleconsultationStatus);
// Prescription routes (requires token)
app.post('/api/v1/prescriptions', auth_1.authenticateToken, prescription_controller_1.createPrescription);
app.get('/api/v1/prescriptions/me', auth_1.authenticateToken, prescription_controller_1.getPatientPrescriptions);
app.get('/api/v1/prescriptions/medecin', auth_1.authenticateToken, prescription_controller_1.getMedecinPrescriptions);
// Payment routes (requires token)
app.post('/api/v1/payments', auth_1.authenticateToken, payment_controller_1.createPayment);
app.get('/api/v1/payments/me', auth_1.authenticateToken, payment_controller_1.getMyPayments);
app.patch('/api/v1/payments/:id/status', auth_1.authenticateToken, payment_controller_1.updatePaymentStatus);
// Review routes
app.post('/api/v1/reviews', auth_1.authenticateToken, review_controller_1.createReview);
app.get('/api/v1/reviews/medecin/:medecinId', review_controller_1.getMedecinReviews);
app.get('/api/v1/reviews/me', auth_1.authenticateToken, review_controller_1.getMyReviews);
// Simple Healthcheck and base path
app.get('/', (_req, res) => {
    res.json({ status: 'UP', message: 'Medical Appointment API is running.' });
});
// Create Server
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
(0, chat_controller_1.setIoInstance)(io);
// ----------------------------------------------------
// WEBSOCKETS (Socket.io)
// ----------------------------------------------------
io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);
    // A user joins a room named after their email
    socket.on('join', (email) => {
        if (email) {
            socket.join(email);
            console.log(`User ${email} joined their private room.`);
        }
    });
    // Client sends message via WebSocket
    socket.on('sendMessage', async (payload) => {
        try {
            const { expediteurEmail, destinataireEmail, contenu } = payload;
            if (!expediteurEmail || !destinataireEmail || !contenu)
                return;
            const expediteur = await db_1.default.user.findUnique({ where: { email: expediteurEmail } });
            const destinataire = await db_1.default.user.findUnique({ where: { email: destinataireEmail } });
            if (!expediteur || !destinataire)
                return;
            const message = await db_1.default.chatMessage.create({
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
        }
        catch (error) {
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
        const upcoming = await db_1.default.rendezVous.findMany({
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
            await twilio_service_1.TwilioService.sendAppointmentReminder(phone, `${rdv.patient.user.prenom} ${rdv.patient.user.nom}`, rdv.medecin.user.nom, timeStr);
        }
    }
    catch (error) {
        console.error('Scheduler error:', error);
    }
}
// Run scheduler every hour
setInterval(checkUpcomingAppointmentsAndSendSMS, 1000 * 60 * 60);
// HTTPS Configuration (Optional for development)
const sslKeyPath = path_1.default.join(__dirname, '../ssl/key.pem');
const sslCertPath = path_1.default.join(__dirname, '../ssl/cert.pem');
const useHttps = process.env.USE_HTTPS === 'true' && fs_1.default.existsSync(sslKeyPath) && fs_1.default.existsSync(sslCertPath);
// Startup Server
if (useHttps) {
    const httpsOptions = {
        key: fs_1.default.readFileSync(sslKeyPath),
        cert: fs_1.default.readFileSync(sslCertPath),
    };
    const httpsServer = https_1.default.createServer(httpsOptions, app);
    const ioHttps = new socket_io_1.Server(httpsServer, {
        cors: { origin: '*' },
    });
    (0, chat_controller_1.setIoInstance)(ioHttps);
    ioHttps.on('connection', (socket) => {
        console.log(`Socket client connected (HTTPS): ${socket.id}`);
        socket.on('join', (email) => {
            socket.join(email);
            console.log(`User ${email} joined their room`);
        });
        socket.on('message', async (data) => {
            try {
                const { expediteurEmail, destinataireEmail, contenu } = data;
                const expediteur = await db_1.default.user.findUnique({ where: { email: expediteurEmail } });
                const destinataire = await db_1.default.user.findUnique({ where: { email: destinataireEmail } });
                if (!expediteur || !destinataire) {
                    socket.emit('error', 'User not found');
                    return;
                }
                const message = await db_1.default.chatMessage.create({
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
            }
            catch (error) {
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
}
else {
    // HTTP Server (Development)
    server.listen(port, () => {
        console.log(`HTTP Server is listening on port ${port}`);
        console.log(`Note: To enable HTTPS, set USE_HTTPS=true and provide SSL certificates in ssl/ folder`);
    });
}
