package com.medappoint.api.repository;

import com.medappoint.api.model.Disponibilite;
import com.medappoint.api.model.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisponibiliteRepository extends JpaRepository<Disponibilite, Long> {
    List<Disponibilite> findByMedecin(Medecin medecin);
    List<Disponibilite> findByMedecinAndJourSemaine(Medecin medecin, String jourSemaine);
}
