package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Admin-facing DTO representing a resume with its owner's information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResumeResponse {

    private Long id;
    private String fileName;
    private Double atsScore;
    private List<String> extractedSkills;
    private LocalDateTime uploadedAt;

    // ── Owner info (visible only to admins) ─────────────────────────────
    private String userName;
    private String userEmail;
}
