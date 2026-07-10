"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initReminderJob = initReminderJob;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../config/db"));
const twilio_service_1 = require("../services/twilio.service");
/**
 * Sends SMS reminders for appointments scheduled for tomorrow.
 * Also creates an in-app notification for each patient.
 */
async function sendDailyReminders() {
    console.log('[Cron] Running daily appointment reminder job...');
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
        if (upcoming.length === 0) {
            console.log('[Cron] No upcoming appointments for tomorrow. Nothing to do.');
            return;
        }
        console.log(`[Cron] Found ${upcoming.length} appointments for tomorrow. Sending reminders...`);
        for (const rdv of upcoming) {
            const patientName = `${rdv.patient.user.prenom} ${rdv.patient.user.nom}`;
            const doctorName = `${rdv.medecin.user.prenom} ${rdv.medecin.user.nom}`;
            const phone = rdv.patient.user.telephone;
            const hours = rdv.dateHeureDebut.getHours().toString().padStart(2, '0');
            const minutes = rdv.dateHeureDebut.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            const dateStr = rdv.dateHeureDebut.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            });
            // 1. Send SMS reminder if phone number is available
            if (phone) {
                await twilio_service_1.TwilioService.sendAppointmentReminder(phone, patientName, doctorName, timeStr);
            }
            else {
                console.log(`[Cron] Patient ${patientName} has no phone number. Skipping SMS.`);
            }
            // 2. Create in-app notification for the patient
            await db_1.default.notification.create({
                data: {
                    titre: '🔔 Rappel de rendez-vous',
                    message: `Bonjour ${patientName}, vous avez un rendez-vous demain ${dateStr} à ${timeStr} avec le Dr. ${doctorName}. N'oubliez pas !`,
                    userId: rdv.patient.userId,
                },
            });
            // 3. Also notify the doctor about their schedule for tomorrow
            await db_1.default.notification.create({
                data: {
                    titre: '📅 Rappel de planning',
                    message: `Rappel : Vous avez un rendez-vous demain ${dateStr} à ${timeStr} avec le patient ${patientName} (Motif : ${rdv.motif}).`,
                    userId: rdv.medecin.userId,
                },
            });
        }
        console.log(`[Cron] Daily reminder job completed. ${upcoming.length} reminder(s) sent.`);
    }
    catch (error) {
        console.error('[Cron] Error during reminder job:', error);
    }
}
/**
 * Initializes the cron job.
 * Scheduled to run every day at 08:00 AM server time.
 * Cron syntax: 'second minute hour day month weekday'
 *   '0 8 * * *' => At 08:00 every day
 */
function initReminderJob() {
    // Run every day at 8:00 AM
    node_cron_1.default.schedule('0 8 * * *', sendDailyReminders, {
        timezone: 'Africa/Douala', // Adapt to your local timezone if needed (e.g., 'Europe/Paris')
    });
    console.log('[Cron] Daily reminder job scheduled for 08:00 AM (Africa/Douala timezone).');
    // For testing purposes: also run once on startup after a short delay
    if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
            console.log('[Cron] Running a test pass on startup (dev mode only)...');
            sendDailyReminders();
        }, 5000);
    }
}
