# ECHO – Effective Conversations for Healthcare Optimization

ECHO is an AI-powered clinical simulation platform that helps healthcare providers practice culturally responsive patient communication. You converse with AI "standardized patients" through phase-based clinical encounters (Calgary‑Cambridge) and receive real-time, rubric-based coaching (Mini‑CEX).

**This release (v0.5) is bring-your-own-key (BYOK), backend-optional, and provider-agnostic.** You choose how ECHO talks to an AI model:

| Provider | Key needed? | Runs where | Notes |
| --- | --- | --- | --- |
| **Offline demo** | No | Your browser | Scripted encounter, no network. A quick first look. |
| **Anthropic (Claude)** | Yes (your key) | Your browser | Structured outputs for reliable scoring. Default model: Claude Haiku 4.5. |
| **Google Gemini** | Yes (your key) | Your browser | Schema-constrained JSON. Default model: Gemini 2.5 Flash. |
| **Shared backend** | No | Firebase function | The original hosted Cloud Function (Gemini). Rate-limited, shared. |

Pick a provider under **⚙️ Settings** (top-right). Direct providers (Claude / Gemini) call the model **directly from your browser with your own key** — nothing is proxied through a server.

## What's new in v0.5

- **Bring your own key** — use your own Anthropic or Gemini key; no shared secret required.
- **Optional backend** — the Firebase Cloud Function is now just one selectable provider; the app runs fully client-side without it.
- **Modern LLM layer** — current models and **structured outputs** (schema-constrained JSON) replace the old regex-based JSON extraction, so scoring/coaching responses are reliably well-formed.
- **Offline demo** — a keyless scripted encounter so new users can try ECHO before choosing a provider.
- **Vite** — migrated off the deprecated Create React App to Vite for faster builds and a maintained toolchain.

## Features

- **Simulation training** – converse with AI patients through phase-based clinical encounters with real-time scoring and feedback.
- **Patient scenario generator** – create custom patients manually or expand a natural-language description with AI.
- **Help & advice** – ask the AI for cultural or clinical communication guidance.
- **Local patient library** – save generated patients in the browser for later use.

## Getting Started

1. **Install dependencies**

   ```
   npm install
   ```

2. **Run the dev server** (Vite)

   ```
   npm run dev
   ```

   The app is served at `http://localhost:3000`. Open **⚙️ Settings** and pick a provider (start with the offline demo, or paste an Anthropic/Gemini key).

3. **Build for production**

   ```
   npm run build      # outputs to build/
   npm run preview    # serve the production build locally
   ```

4. **Run tests**

   ```
   npm test
   ```

## Getting an API key

- **Anthropic (Claude):** https://console.anthropic.com — keys start with `sk-ant-`.
- **Google Gemini:** https://aistudio.google.com/apikey.

Your key is stored only in your browser's `localStorage` and sent only to that provider's API.

### Security note (BYOK)

Direct providers call the model from your browser, so the key is present in client-side code. This is the accepted BYOK pattern (the key is yours, entered locally), but:

- Use a provider-side **restricted/scoped** key where possible.
- Clear your key on shared devices (**Settings → Clear key**).
- If you can't expose a key, use the **shared backend** or the **offline demo** instead.

## Optional Firebase backend

The `functions/` Cloud Function still works as the "shared backend" provider. It holds a `GEMINI_API_KEY` secret and does its own server-side orchestration.

```
npm --prefix functions install
npm --prefix functions run serve    # local emulator
npm --prefix functions run deploy   # deploy to Firebase
```

Self-hosting the function elsewhere? Point ECHO at it with `VITE_ECHO_BACKEND_URL` (build time) or the Settings → "Custom backend URL" field (runtime). See `.env.example`.

## Code Structure

```
.
├── index.html            # Vite entry (was public/index.html under CRA)
├── vite.config.js        # Build config (outputs to build/)
├── src/
│   ├── App.jsx           # Shell, routing, header, setup banner
│   ├── SimulationPage.jsx
│   ├── PatientIntakeForm.jsx
│   ├── HelpPage.jsx
│   ├── SettingsPage.jsx  # BYOK / provider settings UI
│   ├── SettingsContext.jsx
│   ├── llm/              # Provider-agnostic AI layer
│   │   ├── index.js          # getProvider / getSettings / PROVIDERS
│   │   ├── settings.js       # provider registry + factory (localStorage)
│   │   ├── encounter.js      # phases + Mini-CEX rubric (client source of truth)
│   │   ├── prompts.js        # prompt builders
│   │   ├── schemas.js        # structured-output schemas + validation
│   │   ├── orchestrator.js   # client-side encounter orchestration
│   │   ├── localProvider.js  # shared factory for direct providers
│   │   └── providers/        # anthropic.js · gemini.js · backend.js · demo.js
│   ├── hooks/            # useSimulation, useUserPatients
│   ├── patients/         # predefined patient scenarios
│   └── utils/            # constants, sanitize
└── functions/           # Firebase Cloud Function (optional shared backend)
```

## Frameworks & scoring

Scoring: Mini‑CEX anchored scale (Norcini et al.) · Structure: Calgary‑Cambridge Guide · Communication: Kalamazoo Consensus · Cultural humility: Tervalon & Murray‑Garcia. Scores are AI-generated and **formative** — intended to guide learning, not to certify competence.

## License

[MIT](LICENSE)
