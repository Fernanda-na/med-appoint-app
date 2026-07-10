package com.medappoint.api.repository;

import com.medappoint.api.model.Medecin;
import com.medappoint.api.model.Patient;
import com.medappoint.api.model.RendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    List<RendezVous> findByPatient(Patient patient);
    List<RendezVous> findByMedecin(Medecin medecin);
    List<RendezVous> findByMedecinAndDateHeureDebutBetween(Medecin medecin, LocalDateTime start, LocalDateTime end);
    List<RendezVous> findByDateHeureDebutBetween(LocalDateTime start, LocalDateTime end);
}
