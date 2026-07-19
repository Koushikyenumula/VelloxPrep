package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.ResumeHistoryResponse;
import com.koushik.aiinterview.dto.response.ResumeResponse;
import com.koushik.aiinterview.entity.Resume;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.FileUploadException;
import com.koushik.aiinterview.service.AtsScoreService;
import com.koushik.aiinterview.service.SkillExtractionService;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.ResumeRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.ResumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.util.StringUtils;
import org.springframework.util.unit.DataSize;

/**
 * Implementation of {@link ResumeService}.
 * Handles PDF file validation, storage to the uploads folder, and metadata persistence.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final AtsScoreService atsScoreService;
    private final SkillExtractionService skillExtractionService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${spring.servlet.multipart.max-file-size:10MB}")
    private DataSize maxFileSize;

    private static final String PDF_CONTENT_TYPE = "application/pdf";

    @Override
    @Transactional
    public ApiResponse<ResumeResponse> uploadResume(MultipartFile file, String email) {

        // 1. Validate the file
        validateFile(file);

        // 2. Find the authenticated user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 3. Generate a unique file name to prevent collisions and sanitize original filename
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf");
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;

        // 4. Create the upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException ex) {
            throw new FileUploadException("Could not create upload directory", ex);
        }

        // 5. Save the file to disk
        Path targetLocation = uploadPath.resolve(uniqueFileName);
        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileUploadException("Could not store file: " + originalFileName, ex);
        }

        // 6. Save metadata to the database
        Resume resume = Resume.builder()
                .fileName(originalFileName)
                .filePath(targetLocation.toString())
                .user(user)
                .build();

        Resume savedResume = resumeRepository.save(resume);

        // 7. Generate ATS score
        Double atsScore = atsScoreService.analyzeResume(savedResume.getId());

        // 8. Extract skills from the PDF
        java.util.List<String> extractedSkills = skillExtractionService.extractSkills(savedResume.getId());

        log.info("Resume uploaded successfully — file: {}, user: {}, atsScore: {}, skills: {}",
                originalFileName, email, atsScore, extractedSkills);

        // 9. Build the response
        ResumeResponse resumeResponse = ResumeResponse.builder()
                .id(savedResume.getId())
                .fileName(savedResume.getFileName())
                .fileSize(file.getSize())
                .atsScore(atsScore)
                .extractedSkills(extractedSkills)
                .uploadedAt(savedResume.getUploadedAt())
                .build();

        return ApiResponse.created("Resume uploaded successfully", resumeResponse);
    }

    /**
     * Validate that the file is a non-empty PDF within the size limit.
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("Please select a file to upload");
        }

        if (!PDF_CONTENT_TYPE.equals(file.getContentType())) {
            throw new FileUploadException("Only PDF files are allowed. Received: " + file.getContentType());
        }

        if (file.getSize() > maxFileSize.toBytes()) {
            throw new FileUploadException(
                    String.format("File size exceeds the maximum limit of %d MB", maxFileSize.toMegabytes()));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ResumeHistoryResponse>> getUserResumes(String email) {

        // 1. Fetch all resumes for the user
        List<Resume> resumes = resumeRepository.findByUserEmail(email);

        // 2. Map entities to DTOs
        List<ResumeHistoryResponse> resumeHistory = resumes.stream()
                .map(resume -> ResumeHistoryResponse.builder()
                        .id(resume.getId())
                        .fileName(resume.getFileName())
                        .atsScore(resume.getAtsScore())
                        .build())
                .toList();

        log.info("Fetched {} resumes for user: {}", resumeHistory.size(), email);

        return ApiResponse.success("Resumes retrieved successfully", resumeHistory);
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteResume(Long id, String email) {

        // 1. Find the resume
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", id));

        // 2. Verify the resume belongs to the authenticated user
        if (!resume.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("Resume", "id", id);
        }

        // 3. Delete the physical file from disk
        try {
            Path filePath = Paths.get(resume.getFilePath());
            Files.deleteIfExists(filePath);
            log.info("Deleted physical file: {}", resume.getFilePath());
        } catch (IOException ex) {
            log.warn("Could not delete physical file: {} — {}", resume.getFilePath(), ex.getMessage());
        }

        // 4. Delete the database record
        resumeRepository.delete(resume);

        log.info("Resume deleted successfully — id: {}, user: {}", id, email);

        return ApiResponse.success("Resume deleted successfully");
    }
}
