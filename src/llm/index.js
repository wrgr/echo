/**
 * Public entry point for the ECHO LLM layer.
 *
 * Components import from here to stay agnostic of which provider (Anthropic
 * Claude, Google Gemini, the shared Firebase backend, or the offline demo) is
 * active. The active provider is chosen in Settings and read from localStorage.
 */

export {
  getProvider,
  getSettings,
  saveSettings,
  isProviderReady,
  PROVIDERS,
} from './settings.js';
