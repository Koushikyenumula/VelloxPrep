package com.koushik.aiinterview.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerateMcqRequest {

    @NotBlank(message = "Skill is required")
    private String skill;

    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Minimum 1 question")
    @Max(value = 20, message = "Maximum 20 questions")
    private Integer questionCount;
}
