package com.koushik.aiinterview.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a Gemini API call fails (network error, invalid response, rate limit, etc.).
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class GeminiApiException extends RuntimeException {

    public GeminiApiException(String message) {
        super(message);
    }

    public GeminiApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
