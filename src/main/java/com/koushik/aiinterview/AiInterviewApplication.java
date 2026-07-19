package com.koushik.aiinterview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the VelloxPrep Platform.
 */
@SpringBootApplication
public class AiInterviewApplication {

    public static void main(String[] args) {
        System.out.println("=== DEBUG: DB_URL ENV VAR IS: " + System.getenv("DB_URL") + " ===");
        SpringApplication.run(AiInterviewApplication.class, args);
    }
}
