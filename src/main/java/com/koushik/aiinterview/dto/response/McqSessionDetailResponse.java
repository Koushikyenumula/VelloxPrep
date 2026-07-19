package com.koushik.aiinterview.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class McqSessionDetailResponse {
    private Long id;
    private String skill;
    private String difficulty;
    private Double score;
    private String status;
    private LocalDateTime createdAt;
    private List<McqQuestionResponse> questions;
}
