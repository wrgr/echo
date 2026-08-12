/**
 * Google Gemini provider — BYOK, direct from the browser.
 *
 * Modern advances over the original backend (which called Gemini 2.0 Flash via
 * raw Node https and regex-stripped code fences):
 *  - Current models (default gemini-2.5-flash).
 *  - Structured output: responseMimeType 'application/json' + responseSchema,
 *    so JSON comes back schema-constrained instead of regex-cleaned.
 *
 * The user's own key is sent directly to Google's Generative Language API
 * (CORS-enabled for browser use with a key).
 */

import { parseJson, toGeminiSchema } from '../schemas.js';
import { createLocalProvider } from '../localProvider.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_OUTPUT_TOKENS = 2048;

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast, low cost)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (highest fidelity)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (legacy)' },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function createGeminiProvider({ apiKey, model }) {
  if (!apiKey) throw new Error('A Google Gemini API key is required. Add one in Settings.');
  const modelId = model || DEFAULT_GEMINI_MODEL;

  async function call(prompt, schema) {
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    };
    if (schema) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = toGeminiSchema(schema);
    }

    let res;
    try {
      res = await fetch(`${ENDPOINT}/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      });
    } catch (err) {
      throw new Error(`Could not reach Gemini: ${err.message}`);
    }

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 400 || res.status === 403) {
        throw new Error('Gemini rejected the request — the API key may be invalid or lack access. Check Settings.');
      }
      if (res.status === 429) throw new Error('Gemini rate limit reached. Wait a moment and try again.');
      throw new Error(`Gemini request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new Error('Gemini returned no content.');
    return text;
  }

  return createLocalProvider({
    generateJson: async (prompt, schema) => parseJson(await call(prompt, schema)),
    generateText: (prompt) => call(prompt, null),
  });
}
