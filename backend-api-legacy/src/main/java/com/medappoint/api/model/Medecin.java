package com.medappoint.api.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("MEDECIN")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Medecin extends Utilisateur {

    private String lieuConsultation;

    @ManyToOne
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;
}
