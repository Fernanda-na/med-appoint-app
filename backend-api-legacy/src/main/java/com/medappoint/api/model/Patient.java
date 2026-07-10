package com.medappoint.api.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("PATIENT")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Patient extends Utilisateur {
    
    private String numeroPatient;
    
    private String historiqueMedical;
}
