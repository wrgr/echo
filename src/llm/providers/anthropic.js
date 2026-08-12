/**
 * Anthropic (Claude) provider — BYOK, direct from the browser.
 *
 * Modern advances over the original Gemini backend:
 *  - Official @anthropic-ai/sdk instead of hand-rolled HTTPS.
 *  - Structured outputs (output_config.format = json_schema) guarantee the
 *    encounter/score JSON shape — no regex fence-stripping.
 *  - Current models (default Claude Haiku 4.5; Sonnet 5 / Opus 4.8 selectable).
 *
 * BYOK note: the user's own key is used directly from their browser via
 * `dangerouslyAllowBrowser`. That is the accepted BYOK pattern (the key is the
 * user's, entered locally); we surface a warning in the Settings UI.
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseJson } from '../schemas.js';
import { createLocalProvider } from '../localProvider.js';

const MAX_TOKENS = 2048;

export const ANTHROPIC_MODELS = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fast, low cost)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (balanced)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (highest fidelity)' },
];

export const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5';

function friendlyError(err) {
  const status = err?.status;
  if (status === 401) return new Error('Anthropic rejected the API key. Check your key in Settings.');
  if (status === 429) return new Error('Anthropic rate limit reached. Wait a moment and try again.');
  if (status === 400) return new Error(`Anthropic request was invalid: ${err.message}`);
  return new Error(`Anthropic request failed: ${err?.message || err}`);
}

function textFromResponse(resp) {
  return (resp.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

export function createAnthropicProvider({ apiKey, model }) {
  if (!apiKey) throw new Error('An Anthropic API key is required. Add one in Settings.');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const modelId = model || DEFAULT_ANTHROPIC_MODEL;

  async function generateJson(prompt, schema) {
    try {
      const resp = await client.messages.create({
        model: modelId,
        max_tokens: MAX_TOKENS,
        output_config: { format: { type: 'json_schema', name: 'echo_response', schema } },
        messages: [{ role: 'user', content: `${prompt}\n\nRespond with a single valid JSON object and nothing else.` }],
      });
      return parseJson(textFromResponse(resp));
    } catch (err) {
      throw friendlyError(err);
    }
  }

  async function generateText(prompt) {
    try {
      const resp = await client.messages.create({
        model: modelId,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
      return textFromResponse(resp);
    } catch (err) {
      throw friendlyError(err);
    }
  }

  return createLocalProvider({ generateJson, generateText });
}
