package com.koushik.aiinterview.service;

/**
 * Contract for interacting with the Google Gemini API.
 * <p>
 * Provides a reusable interface for sending prompts and receiving
 * text-based responses from Gemini generative AI models.
 */
public interface GeminiService {

    /**
     * Send a prompt to Gemini and receive a text response.
     *
     * @param prompt the user prompt text
     * @return the generated text response from Gemini
     */
    String generateContent(String prompt);

    /**
     * Send a prompt with a system instruction to Gemini.
     * The system instruction guides the model's behavior and tone.
     *
     * @param systemInstruction the system-level instruction for the model
     * @param userPrompt        the user prompt text
     * @return the generated text response from Gemini
     */
    String generateContent(String systemInstruction, String userPrompt);
}
