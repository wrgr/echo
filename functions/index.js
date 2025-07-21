// ============================================================================
// #1: SDK IMPORTS & INITIALIZATION
// ============================================================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

if (getApps().length === 0) {
  initializeApp();
}
const secretClient = new SecretManagerServiceClient();

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

  const prompt = `
    You are the game master for "Outbreak Z", a public health survival game.
    The player's current state is: Day ${currentState.day}, Infection ${currentState.infectionRate}%, Food ${currentState.resources.food}, Water ${currentState.resources.water}, Medical ${currentState.resources.medical}.
    The consequence of their last choice was: "${lastChoiceConsequence || 'The game has just started.'}"

    Your task is to generate a BRAND NEW, dynamic challenge for the player for the NEXT turn. You must:
    1.  Find a REAL, publicly accessible URL to a scientific paper or article about epidemiology, virology, public health, or crisis response. Use sources like CDC, WHO, NCBI/PubMed, NEJM, etc.
    2.  Create a "CDC Field Note" summarizing a key finding from the article in simple terms.
    3.  Create a multiple-choice question based on the real-world information in the article.
    4.  Create two distinct answer options. For EACH option, you must define:
        - If it's the correct answer ('correct': true/false).
        - A compelling 'consequence' string explaining the outcome.
        - The specific game state changes ('resourceChanges', 'infectionChange', 'pointsGained').

    Respond with ONLY a valid JSON object with this exact structure:
    {
      "cdcNote": {
        "title": "CDC Field Note: <Topic>",
        "text": "<Your summary>",
        "link": "<The real URL you found>",
        "linkText": "Source: <Name of the source>"
      },
      "challengeQuestion": {
        "text": "<The question you wrote>",
        "options": [
          {
            "text": "<Answer Option 1>",
            "correct": <true_or_false>,
            "consequence": "<Outcome description 1>",
            "resourceChanges": { "food": <number>, "water": <number>, "medical": <number> },
            "infectionChange": <number>,
            "pointsGained": <number>
          },
          {
            "text": "<Answer Option 2>",
            "correct": <true_or_false>,
            "consequence": "<Outcome description 2>",
            "resourceChanges": { "food": <number>, "water": <number>, "medical": <number> },
            "infectionChange": <number>,
            "pointsGained": <number>
          }
        ]
      }
    }
  `;

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
