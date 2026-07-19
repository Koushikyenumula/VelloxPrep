package com.koushik.aiinterview.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class McqSessionResponse {
    private Long id;
    private String skill;
    private String difficulty;
    private Double score;
    private String status;
    private LocalDateTime createdAt;
}
