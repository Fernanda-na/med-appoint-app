package com.medappoint.api.service;

import com.medappoint.api.model.Medecin;
import com.medappoint.api.model.Specialite;
import com.medappoint.api.repository.MedecinRepository;
import com.medappoint.api.repository.SpecialiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final MedecinRepository medecinRepository;
    private final SpecialiteRepository specialiteRepository;

    public List<Medecin> findAll() {
        return medecinRepository.findAll();
    }

    public List<Medecin> findBySpecialty(String specialtyName) {
        Specialite spec = specialiteRepository.findByNom(specialtyName)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée"));
        return medecinRepository.findBySpecialite(spec);
    }
    
    public List<Specialite> findAllSpecialties() {
        return specialiteRepository.findAll();
    }
}
