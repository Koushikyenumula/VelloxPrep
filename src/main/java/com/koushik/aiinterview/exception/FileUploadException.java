package com.koushik.aiinterview.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a file upload operation fails (e.g., invalid file type, I/O error, size exceeded).
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class FileUploadException extends RuntimeException {

    public FileUploadException(String message) {
        super(message);
    }

    public FileUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
