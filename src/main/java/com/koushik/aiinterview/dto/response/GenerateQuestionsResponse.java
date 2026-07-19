package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for the generate-questions API response.
 * Contains the session ID and the list of generated questions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateQuestionsResponse {

    private Long sessionId;
    private String skill;
    private String difficulty;
    private int totalQuestions;
    private List<InterviewQuestionResponse> questions;
}
