package com.medappoint.api.repository;

import com.medappoint.api.model.ChatMessage;
import com.medappoint.api.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.expediteur = :user1 AND m.destinataire = :user2) OR " +
           "(m.expediteur = :user2 AND m.destinataire = :user1) " +
           "ORDER BY m.dateEnvoi ASC")
    List<ChatMessage> findByConversation(@Param("user1") Utilisateur user1, @Param("user2") Utilisateur user2);
}
