package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin-facing DTO with aggregated platform-wide statistics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformStatisticsResponse {

    private long totalUsers;
    private long totalResumes;
    private long totalSessions;
    private long completedSessions;
    private double averageScore;
    private double bestScore;
}
