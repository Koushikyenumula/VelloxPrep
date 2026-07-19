package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.entity.Resume;
import com.koushik.aiinterview.exception.FileUploadException;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.ResumeRepository;
import com.koushik.aiinterview.service.SkillExtractionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Implementation of {@link SkillExtractionService}.
 * <p>
 * Extracts text from the resume PDF using Apache PDFBox,
 * then performs case-insensitive keyword matching against a predefined skill set.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SkillExtractionServiceImpl implements SkillExtractionService {

    private final ResumeRepository resumeRepository;

    /**
     * Predefined skills to detect.
     * Key: display name, Value: compiled regex pattern (case-insensitive, word-boundary).
     * LinkedHashMap preserves insertion order for consistent results.
     */
    private static final Map<String, Pattern> SKILL_PATTERNS = new LinkedHashMap<>();

    static {
        // Each pattern uses word boundaries to avoid partial matches
        // e.g., "Java" won't match "JavaScript"
        SKILL_PATTERNS.put("Java", Pattern.compile("\\bJava\\b(?!\\s*Script)", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("Spring Boot", Pattern.compile("\\bSpring\\s*Boot\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("Hibernate", Pattern.compile("\\bHibernate\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("MySQL", Pattern.compile("\\bMySQL\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("DSA", Pattern.compile("\\b(?:DSA|Data\\s+Structures?(?:\\s+(?:and|&)\\s+Algorithms?)?)\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("React", Pattern.compile("\\bReact(?:\\.?js)?\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("JavaScript", Pattern.compile("\\bJava\\s*Script\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("HTML", Pattern.compile("\\bHTML5?\\b", Pattern.CASE_INSENSITIVE));
        SKILL_PATTERNS.put("CSS", Pattern.compile("\\bCSS3?\\b", Pattern.CASE_INSENSITIVE));
    }

    @Override
    @Transactional
    public List<String> extractSkills(Long resumeId) {

        // 1. Find the resume
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        // 2. Extract text from the PDF
        String pdfText = extractTextFromPdf(resume.getFilePath());

        // 3. Match skills against the extracted text
        List<String> detectedSkills = new ArrayList<>();
        for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
            if (entry.getValue().matcher(pdfText).find()) {
                detectedSkills.add(entry.getKey());
            }
        }

        // 4. Store extracted skills as comma-separated string
        String skillsString = String.join(", ", detectedSkills);
        resume.setExtractedSkills(skillsString);
        resumeRepository.save(resume);

        log.info("Extracted {} skills from resume {}: {}", detectedSkills.size(), resumeId, skillsString);

        return detectedSkills;
    }

    /**
     * Extract all text content from a PDF file using Apache PDFBox.
     *
     * @param filePath absolute path to the PDF file
     * @return the full text content of the PDF
     */
    private String extractTextFromPdf(String filePath) {
        Path path = Paths.get(filePath);
        try (PDDocument document = Loader.loadPDF(path.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (IOException ex) {
            log.error("Failed to extract text from PDF: {}", filePath, ex);
            throw new FileUploadException("Could not read PDF file for skill extraction", ex);
        }
    }
}
