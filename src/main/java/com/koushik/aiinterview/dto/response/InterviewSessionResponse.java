package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight DTO representing an interview session in history lists.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSessionResponse {

    private Long id;
    private String skill;
    private String difficulty;
    private Double score;
    private String status;
    private LocalDateTime createdAt;
}
