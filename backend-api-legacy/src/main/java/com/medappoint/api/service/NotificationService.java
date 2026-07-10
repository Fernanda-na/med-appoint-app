package com.medappoint.api.service;

import com.medappoint.api.model.Notification;
import com.medappoint.api.model.Utilisateur;
import com.medappoint.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void sendNotification(Utilisateur user, String titre, String message) {
        Notification notification = Notification.builder()
                .utilisateur(user)
                .titre(titre)
                .message(message)
                .dateCreation(LocalDateTime.now())
                .lu(false)
                .build();
        notificationRepository.save(notification);
    }

    public List<Notification> getMyNotifications(Utilisateur user) {
        return notificationRepository.findByUtilisateurOrderByDateCreationDesc(user);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        notification.setLu(true);
        notificationRepository.save(notification);
    }
}
