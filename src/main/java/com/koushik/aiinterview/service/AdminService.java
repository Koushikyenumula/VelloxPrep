package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.response.*;

import java.util.List;

/**
 * Service interface for admin-only operations.
 * All methods require the caller to have the ADMIN role.
 */
public interface AdminService {

    /**
     * Retrieve all registered users with summary counts.
     */
    ApiResponse<List<AdminUserResponse>> getAllUsers();

    /**
     * Retrieve all resumes across the platform with owner info.
     */
    ApiResponse<List<AdminResumeResponse>> getAllResumes();

    /**
     * Retrieve all interview sessions across the platform with owner info.
     */
    ApiResponse<List<AdminInterviewSessionResponse>> getAllInterviewSessions();

    /**
     * Retrieve aggregated platform-wide statistics.
     */
    ApiResponse<PlatformStatisticsResponse> getPlatformStatistics();

    /**
     * Delete a user and all their associated data (resumes, sessions, progress).
     *
     * @param userId the ID of the user to delete
     */
    ApiResponse<Void> deleteUser(Long userId);
}
