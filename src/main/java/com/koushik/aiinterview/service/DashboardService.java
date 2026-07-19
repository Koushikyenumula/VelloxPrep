package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.DashboardResponse;

/**
 * Contract for dashboard analytics operations.
 */
public interface DashboardService {

    /**
     * Retrieve aggregated dashboard analytics for the authenticated user.
     * Uses optimized database queries to avoid loading full entity graphs.
     *
     * @param email the authenticated user's email
     * @return response containing the dashboard analytics
     */
    ApiResponse<DashboardResponse> getDashboard(String email);
}
