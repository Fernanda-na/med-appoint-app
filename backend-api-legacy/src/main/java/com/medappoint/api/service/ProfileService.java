package com.medappoint.api.service;

import com.medappoint.api.model.DocumentMedical;
import com.medappoint.api.model.Patient;
import com.medappoint.api.model.Utilisateur;
import com.medappoint.api.repository.DocumentMedicalRepository;
import com.medappoint.api.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UtilisateurRepository userRepository;
    private final DocumentMedicalRepository documentRepository;
    private final FileStorageService fileStorageService;

    public String updateAvatar(MultipartFile file) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String fileName = fileStorageService.storeFile(file);
        user.setAvatarUrl(fileName);
        userRepository.save(user);

        return fileName;
    }

    public Utilisateur getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    public List<DocumentMedical> getPatientDocuments() {
        Utilisateur user = getCurrentUser();
        if (!(user instanceof Patient)) {
            throw new RuntimeException("Seuls les patients ont des documents médicaux.");
        }
        return documentRepository.findByPatientOrderByDateUploadDesc((Patient) user);
    }

    public DocumentMedical uploadDocument(String nom, MultipartFile file) {
        Utilisateur user = getCurrentUser();
        if (!(user instanceof Patient)) {
            throw new RuntimeException("Seuls les patients peuvent uploader des documents.");
        }

        String fileName = fileStorageService.storeFile(file);
        
        DocumentMedical doc = DocumentMedical.builder()
                .nom(nom)
                .type(file.getContentType())
                .url(fileName)
                .dateUpload(LocalDateTime.now())
                .patient((Patient) user)
                .build();
        
        return documentRepository.save(doc);
    }
}
