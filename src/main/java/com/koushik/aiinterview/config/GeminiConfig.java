package com.koushik.aiinterview.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

/**
 * Configuration for the Google Gemini API client.
 * <p>
 * Provides a pre-configured {@link RestClient} bean with the
 * Gemini base URL and default headers.
 */
@Configuration
public class GeminiConfig {

    @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com}")
    private String baseUrl;

    /**
     * Creates a RestClient pre-configured for Gemini API calls.
     * The API key is passed as a query parameter per-request (not as a header)
     * to follow the Gemini API convention.
     */
    @Bean
    public RestClient geminiRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
