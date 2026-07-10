"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const isConfigured = accountSid &&
    authToken &&
    fromNumber &&
    !accountSid.startsWith('ACXXXXXX') &&
    authToken !== 'your_auth_token';
let client = null;
if (isConfigured) {
    try {
        client = (0, twilio_1.default)(accountSid, authToken);
    }
    catch (error) {
        console.error('Failed to initialize Twilio client:', error);
    }
}
class TwilioService {
    /**
     * Sends an SMS notification. Fallbacks to console logging if credentials are missing/default.
     */
    static async sendSMS(to, message) {
        if (client && fromNumber) {
            try {
                await client.messages.create({
                    body: message,
                    from: fromNumber,
                    to: to,
                });
                console.log(`[Twilio SMS] Message sent to ${to}: ${message}`);
                return true;
            }
            catch (error) {
                console.error(`[Twilio SMS] Failed to send SMS to ${to}:`, error);
                return false;
            }
        }
        else {
            console.log(`[Twilio SMS SIMULATION] To: ${to} | Message: ${message}`);
            return true;
        }
    }
    static async sendAppointmentConfirmation(to, patientName, doctorName, dateStr) {
        const message = `Bonjour ${patientName}, votre rendez-vous avec le Dr. ${doctorName} est confirme pour le ${dateStr}. Merci d'utiliser MedAppoint!`;
        return this.sendSMS(to, message);
    }
    static async sendAppointmentReminder(to, patientName, doctorName, timeStr) {
        const message = `Rappel: Bonjour ${patientName}, vous avez rdv demain avec le Dr. ${doctorName} a ${timeStr}.`;
        return this.sendSMS(to, message);
    }
}
exports.TwilioService = TwilioService;
