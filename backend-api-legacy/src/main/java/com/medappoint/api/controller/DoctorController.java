package com.medappoint.api.controller;

import com.medappoint.api.model.Medecin;
import com.medappoint.api.model.Specialite;
import com.medappoint.api.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ResponseEntity<List<Medecin>> getAllDoctors(
            @RequestParam(required = false) String specialty
    ) {
        if (specialty != null && !specialty.isEmpty()) {
            return ResponseEntity.ok(doctorService.findBySpecialty(specialty));
        }
        return ResponseEntity.ok(doctorService.findAll());
    }

    @GetMapping("/specialties")
    public ResponseEntity<List<Specialite>> getAllSpecialties() {
        return ResponseEntity.ok(doctorService.findAllSpecialties());
    }
}
