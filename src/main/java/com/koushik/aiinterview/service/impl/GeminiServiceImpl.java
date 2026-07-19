package com.koushik.aiinterview.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.koushik.aiinterview.exception.GeminiApiException;
import com.koushik.aiinterview.service.GeminiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Implementation of {@link GeminiService}.
 * <p>
 * Uses Spring's {@link RestClient} to call the Google Gemini
 * {@code generateContent} endpoint. Handles request building,
 * response parsing, and error handling.
 *
 * <h3>Gemini API Request Structure:</h3>
 * <pre>{@code
 * {
 *   "system_instruction": {
 *     "parts": [{ "text": "..." }]
 *   },
 *   "contents": [{
 *     "parts": [{ "text": "..." }]
 *   }],
 *   "generationConfig": {
 *     "temperature": 0.7,
 *     "maxOutputTokens": 2048
 *   }
 * }
 * }</pre>
 */
@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {

    private final RestClient geminiRestClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final double temperature;
    private final int maxOutputTokens;

    public GeminiServiceImpl(
            @Qualifier("geminiRestClient") RestClient geminiRestClient,
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model:gemini-2.0-flash}") String model,
            @Value("${app.gemini.temperature:0.7}") double temperature,
            @Value("${app.gemini.max-output-tokens:2048}") int maxOutputTokens) {

        this.geminiRestClient = geminiRestClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.temperature = temperature;
        this.maxOutputTokens = maxOutputTokens;
    }

    @Override
    public String generateContent(String prompt) {
        return generateContent(null, prompt);
    }

    @Override
    public String generateContent(String systemInstruction, String userPrompt) {

        // 1. Build the request body
        String requestBody = buildRequestBody(systemInstruction, userPrompt);

        log.debug("Calling Gemini API — model: {}, prompt length: {}", model, userPrompt.length());

        try {
            // 2. Make the API call
            String responseBody = geminiRestClient.post()
                    .uri("/v1beta/models/{model}:generateContent?key={apiKey}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            // 3. Parse and return the response text
            String result = parseResponse(responseBody);

            log.debug("Gemini response received — length: {}", result.length());

            return result;

        } catch (RestClientException ex) {
            log.error("Gemini API call failed: {}", ex.getMessage(), ex);
            throw new GeminiApiException("Failed to communicate with Gemini API: " + ex.getMessage(), ex);
        }
    }

    // ── Request Builder ──────────────────────────────────────────────────

    /**
     * Build the JSON request body for the Gemini generateContent endpoint.
     *
     * @param systemInstruction optional system instruction (can be null)
     * @param userPrompt        the user's prompt text
     * @return JSON string request body
     */
    private String buildRequestBody(String systemInstruction, String userPrompt) {
        try {
            ObjectNode root = objectMapper.createObjectNode();

            // System instruction (optional)
            if (systemInstruction != null && !systemInstruction.isBlank()) {
                ObjectNode systemNode = objectMapper.createObjectNode();
                systemNode.put("role", "system");
                ArrayNode systemParts = objectMapper.createArrayNode();
                systemParts.add(objectMapper.createObjectNode().put("text", systemInstruction));
                systemNode.set("parts", systemParts);
                root.set("system_instruction", systemNode);
            }

            // User content
            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode userContent = objectMapper.createObjectNode();
            ArrayNode userParts = objectMapper.createArrayNode();
            userParts.add(objectMapper.createObjectNode().put("text", userPrompt));
            userContent.set("parts", userParts);
            contents.add(userContent);
            root.set("contents", contents);

            // Generation config
            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("temperature", temperature);
            generationConfig.put("maxOutputTokens", maxOutputTokens);
            generationConfig.put("responseMimeType", "application/json");
            root.set("generationConfig", generationConfig);

            return objectMapper.writeValueAsString(root);

        } catch (Exception ex) {
            throw new GeminiApiException("Failed to build Gemini request body", ex);
        }
    }

    // ── Response Parser ──────────────────────────────────────────────────

    /**
     * Parse the Gemini API response and extract the generated text.
     *
     * <h4>Response structure:</h4>
     * <pre>{@code
     * {
     *   "candidates": [{
     *     "content": {
     *       "parts": [{ "text": "..." }]
     *     }
     *   }]
     * }
     * }</pre>
     *
     * @param responseBody the raw JSON response string
     * @return the extracted text content
     */
    private String parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            // Check for API-level errors
            if (root.has("error")) {
                JsonNode error = root.get("error");
                String errorMessage = error.has("message")
                        ? error.get("message").asText()
                        : "Unknown Gemini API error";
                throw new GeminiApiException("Gemini API error: " + errorMessage);
            }

            // Extract text from candidates[0].content.parts[0].text
            JsonNode candidates = root.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new GeminiApiException("Gemini API returned no candidates");
            }

            JsonNode firstCandidate = candidates.get(0);
            JsonNode content = firstCandidate.get("content");
            if (content == null) {
                throw new GeminiApiException("Gemini API candidate has no content");
            }

            JsonNode parts = content.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new GeminiApiException("Gemini API content has no parts");
            }

            // Concatenate all text parts
            StringBuilder textBuilder = new StringBuilder();
            for (JsonNode part : parts) {
                if (part.has("text")) {
                    textBuilder.append(part.get("text").asText());
                }
            }

            String result = textBuilder.toString().trim();
            if (result.isEmpty()) {
                throw new GeminiApiException("Gemini API returned empty text");
            }

            return result;

        } catch (GeminiApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new GeminiApiException("Failed to parse Gemini API response", ex);
        }
    }
}
