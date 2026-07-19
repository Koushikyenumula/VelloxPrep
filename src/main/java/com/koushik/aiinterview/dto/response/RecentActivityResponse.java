package com.koushik.aiinterview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing a single recent user activity (interview or resume upload).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentActivityResponse {

    private String type;
    private String title;
    private Double score;
    private String status;
    private LocalDateTime timestamp;
}
