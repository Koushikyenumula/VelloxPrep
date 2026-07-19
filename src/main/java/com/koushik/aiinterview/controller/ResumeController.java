package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.ResumeHistoryResponse;
import com.koushik.aiinterview.dto.response.ResumeResponse;
import com.koushik.aiinterview.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for resume operations.
 * Base path: /api/resumes (context-path "/api" is set in application.yml).
 */
@RestController
@RequestMapping("/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    /**
     * POST /api/resumes/upload
     * Upload a PDF resume for the authenticated user.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ResumeResponse>> uploadResume(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<ResumeResponse> response = resumeService.uploadResume(file, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/resumes
     * Retrieve all resumes uploaded by the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ResumeHistoryResponse>>> getUserResumes(
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<List<ResumeHistoryResponse>> response = resumeService.getUserResumes(email);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/resumes/{id}
     * Delete a resume by ID for the authenticated user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();
        ApiResponse<Void> response = resumeService.deleteResume(id, email);
        return ResponseEntity.ok(response);
    }
}
