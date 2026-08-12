/**
 * BYOK settings: which provider to use and the credentials/model for it.
 * Persisted in localStorage. Keys never leave the browser except as calls to
 * the chosen provider's own API.
 */

import { createAnthropicProvider, ANTHROPIC_MODELS, DEFAULT_ANTHROPIC_MODEL } from './providers/anthropic.js';
import { createGeminiProvider, GEMINI_MODELS, DEFAULT_GEMINI_MODEL } from './providers/gemini.js';
import { createBackendProvider } from './providers/backend.js';
import { createDemoProvider } from './providers/demo.js';

const STORAGE_KEY = 'echoLlmSettings';

export const PROVIDERS = {
  demo: {
    id: 'demo',
    label: 'Offline demo',
    needsKey: false,
    blurb: 'A scripted encounter that runs entirely in your browser — no key, no network. Great for a first look.',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    needsKey: true,
    keyField: 'anthropicKey',
    modelField: 'anthropicModel',
    models: ANTHROPIC_MODELS,
    defaultModel: DEFAULT_ANTHROPIC_MODEL,
    keyHint: 'Starts with "sk-ant-". Get one at console.anthropic.com.',
    blurb: 'Bring your own Claude key. Uses structured outputs for reliable scoring. Runs directly from your browser.',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    needsKey: true,
    keyField: 'geminiKey',
    modelField: 'geminiModel',
    models: GEMINI_MODELS,
    defaultModel: DEFAULT_GEMINI_MODEL,
    keyHint: 'Get one at aistudio.google.com/apikey.',
    blurb: 'Bring your own Gemini key. Runs directly from your browser with schema-constrained JSON.',
  },
  backend: {
    id: 'backend',
    label: 'Shared backend (no key)',
    needsKey: false,
    blurb: 'Use the hosted ECHO backend. No key required, but rate-limited and dependent on the shared service.',
  },
};

const DEFAULTS = {
  provider: 'demo',
  anthropicKey: '',
  anthropicModel: DEFAULT_ANTHROPIC_MODEL,
  geminiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  backendUrl: '',
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (_) { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (_) { /* storage may be unavailable */ }
  cachedProvider = null;
  cachedSignature = null;
  return next;
}

/** Is the currently-selected provider ready to run (has a key if it needs one)? */
export function isProviderReady(settings = getSettings()) {
  const meta = PROVIDERS[settings.provider];
  if (!meta) return false;
  if (!meta.needsKey) return true;
  return Boolean((settings[meta.keyField] || '').trim());
}

let cachedProvider = null;
let cachedSignature = null;

/** Build (and cache) the provider instance for the current settings. */
export function getProvider(settings = getSettings()) {
  const meta = PROVIDERS[settings.provider] || PROVIDERS.demo;
  const signature = JSON.stringify([
    settings.provider,
    settings.anthropicKey, settings.anthropicModel,
    settings.geminiKey, settings.geminiModel,
    settings.backendUrl,
  ]);
  if (cachedProvider && cachedSignature === signature) return cachedProvider;

  let provider;
  switch (meta.id) {
    case 'anthropic':
      provider = createAnthropicProvider({ apiKey: settings.anthropicKey, model: settings.anthropicModel });
      break;
    case 'gemini':
      provider = createGeminiProvider({ apiKey: settings.geminiKey, model: settings.geminiModel });
      break;
    case 'backend':
      provider = createBackendProvider({ backendUrl: settings.backendUrl });
      break;
    case 'demo':
    default:
      provider = createDemoProvider();
      break;
  }

  cachedProvider = provider;
  cachedSignature = signature;
  return provider;
}
