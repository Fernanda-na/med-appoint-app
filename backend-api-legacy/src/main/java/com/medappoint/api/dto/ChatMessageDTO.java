package com.medappoint.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private Long id;
    private String contenu;
    private String expediteurEmail;
    private String destinataireEmail;
    private LocalDateTime dateEnvoi;
}
