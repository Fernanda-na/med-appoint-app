package com.medappoint.api.service;

import com.medappoint.api.dto.ChatMessageDTO;
import com.medappoint.api.model.ChatMessage;
import com.medappoint.api.model.Utilisateur;
import com.medappoint.api.repository.ChatMessageRepository;
import com.medappoint.api.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UtilisateurRepository utilisateurRepository;

    public ChatMessageDTO saveMessage(ChatMessageDTO dto) {
        Utilisateur sender = utilisateurRepository.findByEmail(dto.getExpediteurEmail())
                .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        Utilisateur recipient = utilisateurRepository.findByEmail(dto.getDestinataireEmail())
                .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));

        ChatMessage message = ChatMessage.builder()
                .contenu(dto.getContenu())
                .dateEnvoi(LocalDateTime.now())
                .expediteur(sender)
                .destinataire(recipient)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        
        return ChatMessageDTO.builder()
                .id(saved.getId())
                .contenu(saved.getContenu())
                .expediteurEmail(saved.getExpediteur().getEmail())
                .destinataireEmail(saved.getDestinataire().getEmail())
                .dateEnvoi(saved.getDateEnvoi())
                .build();
    }

    public List<ChatMessageDTO> getConversation(String user1Email, String user2Email) {
        Utilisateur user1 = utilisateurRepository.findByEmail(user1Email)
                .orElseThrow(() -> new RuntimeException("Utilisateur 1 non trouvé"));
        Utilisateur user2 = utilisateurRepository.findByEmail(user2Email)
                .orElseThrow(() -> new RuntimeException("Utilisateur 2 non trouvé"));

        return chatMessageRepository.findByConversation(user1, user2)
                .stream()
                .map(m -> ChatMessageDTO.builder()
                        .id(m.getId())
                        .contenu(m.getContenu())
                        .expediteurEmail(m.getExpediteur().getEmail())
                        .destinataireEmail(m.getDestinataire().getEmail())
                        .dateEnvoi(m.getDateEnvoi())
                        .build())
                .collect(Collectors.toList());
    }
}
