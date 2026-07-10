package com.medappoint.api.controller;

import com.medappoint.api.model.DocumentMedical;
import com.medappoint.api.model.Notification;
import com.medappoint.api.model.Utilisateur;
import com.medappoint.api.service.NotificationService;
import com.medappoint.api.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final NotificationService notificationService;

    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String fileName = profileService.updateAvatar(file);
        return ResponseEntity.ok(Map.of("avatarUrl", fileName));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications() {
        Utilisateur user = profileService.getCurrentUser();
        return ResponseEntity.ok(notificationService.getMyNotifications(user));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentMedical>> getDocuments() {
        return ResponseEntity.ok(profileService.getPatientDocuments());
    }

    @PostMapping("/documents")
    public ResponseEntity<DocumentMedical> uploadDocument(
            @RequestParam("nom") String nom,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(profileService.uploadDocument(nom, file));
    }
}
