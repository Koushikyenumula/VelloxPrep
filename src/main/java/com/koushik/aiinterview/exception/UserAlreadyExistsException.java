package com.koushik.aiinterview.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a user registration is attempted with an email that already exists.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }

    public UserAlreadyExistsException(String fieldName, String fieldValue) {
        super(String.format("User already exists with %s: '%s'", fieldName, fieldValue));
    }
}
