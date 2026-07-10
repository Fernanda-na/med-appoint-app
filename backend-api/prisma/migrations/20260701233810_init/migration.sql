-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NULL,
    `role` ENUM('PATIENT', 'MEDECIN', 'ADMINISTRATEUR', 'RECEPTIONNISTE') NOT NULL DEFAULT 'PATIENT',
    `avatarUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `numeroPatient` VARCHAR(191) NOT NULL,
    `historiqueMedical` TEXT NULL,

    UNIQUE INDEX `patients_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medecins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lieuConsultation` VARCHAR(191) NULL,
    `specialiteId` INTEGER NULL,

    UNIQUE INDEX `medecins_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `specialites_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rendez_vous` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `medecinId` INTEGER NOT NULL,
    `dateHeureDebut` DATETIME(3) NOT NULL,
    `dateHeureFin` DATETIME(3) NOT NULL,
    `motif` VARCHAR(191) NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'VALIDE', 'REFUSE', 'ANNULE') NOT NULL DEFAULT 'EN_ATTENTE',
    `notesMedecin` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disponibilites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `jourSemaine` VARCHAR(191) NOT NULL,
    `heureDebut` VARCHAR(191) NOT NULL,
    `heureFin` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents_medicaux` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `dateUpload` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `patientId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lu` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contenu` TEXT NOT NULL,
    `dateEnvoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expediteurId` INTEGER NOT NULL,
    `destinataireId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medecins` ADD CONSTRAINT `medecins_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medecins` ADD CONSTRAINT `medecins_specialiteId_fkey` FOREIGN KEY (`specialiteId`) REFERENCES `specialites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rendez_vous` ADD CONSTRAINT `rendez_vous_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rendez_vous` ADD CONSTRAINT `rendez_vous_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `medecins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disponibilites` ADD CONSTRAINT `disponibilites_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `medecins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents_medicaux` ADD CONSTRAINT `documents_medicaux_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_expediteurId_fkey` FOREIGN KEY (`expediteurId`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_destinataireId_fkey` FOREIGN KEY (`destinataireId`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
