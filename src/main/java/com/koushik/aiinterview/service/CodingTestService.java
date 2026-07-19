package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.CodingRunDto;
import com.koushik.aiinterview.dto.CodingSessionDto;
import com.koushik.aiinterview.dto.CodingSubmissionDto;
import com.koushik.aiinterview.entity.CodingSession;
import com.koushik.aiinterview.entity.CodingSubmission;
import com.koushik.aiinterview.entity.CodingSubmission;

public interface CodingTestService {
    CodingSession generateCodingSession(String email, String domain);
    java.util.Map<String, String> runCode(String email, Long sessionId, Long questionId, CodingRunDto runDto);
    CodingSubmission submitCode(String email, Long sessionId, Long questionId, CodingSubmissionDto submissionDto);
    void finishSession(String email, Long sessionId, int warningsCount);
    CodingSession getSessionDetails(String email, Long sessionId);
}
