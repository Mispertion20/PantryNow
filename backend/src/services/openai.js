import OpenAI from 'openai';
import { env } from '../config/env.js';

let client = null;

const getClient = () => {
  if (!env.openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return client;
};

/**
 * Send a chat completion request to OpenAI.
 *
 * @param {string} systemPrompt - Instructions that set the AI's behaviour.
 * @param {string} userMessage  - The user-facing prompt / question.
 * @param {object} [options]
 * @param {string} [options.model]       - Model name (default: gpt-4o-mini).
 * @param {number} [options.temperature] - Sampling temperature 0-2 (default: 0.7).
 * @param {number} [options.maxTokens]   - Max tokens in the response (default: 1024).
 * @param {boolean} [options.json]       - When true, request JSON output mode.
 * @returns {Promise<string>} The assistant's reply text.
 */
export const chatCompletion = async (systemPrompt, userMessage, options = {}) => {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 1024,
    json = false,
  } = options;

  const openai = getClient();

  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
};

/**
 * Parse a JSON response from the AI, with safe fallback.
 *
 * @param {string} text - Raw text from chatCompletion.
 * @returns {object|null} Parsed JSON or null on failure.
 */
export const parseJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
};
