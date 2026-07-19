package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single generated interview question.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestionResponse {

    private Long id;
    private String question;
    private String expectedAnswer;
    private String skill;
    private String difficulty;
}
