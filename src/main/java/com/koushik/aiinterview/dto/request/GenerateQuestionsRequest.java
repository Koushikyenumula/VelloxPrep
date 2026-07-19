package com.koushik.aiinterview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for requesting AI-generated interview questions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateQuestionsRequest {

    @NotBlank(message = "Skill is required")
    private String skill;

    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    private Long resumeId; // Optional: If provided, generate tailored questions based on this resume
}
