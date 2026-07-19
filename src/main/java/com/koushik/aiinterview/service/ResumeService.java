package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.ResumeHistoryResponse;
import com.koushik.aiinterview.dto.response.ResumeResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Contract for resume-related operations.
 */
public interface ResumeService {

    /**
     * Upload a PDF resume for the authenticated user.
     *
     * @param file  the multipart PDF file
     * @param email the authenticated user's email (extracted from JWT)
     * @return response containing the uploaded resume metadata
     */
    ApiResponse<ResumeResponse> uploadResume(MultipartFile file, String email);

    /**
     * Retrieve all resumes uploaded by the authenticated user.
     *
     * @param email the authenticated user's email (extracted from JWT)
     * @return response containing the list of resume history records
     */
    ApiResponse<List<ResumeHistoryResponse>> getUserResumes(String email);

    /**
     * Delete a resume by ID for the authenticated user.
     * Removes both the database record and the physical file.
     *
     * @param id    the resume ID
     * @param email the authenticated user's email (extracted from JWT)
     * @return success response with confirmation message
     */
    ApiResponse<Void> deleteResume(Long id, String email);
}
