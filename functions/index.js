// ============================================================================
// #1: SDK IMPORTS & INITIALIZATION
// ============================================================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const fs = require('fs');
const path = require('path');

if (getApps().length === 0) {
  initializeApp();
}
const secretClient = new SecretManagerServiceClient();

// Load Gemini prompt configurations from external JSON file
const prompts = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8')
);

// ============================================================================
// #2: SECRET FETCHING
// ============================================================================
const geminiApiKeyPromise = (async () => {
  try {
    const projectId = "outbreak-apex-game";
    const secretResourceName = `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name: secretResourceName });
    const apiKey = version.payload.data.toString("utf8");
    if (!apiKey) throw new Error("Fetched API key from Secret Manager is empty.");
    logger.info("Successfully fetched API key for REST calls.");
    return apiKey;
  } catch (error) {
    logger.error("FATAL: Could not retrieve API key.", { errorMessage: error.message });
    throw new Error("Could not initialize API key.");
  }
})();

// ============================================================================
// #3: CLOUD FUNCTION FOR DYNAMIC CHALLENGES
// ============================================================================
// CORRECTED: The function name now matches what the frontend is calling.
exports.getNextChallenge = onCall(async (request) => {
  const apiKey = await geminiApiKeyPromise;
  const { currentState, lastChoiceConsequence } = request.data;

  if (!currentState) {
    throw new HttpsError("invalid-argument", "Request is missing required data.");
  }

  const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const promptConfig = prompts.find(p => p.prompt === 'generate_next_challenge');
  const promptTemplate = promptConfig ? promptConfig.promptText : '';
  const templateFn = new Function(
    'currentState',
    'lastChoiceConsequence',
    `return \`${promptTemplate}\`;`
  );
  const prompt = templateFn(currentState, lastChoiceConsequence);

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpsError('internal', `API Error: ${errorBody.error.message}`);
    }
    const responseData = await response.json();
    const modelOutput = responseData.candidates[0].content.parts[0].text;
    const cleanedJson = modelOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    logger.error("Error during Gemini API call:", error);
    throw new HttpsError('internal', 'The request to the AI failed.');
  }
});
