package com.medappoint.api.controller;

import com.medappoint.api.dto.ChatMessageDTO;
import com.medappoint.api.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/send")
    public void sendMessage(@Payload ChatMessageDTO chatMessageDTO) {
        ChatMessageDTO savedDto = chatService.saveMessage(chatMessageDTO);
        
        // Envoyer au destinataire spécifique via sa queue privée
        messagingTemplate.convertAndSendToUser(
                chatMessageDTO.getDestinataireEmail(),
                "/queue/messages",
                savedDto
        );
    }

    @PostMapping("/send-rest")
    public ResponseEntity<ChatMessageDTO> sendMessageRest(@RequestBody ChatMessageDTO chatMessageDTO) {
        ChatMessageDTO savedDto = chatService.saveMessage(chatMessageDTO);
        
        // On notifie quand même via WS pour les autres clients
        messagingTemplate.convertAndSendToUser(
                chatMessageDTO.getDestinataireEmail(),
                "/queue/messages",
                savedDto
        );
        
        return ResponseEntity.ok(savedDto);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessageDTO>> getHistory(
            @RequestParam String withUser,
            @RequestParam String currentUser
    ) {
        return ResponseEntity.ok(chatService.getConversation(currentUser, withUser));
    }
}
