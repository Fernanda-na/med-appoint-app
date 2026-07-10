-- CreateTable
CREATE TABLE `teleconsultations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `dateHeure` DATETIME(3) NOT NULL,
    `motif` TEXT NOT NULL,
    `statut` ENUM('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE') NOT NULL DEFAULT 'PLANIFIEE',
    `lienVideo` VARCHAR(191) NULL,
    `duree` INTEGER NULL,
    `notesMedecin` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `datePrescription` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `medicaments` TEXT NOT NULL,
    `posologie` TEXT NOT NULL,
    `instructions` TEXT NOT NULL,
    `valide` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paiements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rendezVousId` INTEGER NULL,
    `patientId` INTEGER NOT NULL,
    `montant` DOUBLE NOT NULL,
    `datePaiement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `methode` VARCHAR(191) NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'PAYE', 'REFUSE', 'REMBOURSE') NOT NULL DEFAULT 'EN_ATTENTE',
    `reference` VARCHAR(191) NULL,

    UNIQUE INDEX `paiements_rendezVousId_key`(`rendezVousId`),
    UNIQUE INDEX `paiements_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `note` INTEGER NOT NULL,
    `commentaire` TEXT NULL,
    `dateAvis` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teleconsultations` ADD CONSTRAINT `teleconsultations_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `medecins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teleconsultations` ADD CONSTRAINT `teleconsultations_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `medecins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_rendezVousId_fkey` FOREIGN KEY (`rendezVousId`) REFERENCES `rendez_vous`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avis` ADD CONSTRAINT `avis_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `medecins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avis` ADD CONSTRAINT `avis_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
