package com.koushik.aiinterview.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koushik.aiinterview.dto.request.GenerateQuestionsRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.dto.response.GenerateQuestionsResponse;
import com.koushik.aiinterview.dto.response.InterviewQuestionResponse;
import com.koushik.aiinterview.entity.Difficulty;
import com.koushik.aiinterview.entity.InterviewQuestion;
import com.koushik.aiinterview.entity.InterviewSession;
import com.koushik.aiinterview.entity.SessionStatus;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.GeminiApiException;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.InterviewSessionRepository;
import com.koushik.aiinterview.repository.ResumeRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.GeminiService;
import com.koushik.aiinterview.service.InterviewQuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of {@link InterviewQuestionService}.
 * <p>
 * Uses Gemini AI to generate technical interview questions,
 * parses the structured JSON response, and persists everything
 * to the database linked to an interview session.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewQuestionServiceImpl implements InterviewQuestionService {

    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_INSTRUCTION = """
            You are a technical interview question generator.
            You must respond ONLY with a valid JSON array — no markdown, no code fences, no extra text.
            Each element in the array must be a JSON object with exactly two fields:
            - "question": the interview question text
            - "expectedAnswer": a concise, ideal answer to the question
            """;

    private static final String PROMPT_TEMPLATE = """
            Generate exactly 10 technical interview questions for the skill "%s" at "%s" difficulty level.
            
            Respond with a JSON array of 10 objects. Example format:
            [
              {
                "question": "What is ...?",
                "expectedAnswer": "It is ..."
              }
            ]
            """;

    private static final String RESUME_PROMPT_TEMPLATE = """
            You are conducting a tailored interview for a candidate based on their resume.
            Generate exactly 10 technical interview questions for the role/skill "%s" at "%s" difficulty level.
            
            Please strongly tailor the questions to the candidate's experience and projects listed in their resume:
            --- RESUME CONTENT START ---
            %s
            --- RESUME CONTENT END ---
            
            Respond with a JSON array of 10 objects. Example format:
            [
              {
                "question": "What is ...?",
                "expectedAnswer": "It is ..."
              }
            ]
            """;

    @Override
    @Transactional
    public ApiResponse<GenerateQuestionsResponse> generateQuestions(
            GenerateQuestionsRequest request, String email) {

        // 1. Validate difficulty
        Difficulty difficulty = parseDifficulty(request.getDifficulty());
        String skill = request.getSkill().trim();

        // 2. Find the authenticated user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 3. Create an interview session
        InterviewSession session = InterviewSession.builder()
                .skill(skill)
                .difficulty(difficulty)
                .status(SessionStatus.IN_PROGRESS)
                .user(user)
                .build();

        // 4. Call Gemini API
        String prompt;
        if (request.getResumeId() != null) {
            com.koushik.aiinterview.entity.Resume resume = resumeRepository.findById(request.getResumeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", request.getResumeId().toString()));
            if (!resume.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized to access this resume");
            }
            prompt = String.format(RESUME_PROMPT_TEMPLATE, skill, difficulty.name(), resume.getExtractedSkills());
        } else {
            prompt = String.format(PROMPT_TEMPLATE, skill, difficulty.name());
        }

        String geminiResponse = geminiService.generateContent(SYSTEM_INSTRUCTION, prompt);

        // 5. Parse the JSON response into questions
        List<InterviewQuestion> questions = parseQuestions(geminiResponse, skill, difficulty, session);

        // 6. Add questions to session and persist
        questions.forEach(session::addQuestion);
        InterviewSession savedSession = sessionRepository.save(session);

        log.info("Generated {} questions for skill: {}, difficulty: {}, sessionId: {}",
                questions.size(), skill, difficulty, savedSession.getId());

        // 7. Build the response
        List<InterviewQuestionResponse> questionResponses = savedSession.getInterviewQuestions().stream()
                .map(q -> InterviewQuestionResponse.builder()
                        .id(q.getId())
                        .question(q.getQuestion())
                        .expectedAnswer(q.getExpectedAnswer())
                        .skill(q.getSkill())
                        .difficulty(q.getDifficulty().name())
                        .build())
                .toList();

        GenerateQuestionsResponse response = GenerateQuestionsResponse.builder()
                .sessionId(savedSession.getId())
                .skill(skill)
                .difficulty(difficulty.name())
                .totalQuestions(questionResponses.size())
                .questions(questionResponses)
                .build();

        return ApiResponse.created("Interview questions generated successfully", response);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Parse and validate the difficulty string into the {@link Difficulty} enum.
     */
    private Difficulty parseDifficulty(String difficultyStr) {
        try {
            return Difficulty.valueOf(difficultyStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid difficulty: '" + difficultyStr + "'. Must be one of: EASY, MEDIUM, HARD");
        }
    }

    /**
     * Parse the Gemini JSON response into a list of {@link InterviewQuestion} entities.
     * Handles the case where Gemini wraps the JSON in markdown code fences.
     */
    private List<InterviewQuestion> parseQuestions(
            String geminiResponse, String skill, Difficulty difficulty, InterviewSession session) {

        // Robustly extract the JSON array from the response
        String jsonString = geminiResponse;
        int startIndex = jsonString.indexOf('[');
        int endIndex = jsonString.lastIndexOf(']');
        
        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
        } else {
            log.error("Failed to find a JSON array in Gemini response: {}", geminiResponse);
            throw new GeminiApiException("Invalid JSON array format returned by AI.");
        }
        try {
            JsonNode arrayNode = objectMapper.readTree(jsonString);

            if (!arrayNode.isArray()) {
                throw new GeminiApiException("Gemini response is not a JSON array");
            }

            List<InterviewQuestion> questions = new ArrayList<>();
            for (JsonNode node : arrayNode) {
                String questionText = node.has("question")
                        ? node.get("question").asText() : "";
                String expectedAnswer = node.has("expectedAnswer")
                        ? node.get("expectedAnswer").asText() : "";

                if (!questionText.isBlank()) {
                    InterviewQuestion question = InterviewQuestion.builder()
                            .question(questionText)
                            .expectedAnswer(expectedAnswer)
                            .skill(skill)
                            .difficulty(difficulty)
                            .interviewSession(session)
                            .build();
                    questions.add(question);
                }
            }

            if (questions.isEmpty()) {
                throw new GeminiApiException("Gemini response contained no valid questions");
            }

            return questions;

        } catch (JsonProcessingException ex) {
            log.error("Failed to parse Gemini response as JSON: {}", geminiResponse, ex);
            throw new GeminiApiException("Failed to parse AI-generated questions", ex);
        }
    }
}
