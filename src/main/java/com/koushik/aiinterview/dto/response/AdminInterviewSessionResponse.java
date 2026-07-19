package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Admin-facing DTO representing an interview session with its owner's information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminInterviewSessionResponse {

    private Long id;
    private String skill;
    private String difficulty;
    private Double score;
    private String status;
    private LocalDateTime createdAt;

    // ── Owner info (visible only to admins) ─────────────────────────────
    private String userName;
    private String userEmail;
}
