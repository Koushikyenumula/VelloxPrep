package com.koushik.aiinterview.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class McqQuestionResponse {
    private Long id;
    private String question;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    
    // Included only if already answered or session is completed
    private String userSelectedOption; 
    private String correctOption;
    private String explanation;
}
