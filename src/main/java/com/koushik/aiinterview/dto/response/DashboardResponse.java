package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO representing the user's dashboard analytics snapshot.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    private long totalInterviews;
    private Double averageScore;
    private Double accuracy;
    private Double bestScore;
    private long totalResumes;
    private Double latestAtsScore;
    private List<RecentActivityResponse> recentActivities;
}
