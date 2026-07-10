package com.medappoint.api.repository;

import com.medappoint.api.model.Medecin;
import com.medappoint.api.model.Specialite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    List<Medecin> findBySpecialite(Specialite specialite);
}
