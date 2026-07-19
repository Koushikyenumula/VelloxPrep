package com.koushik.aiinterview.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmitMcqAnswerResponse {
    private Long questionId;
    private String userSelectedOption;
    private String correctOption;
    private String explanation;
    private boolean isCorrect;
}
