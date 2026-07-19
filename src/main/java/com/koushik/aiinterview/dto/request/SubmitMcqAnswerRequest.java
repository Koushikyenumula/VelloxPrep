package com.koushik.aiinterview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SubmitMcqAnswerRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    @NotNull(message = "Question ID is required")
    private Long questionId;

    @NotBlank(message = "Selected option is required")
    @Pattern(regexp = "^[A-D]$", message = "Option must be A, B, C, or D")
    private String selectedOption;
}
