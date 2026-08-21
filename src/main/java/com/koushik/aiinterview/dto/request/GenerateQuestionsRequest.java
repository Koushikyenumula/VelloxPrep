package com.koushik.aiinterview.dto.request;

import jakarta.validation.constraints.NotBlank;
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

    private String skill; // Optional if resumeId is provided (inferred from resume skills)

    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    private Long resumeId; // Optional: If provided, generate tailored questions based on this resume
}
