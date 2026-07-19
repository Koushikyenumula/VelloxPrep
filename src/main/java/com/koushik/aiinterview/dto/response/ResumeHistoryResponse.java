package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for resume history list — lightweight view with ATS score.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeHistoryResponse {

    private Long id;
    private String fileName;
    private Double atsScore;
}
