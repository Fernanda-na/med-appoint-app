package com.medappoint.api.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true); // true = HTML
            helper.setFrom("no-reply@medappoint.com");

            mailSender.send(message);
        } catch (MessagingException e) {
            // Dans un environnement de dev, on log simplement pour ne pas bloquer le thread si SMTP n'est pas configuré
            System.err.println("Erreur d'envoi d'e-mail à " + to + ": " + e.getMessage());
        }
    }

    public void sendAppointmentConfirmation(String to, String patientName, String doctorName, String date) {
        String content = "<h1>Confirmation de Rendez-vous</h1>" +
                "<p>Bonjour " + patientName + ",</p>" +
                "<p>Votre rendez-vous avec le <strong>Dr. " + doctorName + "</strong> a bien été enregistré.</p>" +
                "<p><strong>Date :</strong> " + date + "</p>" +
                "<p>Merci d'utiliser MedAppoint !</p>";
        sendEmail(to, "Confirmation de votre rendez-vous MedAppoint", content);
    }

    public void sendReminderEmail(String to, String patientName, String doctorName, String date) {
        String content = "<h1>Rappel de Rendez-vous</h1>" +
                "<p>Bonjour " + patientName + ",</p>" +
                "<p>Ceci est un rappel pour votre rendez-vous de demain avec le <strong>Dr. " + doctorName + "</strong>.</p>" +
                "<p><strong>Heure :</strong> " + date + "</p>" +
                "<p>À demain !</p>";
        sendEmail(to, "Rappel : Votre rendez-vous MedAppoint demain", content);
    }
}
