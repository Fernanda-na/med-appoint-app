package com.medappoint.api.service;

import com.medappoint.api.dto.AppointmentResponse;
import com.medappoint.api.dto.BookingRequest;
import com.medappoint.api.model.*;
import com.medappoint.api.repository.DisponibiliteRepository;
import com.medappoint.api.repository.RendezVousRepository;
import com.medappoint.api.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final RendezVousRepository appointmentRepository;
    private final UtilisateurRepository userRepository;
    private final DisponibiliteRepository availabilityRepository;

    public List<AppointmentResponse> getMyAppointments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        List<RendezVous> appointments;
        if (user instanceof Patient) {
            appointments = appointmentRepository.findByPatient((Patient) user);
        } else if (user instanceof Medecin) {
            appointments = appointmentRepository.findByMedecin((Medecin) user);
        } else {
            appointments = List.of();
        }

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AppointmentResponse bookAppointment(BookingRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Patient patient = (Patient) userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        Medecin medecin = (Medecin) userRepository.findById(request.getMedecinId())
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));

        // 1. Vérifier si le jour et l'heure sont dans les disponibilités
        String jourSemaine = request.getDateHeureDebut().getDayOfWeek().name(); // MONDAY, TUESDAY... (Adaptation FR possible)
        // Note: Java DayOfWeek is English by default. Simplification: conversion to match existing DB days.
        String jourFR = translateDayToFrench(jourSemaine);
        
        LocalTime requestedTime = request.getDateHeureDebut().toLocalTime();
        List<Disponibilite> availabilities = availabilityRepository.findByMedecinAndJourSemaine(medecin, jourFR);
        
        boolean isAvailable = availabilities.stream().anyMatch(a -> 
            !requestedTime.isBefore(a.getHeureDebut()) && requestedTime.isBefore(a.getHeureFin())
        );

        if (!isAvailable) {
            throw new RuntimeException("Le médecin n'est pas disponible sur ce créneau.");
        }

        // 2. Vérifier les conflits
        LocalDateTime start = request.getDateHeureDebut();
        LocalDateTime end = start.plusMinutes(30); // Créneau fixe de 30 min
        
        List<RendezVous> conflicts = appointmentRepository.findByMedecinAndDateHeureDebutBetween(medecin, start, end);
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Ce créneau est déjà réservé.");
        }

        // 3. Créer le rendez-vous
        RendezVous appointment = RendezVous.builder()
                .patient(patient)
                .medecin(medecin)
                .dateHeureDebut(start)
                .dateHeureFin(end)
                .motif(request.getMotif())
                .statut(StatutRdv.EN_ATTENTE)
                .build();

        return mapToResponse(appointmentRepository.save(appointment));
    }

    private String translateDayToFrench(String englishDay) {
        switch (englishDay) {
            case "MONDAY": return "LUNDI";
            case "TUESDAY": return "MARDI";
            case "WEDNESDAY": return "MERCREDI";
            case "THURSDAY": return "JEUDI";
            case "FRIDAY": return "VENDREDI";
            case "SATURDAY": return "SAMEDI";
            case "SUNDAY": return "DIMANCHE";
            default: return englishDay;
        }
    }

    private AppointmentResponse mapToResponse(RendezVous appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientNom(appointment.getPatient().getNom() + " " + appointment.getPatient().getPrenom())
                .medecinNom("Dr. " + appointment.getMedecin().getNom())
                .specialite(appointment.getMedecin().getSpecialite() != null ? appointment.getMedecin().getSpecialite().getNom() : "Généraliste")
                .dateHeureDebut(appointment.getDateHeureDebut())
                .dateHeureFin(appointment.getDateHeureFin())
                .motif(appointment.getMotif())
                .statut(appointment.getStatut())
                .build();
    }
}
