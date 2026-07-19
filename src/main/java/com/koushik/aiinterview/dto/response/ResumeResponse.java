package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for resume upload response — returns file metadata after successful upload.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeResponse {

    private Long id;
    private String fileName;
    private Long fileSize;
    private Double atsScore;
    private List<String> extractedSkills;
    private LocalDateTime uploadedAt;
}
