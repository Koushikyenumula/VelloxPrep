package com.koushik.aiinterview.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koushik.aiinterview.dto.CodingRunDto;
import com.koushik.aiinterview.dto.CodingSubmissionDto;
import com.koushik.aiinterview.entity.*;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.CodingQuestionRepository;
import com.koushik.aiinterview.repository.CodingSessionRepository;
import com.koushik.aiinterview.repository.CodingSubmissionRepository;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.CodingTestService;
import com.koushik.aiinterview.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodingTestServiceImpl implements CodingTestService {

    private final CodingSessionRepository codingSessionRepository;
    private final CodingQuestionRepository codingQuestionRepository;
    private final CodingSubmissionRepository codingSubmissionRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CodingSession generateCodingSession(String email, String domain) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = CodingSession.builder()
                .user(user)
                .domain(domain)
                .status(SessionStatus.IN_PROGRESS)
                .build();
        
        session = codingSessionRepository.save(session);

        String systemInstruction = "You are an expert technical interviewer.";
        String prompt = "Generate 4 coding interview questions for the domain: " + domain + ". " +
                "The questions should consist of exactly 1 Easy, 2 Medium, and 1 Hard difficulty. " +
                "Return ONLY a JSON array of objects with the keys: 'title', 'description' (include the problem statement), 'difficulty' (EASY, MEDIUM, or HARD), 'baseCode' (a Java class and method skeleton with proper \\n newline characters and indentation), and 'testCases' (an array of exactly 3 objects with 'input' and 'expectedOutput' keys representing standard test cases).";

        String jsonResponse = geminiService.generateContent(systemInstruction, prompt);

        // Extract JSON array robustly
        int startIndex = jsonResponse.indexOf("[");
        int endIndex = jsonResponse.lastIndexOf("]");
        if (startIndex != -1 && endIndex != -1) {
            jsonResponse = jsonResponse.substring(startIndex, endIndex + 1).trim();
        }

        try {
            List<Map<String, Object>> questions = objectMapper.readValue(jsonResponse, new TypeReference<List<Map<String, Object>>>() {});
            
            for (Map<String, Object> qData : questions) {
                String testCasesStr = "[]";
                if (qData.get("testCases") != null) {
                    testCasesStr = objectMapper.writeValueAsString(qData.get("testCases"));
                }
                
                CodingQuestion question = CodingQuestion.builder()
                        .title((String) qData.get("title"))
                        .description((String) qData.get("description"))
                        .difficulty(Difficulty.valueOf(((String) qData.get("difficulty")).toUpperCase()))
                        .baseCode((String) qData.get("baseCode"))
                        .testCasesJson(testCasesStr)
                        .codingSession(session)
                        .build();
                codingQuestionRepository.save(question);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI generated questions: " + e.getMessage(), e);
        }

        return session;
    }

    @Override
    @Transactional
    public java.util.Map<String, String> runCode(String email, Long sessionId, Long questionId, CodingRunDto runDto) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        CodingQuestion question = codingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        String systemInstruction = "You are a precise code execution engine simulator.";
        String prompt = "Simulate the execution of the following " + runDto.getLanguage() + " code for the problem: '" + question.getTitle() + "'.\n" +
                "User Code: \n" + runDto.getUserCode() + "\n\n" +
                "Custom Input Test Cases (if any): \n" + runDto.getCustomInput() + "\n\n" +
                "Run the code in your mind against the custom input (or default edge cases if empty). " +
                "Return a JSON object with two keys: 'output' (the simulated stdout console output) and 'error' (any simulated compilation or runtime errors, or empty string if success).";

        String jsonResponse = geminiService.generateContent(systemInstruction, prompt);

        int startIndex = jsonResponse.indexOf("{");
        int endIndex = jsonResponse.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1) {
            jsonResponse = jsonResponse.substring(startIndex, endIndex + 1).trim();
        }

        try {
            return objectMapper.readValue(jsonResponse, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return Map.of("output", "", "error", "Simulation failed: " + e.getMessage() + "\nRaw response:\n" + jsonResponse);
        }
    }

    @Override
    @Transactional
    public CodingSubmission submitCode(String email, Long sessionId, Long questionId, CodingSubmissionDto submissionDto) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        CodingQuestion question = codingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        String systemInstruction = "You are an expert technical interviewer evaluating code.";
        String prompt = "Evaluate the following " + submissionDto.getLanguage() + " code for the problem: '" + question.getTitle() + "'.\\n" +
                "Description: " + question.getDescription() + "\\n" +
                "User Code: \\n" + submissionDto.getUserCode() + "\\n\\n" +
                "Analyze the correctness, time complexity, space complexity, and edge cases. " +
                "Return a JSON object with two keys: 'score' (a number from 0 to 100) and 'feedback' (a detailed string of your feedback).";

        String jsonResponse = geminiService.generateContent(systemInstruction, prompt);

        if (jsonResponse.startsWith("```json")) {
            jsonResponse = jsonResponse.substring(7, jsonResponse.length() - 3).trim();
        } else if (jsonResponse.startsWith("```")) {
            jsonResponse = jsonResponse.substring(3, jsonResponse.length() - 3).trim();
        }

        double score = 0.0;
        String feedback = "";

        try {
            Map<String, Object> result = objectMapper.readValue(jsonResponse, new TypeReference<Map<String, Object>>() {});
            score = Double.parseDouble(result.get("score").toString());
            feedback = result.get("feedback").toString();
        } catch (Exception e) {
            feedback = "Failed to parse AI feedback. Code was recorded.";
        }

        CodingSubmission submission = CodingSubmission.builder()
                .codingSession(session)
                .codingQuestion(question)
                .userCode(submissionDto.getUserCode())
                .language(submissionDto.getLanguage())
                .aiFeedback(feedback)
                .score(score)
                .build();

        return codingSubmissionRepository.save(submission);
    }

    @Override
    @Transactional
    public void finishSession(String email, Long sessionId, int warningsCount) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        session.setWarningCount(warningsCount);
        session.setStatus(SessionStatus.COMPLETED);

        // Calculate total score
        List<CodingSubmission> submissions = codingSubmissionRepository.findAll();
        double totalScore = 0;
        int count = 0;
        for (CodingSubmission sub : submissions) {
            if (sub.getCodingSession().getId().equals(sessionId)) {
                totalScore += sub.getScore();
                count++;
            }
        }
        
        session.setScore(count > 0 ? totalScore / 4 : 0.0); // Assuming 4 questions max
        codingSessionRepository.save(session);
    }

    @Override
    @Transactional(readOnly = true)
    public CodingSession getSessionDetails(String email, Long sessionId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        CodingSession session = codingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
                
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        // Ensure lazy collections are initialized if needed, though they are fetched usually or we return DTOs in Controller.
        session.getCodingQuestions().size();
        session.getCodingSubmissions().size();
        
        return session;
    }
}
