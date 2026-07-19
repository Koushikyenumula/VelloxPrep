package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the evaluation result of a user's answer to a question.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerEvaluationResponse {

    private Long id;
    private String userAnswer;
    private String aiFeedback;
    private Double score;
    private Long questionId;
}
