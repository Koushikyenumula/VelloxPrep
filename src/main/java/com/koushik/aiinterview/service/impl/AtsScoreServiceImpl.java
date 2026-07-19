package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.entity.Resume;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.ResumeRepository;
import com.koushik.aiinterview.service.AtsScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koushik.aiinterview.service.GeminiService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Implementation of {@link AtsScoreService}.
 * <p>
 * V1: Generates a random ATS score between 60 and 95.
 * Future versions will integrate AI-based resume analysis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AtsScoreServiceImpl implements AtsScoreService {

    private final ResumeRepository resumeRepository;
    private final GeminiService geminiService;

    @Override
    @Transactional
    public Double analyzeResume(Long resumeId) {

        // 1. Find the resume
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

        // 2. Extract text from PDF
        String pdfText = extractTextFromPdf(resume.getFilePath());

        // 3. Generate AI ATS score
        double atsScore = generateAiAtsScore(pdfText);

        // 4. Store the score in the resume record
        resume.setAtsScore(atsScore);
        resumeRepository.save(resume);

        log.info("ATS score generated via AI — resumeId: {}, score: {}", resumeId, atsScore);

        return atsScore;
    }

    private String extractTextFromPdf(String filePath) {
        Path path = Paths.get(filePath);
        try (PDDocument document = Loader.loadPDF(path.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (IOException ex) {
            log.error("Failed to extract text from PDF: {}", filePath, ex);
            return ""; 
        }
    }

    private double generateAiAtsScore(String resumeText) {
        if (resumeText == null || resumeText.isBlank()) {
            return 0.0;
        }

        String systemInstruction = "You are an expert Applicant Tracking System (ATS). Analyze the provided resume text for formatting, keyword density, structure, and readability. You MUST return ONLY a valid JSON object with exactly one numeric field named \"score\" between 0.0 and 100.0 representing its ATS compatibility. Do not wrap in markdown or include any other text.";
        
        try {
            String response = geminiService.generateContent(systemInstruction, resumeText);
            
            // Clean markdown code blocks if AI wrapped the JSON
            String jsonStr = response.replaceAll("```json", "").replaceAll("```", "").trim();
            
            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(jsonStr);
            if (root.has("score")) {
                double score = root.get("score").asDouble();
                return Math.min(Math.max(score, 0.0), 100.0);
            } else {
                log.warn("Could not find 'score' field in Gemini response: {}", response);
                return 0.0;
            }
        } catch (Exception ex) {
            log.error("Failed to generate AI ATS score, falling back to 0.0", ex);
            return 0.0;
        }
    }
}
