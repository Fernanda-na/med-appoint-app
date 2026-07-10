package com.medappoint.api.dto;

import com.medappoint.api.model.StatutRdv;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponse {
    private Long id;
    private String patientNom;
    private String medecinNom;
    private String specialite;
    private LocalDateTime dateHeureDebut;
    private LocalDateTime dateHeureFin;
    private String motif;
    private StatutRdv statut;
}
