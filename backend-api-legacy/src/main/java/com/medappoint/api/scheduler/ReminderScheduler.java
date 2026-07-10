package com.medappoint.api.scheduler;

import com.medappoint.api.model.RendezVous;
import com.medappoint.api.repository.RendezVousRepository;
import com.medappoint.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final RendezVousRepository rendezVousRepository;
    private final EmailService emailService;

    // S'exécute toutes les heures
    @Scheduled(cron = "0 0 * * * *")
    public void sendUpcomingReminders() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        LocalDateTime tomorrowStart = tomorrow.withHour(0).withMinute(0);
        LocalDateTime tomorrowEnd = tomorrow.withHour(23).withMinute(59);

        // Trouver les rendez-vous de demain
        List<RendezVous> upcomingAppointments = rendezVousRepository
                .findByDateHeureDebutBetween(tomorrowStart, tomorrowEnd);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

        for (RendezVous rdv : upcomingAppointments) {
            emailService.sendReminderEmail(
                    rdv.getPatient().getEmail(),
                    rdv.getPatient().getPrenom(),
                    rdv.getMedecin().getPrenom() + " " + rdv.getMedecin().getNom(),
                    rdv.getDateHeureDebut().format(formatter)
            );
        }
    }
}
