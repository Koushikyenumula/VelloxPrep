package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed DTO representing a full interview session, including questions and evaluations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSessionDetailResponse {

    private Long id;
    private String skill;
    private String difficulty;
    private Double score;
    private String status;
    private LocalDateTime createdAt;
    private List<InterviewQuestionResponse> questions;
    private List<AnswerEvaluationResponse> evaluations;
}
