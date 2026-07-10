package com.medappoint.api.repository;

import com.medappoint.api.model.Notification;
import com.medappoint.api.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur);
}
