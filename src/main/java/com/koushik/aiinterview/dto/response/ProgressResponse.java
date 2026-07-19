package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO representing the user's aggregated progress and performance analytics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressResponse {

    private int totalInterviews;
    private Double averageScore;
    private Double accuracy;
    private Double improvementPercentage;
    private Double bestScore;
    private List<String> strongSkills;
    private List<String> weakSkills;
}
