package com.medappoint.api.repository;

import com.medappoint.api.model.DocumentMedical;
import com.medappoint.api.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentMedicalRepository extends JpaRepository<DocumentMedical, Long> {
    List<DocumentMedical> findByPatientOrderByDateUploadDesc(Patient patient);
}
