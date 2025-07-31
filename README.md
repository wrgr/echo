# ECHO – Effective Conversations for Healthcare Optimization

ECHO is an AI-powered clinical simulation platform that helps healthcare providers practice culturally responsive patient communication. The application combines a React front-end with Firebase Cloud Functions that call Google Gemini to generate virtual patients, manage conversations and provide real-time coaching.  This release is a fully working baseline v0.4.

## Features

- **Simulation training** – converse with AI patients through phase-based clinical encounters and receive real-time scoring and feedback.
- **Patient scenario generator** – create custom patient profiles manually or from natural-language descriptions that are expanded with Gemini.
- **Help & advice** – ask the AI for cultural or clinical guidance during a simulation.
- **Local patient library** – save generated patients in the browser for later use.

## Getting Started

1. **Install dependencies**

   ```
   npm install
   npm --prefix functions install
   ```

2. **Run the development server**

   ```
   npm start
   ```

   The app is served at `http://localhost:3000`.

3. **Build for production**

   ```
   npm run build
   ```

4. **Firebase Functions**

   - Functions are located in the `functions/` directory.
   - Use the Firebase CLI for emulation or deployment:

     ```
     npm --prefix functions run serve   # local emulator
     npm --prefix functions run deploy  # deploy to Firebase
     ```

   The Cloud Function expects a `GEMINI_API_KEY` secret containing a Google Gemini API key.

## Code Structure

```
.
├── public/               # Static assets for React
├── src/                  # Front-end source
│   ├── App.js            # Application shell and routing
│   ├── SimulationPage.js # Main simulation interface
│   ├── PatientIntakeForm.js # Create custom patient profiles
│   ├── HelpPage.js       # AI help and advice component
│   ├── hooks/            # React hooks (simulation state, patient storage)
│   ├── patients/         # Predefined patient scenarios
│   ├── utils/            # Shared constants and helpers
│   └── firebase.js       # Firebase initialisation
└── functions/            # Firebase Cloud Functions
    ├── index.js          # HTTPS entry point with multiple actions
    ├── handlers.js       # Request handlers for simulation actions
    ├── gemini.js         # Gemini API integration and scoring logic
    ├── constants.js      # Encounter phase and rubric definitions
    ├── prompts.js / prompts.json # Prompt templates for Gemini
    └── package.json
```

## Running Tests

The project uses the default Create React App testing setup. No tests are defined yet, but the test command will exit successfully.

```
npm test
```

## License

[MIT](LICENSE)
