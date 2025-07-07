// Firebase Cloud Functions for the SUSAN Clinical Communication Simulator.
// This file handles all backend logic, including:
// - Interacting with the Gemini API for patient responses, scoring, and feedback.
// - Managing the state of the clinical encounter (phases, turns, scores).
// - Providing helper functions for API calls with retry logic.

const {onRequest} = require('firebase-functions/v2/https');
const {setGlobalOptions} = require('firebase-functions/v2');
const https = require('https'); // Node.js built-in HTTPS module for API calls

// Retrieve the Gemini API key from environment variables.
// IMPORTANT: This variable must be set in your Firebase project configuration
// using `firebase functions:config:set susan.gemini_api_key="YOUR_API_KEY"`
// or directly in the Firebase console.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Set global options for all Firebase functions in this file.
// 'us-central1' is a common region for Firebase functions.
setGlobalOptions({region: 'us-central1'});

/**
 * Helper function for making HTTP API calls with retry logic.
 * This is used to interact with the Gemini API, providing resilience against
 * transient network issues or API rate limits.
 *
 * @param {object} options - HTTP request options (e.g., hostname, path, method, headers).
 * @param {string} postData - The data to send in the request body (JSON stringified).
 * @param {number} [retries=3] - The number of retry attempts if the request fails (default is 3).
 * @return {Promise<string>} A promise that resolves with the response data as a string.
 * @throws {Error} If the API request fails after all retries.
 */
const callGeminiWithRetries = (options, postData, retries = 3) => {
  return new Promise((resolve, reject) => {
    // Inner function to handle individual API attempts.
    const attempt = (tryCount) => {
      // Create an HTTPS request.
      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        // Accumulate data chunks from the response.
        apiRes.on('data', (chunk) => {
          data += chunk;
        });
        // When the response ends, process the data.
        apiRes.on('end', () => {
          // Check for successful HTTP status codes (2xx).
          if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
            resolve(data); // Resolve the promise with the successful data.
          } else {
            // If it's a server error (5xx) and retries are left, retry.
            if (apiRes.statusCode >= 500 && tryCount > 1) {
              console.log(
                `Attempt ${retries - tryCount + 1} failed with status ${apiRes.statusCode}, retrying...`,
              );
              // Wait 1 second before retrying to avoid overwhelming the API.
              setTimeout(() => attempt(tryCount - 1), 1000);
            } else {
              // If it's a client error (4xx) or no retries left, reject.
              reject(
                new Error(
                  `API request failed with status ${apiRes.statusCode}: ${data}`,
                ),
              );
            }
          }
        });
      });

      // Handle network errors during the request.
      apiReq.on('error', (e) => {
        if (tryCount > 1) {
          console.log(
            `Attempt ${tryCount - 1} failed due to network error, retrying...`,
          );
          setTimeout(() => attempt(tryCount - 1), 1000);
        } else {
          reject(e); // No retries left, reject with the error.
        }
      });

      // Write the request body and end the request.
      apiReq.write(postData);
      apiReq.end();
    };

    attempt(retries); // Start the first attempt.
  });
};

// --- Encounter Phases Configuration ---
// Defines the structure and goals for each phase of the clinical encounter.
// Each phase has a name, description, and maximum turns before auto-advancing.
const ENCOUNTER_PHASES = {
  0: { // Special introductory phase, not scored directly.
    name: 'Introduction & Initial Presentation',
    // Dynamic intro message based on patient data.
    coachIntro: (patient) =>
      `Welcome to SUSAN! You're about to meet **${patient.name}**, a **${patient.age}**-year-old **${patient.genderIdentity}** (${patient.pronouns}) whose primary language is **${patient.nativeLanguage}** (${patient.englishProficiency} English proficiency). Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter adhering to the Patient-Centered / Biopsychosocial model. Let's begin with **Phase 1: Initiation and Building the Relationship**. What is your first step?"`,
    phaseGoalDescription: 'This is the initial introduction to the scenario. There are no direct tasks for the provider in this phase other than to transition into Phase 1.',
    maxTurns: 0, // No turns in this intro phase.
  },
  1: {
    name: 'Initiation & Building the Relationship',
    coachIntro: null, // Intro handled by Phase 0's nextPhaseIntro.
    coachPrompt: 'You are in Phase 1 (Initiation & Relationship). Focus on greeting the patient, introducing yourself, establishing rapport, and clearly identifying the patient\'s chief complaint and agenda for the visit.',
    phaseGoalDescription: 'The provider should greet the patient, introduce themselves, establish initial rapport, and identify the patient\'s chief complaint and their agenda for the visit. Key actions include: open-ended questions about their visit, empathetic statements, and active listening.',
    maxTurns: 5, // Auto-advance after 5 provider turns (10 total messages).
  },
  2: {
    name: 'Information Gathering & History Taking',
    coachIntro: null,
    coachPrompt: 'You are in Phase 2 (Information Gathering). Focus on a comprehensive History of Present Illness (HPI), and relevant Past Medical, Social, Family History. Critically, explore the patient\'s Ideas, Concerns, and Expectations.',
    phaseGoalDescription: 'The provider should gather a comprehensive History of Present Illness (HPI) including OLDCARTS elements, and inquire about relevant Past Medical History, Medications/Allergies, Family History, and Social History. It is crucial to explore the patient\'s Ideas, Concerns, and Expectations (ICE). The provider should use a mix of open-ended and focused questions, and demonstrate active listening.',
    maxTurns: 7, // Auto-advance after 10 provider turns (20 total messages).
  },
  3: {
    name: 'Physical Examination',
    coachIntro: null,
    coachPrompt: 'You are in Phase 3 (Physical Examination). Clearly state what exam components you are performing. Remember to explain what you\'re doing and ask for consent. The patient will then state the findings.',
    phaseGoalDescription: 'The provider should clearly state the intention to perform a physical exam, explain what will be done, and ask for consent. They should then state specific, focused components of the physical exam relevant to the patient\'s complaint. The patient will then provide relevant findings.',
    maxTurns: 3, // Auto-advance after 3 provider turns (6 total messages).
  },
  4: {
    name: 'Assessment & Plan / Shared Decision-Making',
    coachIntro: null,
    coachPrompt: 'You are in Phase 4 (Assessment & Plan). Your goal is to synthesize findings, state a diagnosis, propose a management plan, and ensure shared understanding with the patient. Use the \'teach-back\' method.',
    phaseGoalDescription: 'The provider should synthesize the gathered subjective and objective data, formulate and communicate a likely diagnosis to the patient, propose a management plan (tests, treatments, referrals), and engage in shared decision-making. Critically, the provider must use techniques like \'teach-back\' to ensure the patient\'s understanding and address their preferences and concerns.',
    maxTurns: 7, // Auto-advance after 7 provider turns (14 total messages).
  },
  5: {
    name: 'Closure',
    coachIntro: null,
    coachPrompt: 'You are in Phase 5 (Closure). Summarize the agreed-upon plan, provide safety netting instructions (what to do if symptoms worsen), and address any final questions the patient may have.',
    phaseGoalDescription: 'The provider should provide a concise summary of the encounter and the agreed-upon plan, give clear safety-netting instructions (what to do, when to seek help), invite any final questions or concerns from the patient, and professionally close the encounter.',
    maxTurns: 3, // Auto-advance after 3 provider turns (6 total messages).
  },
  6: { // Final phase, for displaying final score.
    name: 'Encounter Complete',
    coachIntro: null,
    coachPrompt: 'The encounter is complete.',
    phaseGoalDescription: 'The simulation has ended. Review the total score and detailed feedback.',
    maxTurns: 0, // No turns in this final phase.
  },
};

// Rubric for scoring each phase.
// Each category has a maximum score and a description.
const PHASE_RUBRIC = {
  communication: {max: 1, desc: 'Clear, active listening, appropriate language. Asks clear questions, summarizes effectively.'},
  trustRapport: {max: 1, desc: 'Establishes empathetic connection, shows respect, builds trust, manages emotions.'},
  accuracy: {max: 1, desc: 'Asks clinically relevant questions, gathers precise and complete information, identifies key symptoms/history.'},
  culturalHumility: {max: 1, desc: 'Explores patient\'s ideas/beliefs/context respectfully, avoids assumptions, acknowledges cultural factors in health/illness.'},
  sharedUnderstanding: {max: 1, desc: 'Ensures patient comprehension of information/plan, actively involves patient in decisions, uses teach-back.'},
};

/**
 * Gets a comprehensive score for a completed phase from Gemini.
 * This function constructs a detailed prompt for Gemini, including patient state,
 * conversation history, and the scoring rubric, then parses Gemini's JSON response.
 *
 * @param {object} patientState - The current patient's state.
 * @param {Array<object>} conversationHistory - The full conversation history up to this point.
 * @param {string} phaseName - The name of the phase to score.
 * @param {string} phaseDescription - The goal description of the phase.
 * @return {Promise<object>} A promise that resolves with the phase score object.
 * Returns a default score object if Gemini's response is incomplete or an error occurs.
 */
async function getPhaseScoreFromGemini(patientState, conversationHistory, phaseName, phaseDescription) {
  const scorePrompt = `
        You are an expert medical educator evaluating a provider's performance in a clinical encounter simulation.
        Your task is to provide a comprehensive score for the entire phase provided.

        Your entire response MUST be a single, valid JSON object and nothing else.
        Do not wrap it in markdown.

        ---
        **PHASE TO SCORE: ${phaseName}**
        **PHASE GOAL:** ${phaseDescription}
        ---

        **RUBRIC FOR SCORING THIS PHASE (Max 1 point per category):**
        ${Object.entries(PHASE_RUBRIC).map(([key, value]) => `- ${key} (${value.max} pt): ${value.desc}`).join('\n')}

        ---
        **PATIENT PROFILE:**
        ${JSON.stringify(patientState, null, 2)}
        ---

        **CONVERSATION HISTORY (All turns within the encounter so far, relevant to this phase):**
        ${JSON.stringify(conversationHistory, null, 2)}
        ---

        **YOUR TASK:**
        Based on the 'PHASE TO SCORE', its 'PHASE GOAL', the 'RUBRIC FOR SCORING THIS PHASE', and the 'CONVERSATION HISTORY':

        1.  Evaluate the provider's overall performance during the *entire duration* of this specific phase.
        2.  Award points (0 or 1) for each category in the RUBRIC for this phase's *overall performance*.
        3.  Provide a brief, specific \`justification\` for the points awarded or not awarded in each category, referencing actions (or inactions) from the conversation history.

        4.  Response Format: Your output MUST be a JSON object with the following keys:

            \`\`\`json
            {
              "communication": { "points": 0 | 1, "justification": "string" },
              "trustRapport": { "points": 0 | 1, "justification": "string" },
              "accuracy": { "points": 0 | 1, "justification": "string" },
              "culturalHumility": { "points": 0 | 1, "justification": "string" },
              "sharedUnderstanding": { "points": 0 | 1, "justification": "string" }
            }
            \`\`\`
    `;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': scorePrompt}]}],
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(options, postData);
    const geminiResponse = JSON.parse(rawData);
    // Extract the text content from Gemini's response.
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    // Clean any markdown fences that Gemini might erroneously include.
    const cleanResponseText = responseText.replace(/^```json\s*|\s*```$/gs, '');
    const parsedScore = JSON.parse(cleanResponseText);

    // Basic validation to ensure the score structure is as expected.
    const requiredCategories = Object.keys(PHASE_RUBRIC);
    const allCategoriesPresent = requiredCategories.every((cat) => parsedScore[cat] && typeof parsedScore[cat].points === 'number');

    if (!allCategoriesPresent) {
      console.warn('Gemini returned incomplete score structure. Filling defaults.');
      const defaultScore = {};
      requiredCategories.forEach((cat) => {
        defaultScore[cat] = {points: 0, justification: 'Incomplete AI scoring response from Gemini.'};
      });
      return defaultScore;
    }

    return parsedScore;
  } catch (error) {
    console.error('Error getting phase score from Gemini:', error.message);
    const defaultScore = {};
    Object.keys(PHASE_RUBRIC).forEach((cat) => {
      defaultScore[cat] = {points: 0, justification: `Scoring error: ${error.message}`};
    });
    return defaultScore;
  }
}

/**
 * Gets overall feedback from Gemini at the end of the encounter.
 * This function provides a holistic summary of the provider's performance
 * across all phases, based on aggregated scores and the full conversation history.
 *
 * @param {object} patientState - The final patient state.
 * @param {object} phaseScores - The aggregated scores for all phases.
 * @param {Array<object>} conversationHistory - The full conversation history.
 * @return {Promise<string>} A promise that resolves with the overall feedback text.
 */
async function getOverallFeedbackFromGemini(patientState, phaseScores, conversationHistory) {
  const feedbackPrompt = `
        You are an expert medical educator providing comprehensive final feedback for a provider's performance in a clinical encounter simulation.
        The simulation followed the Patient-Centered / Biopsychosocial model across several phases.

        Your response should be a well-structured text summary, highlighting:
        - Overall strengths demonstrated by the provider throughout the encounter.
        - Key areas for improvement, with specific examples from the conversation if possible.
        - How well the provider integrated patient-centered care and cultural humility.
        - A general assessment of the provider's clinical communication and reasoning.

        Do not use markdown fences (like \`\`\`json\`). Just return plain text.

        ---
        **PATIENT PROFILE:**
        ${JSON.stringify(patientState, null, 2)}
        ---

        **PHASE-BY-PHASE SCORES (Including justifications):**
        ${JSON.stringify(phaseScores, null, 2)}
        ---

        **FULL CONVERSATION TRANSCRIPT:**
        ${JSON.stringify(conversationHistory, null, 2)}
        ---

        **YOUR TASK:**
        Synthesize all the provided information to generate a holistic summary of the provider's performance. Focus on constructive feedback for learning. Start with an encouraging tone.
    `;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': feedbackPrompt}]}],
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    // Clean any markdown fences, just in case, though plain text is expected.
    const cleanResponseText = responseText.replace(/^```(?:json|text)?\s*|\s*```$/gs, '');
    return cleanResponseText; // Expecting plain text response.
  } catch (error) {
    console.error('Error getting overall feedback from Gemini:', error.message);
    return 'An error occurred while generating overall feedback. Please check server logs.';
  }
}

/**
 * Gets Gemini's response for a regular interaction (patient response or coach intervention).
 * This is the core function for driving the simulation's turn-by-turn interaction.
 * It determines the patient's response, assesses phase progression, and scores the provider's turn.
 *
 * @param {object} patientState - The current patient's state.
 * @param {Array<object>} formattedHistoryForGemini - Conversation history formatted for Gemini.
 * @param {string} latestInput - The provider's latest input.
 * @param {object} encounterState - The current encounter state.
 * @param {number} currentPhase - The current phase number.
 * @param {object} phaseConfig - The configuration for the current phase.
 * @param {number} currentPerformanceRatio - The provider's current performance ratio for fidelity.
 * @return {Promise<object>} A promise that resolves with Gemini's parsed response,
 * including simulator response, source ('patient'/'coach'),
 * phase assessment, and score update for the turn.
 */
async function getGeminiResponseForInteraction(
  patientState,
  formattedHistoryForGemini,
  latestInput,
  encounterState,
  currentPhase,
  phaseConfig,
  currentPerformanceRatio,
) {
  // Adjust patient's cooperativeness/clarity based on provider's cumulative performance.
  const fidelityInstruction = `Provider performance has been ${(currentPerformanceRatio * 100).toFixed(0)}% score so far. ` +
        (currentPerformanceRatio < 0.5 ?
          'The patient\'s provided information should now be less clear, more vague, or occasionally contradictory. Do not explicitly state this, but subtly withhold or muddle information.' :
          (currentPerformanceRatio < 0.75 ?
            'The patient\'s information may become slightly less direct or require more probing.' :
            'The patient should remain cooperative and provide information clearly and accurately based on their profile.'));

  const geminiPrompt = `
        You are SUSAN, a clinical communication simulator.
        Your primary role is to act as the **patient** based on the provided 'Patient Profile' and 'Current Encounter Phase'.
        You will also act as the **coach** to provide feedback and facilitate phase progression.

        Your entire response MUST be a single, valid JSON object.
        Do not wrap it in markdown.

        ---
        **CURRENT ENCOUNTER PHASE: ${phaseConfig.name} (Phase ${currentPhase})**
        **GOAL FOR THIS PHASE:** ${phaseConfig.phaseGoalDescription}
        ---

        **RUBRIC FOR SCORING (For your evaluation of the provider's *performance in THIS TURN*):**
        ${Object.entries(PHASE_RUBRIC).map(([key, value]) => `- ${key} (${value.max} pt): ${value.desc}`).join('\n')}

        ---
        **PATIENT PROFILE:**
        ${JSON.stringify(patientState, null, 2)}
        ---

        **CONVERSATION HISTORY (All previous turns, including current provider's turn):**
        ${JSON.stringify(formattedHistoryForGemini, null, 2)}
        ---

        **FIDELITY INSTRUCTION (Based on provider's cumulative performance):**
        ${fidelityInstruction}
        ---

        **YOUR TASK:**
        Based on the 'PROVIDER'S LATEST INPUT', the 'CURRENT ENCOUNTER PHASE', the 'PATIENT PROFILE', the 'CONVERSATION HISTORY', and the 'FIDELITY INSTRUCTION':

        1.  **Patient Response:** Generate the patient's natural, realistic response to the provider's \`latestInput\`. The patient's response should be consistent with their persona, language proficiency, illness, and the fidelity instruction.
            * If the provider asks a clinical question, the patient responds naturally.
            * If the provider asks for an interpreter for a 'None' or 'Beginner' English proficiency patient, the **coach** should confirm the interpreter's arrival (see point 4).
            * If the patient has a 'secondaryComplaint' or 'hiddenConcern', only reveal it if the provider asks appropriate, probing questions.
            * If the patient has \`redFlags_worseningConditions\` and the provider's actions are poor or critical signs are missed (as determined by your internal logic for this turn's context), consider subtly introducing hints of this.

        2.  **Phase Progression Assessment:** Evaluate the provider's overall performance *within the current phase* up to and including the latest input.
            * Determine if the \`GOAL FOR THIS PHASE\` has been adequately met.
            * Set \`phaseComplete\` to \`true\` if the goals are met, \`false\` otherwise. Provide a \`justificationForCompletion\`.

        3.  **Scoring for Current Turn:** Evaluate the \`PROVIDER'S LATEST INPUT\` against the \`RUBRIC FOR SCORING\`. Award 0 or 1 point for each category. Provide a brief, specific \`justification\` for each point awarded or not awarded.

        4.  **Response Type Determination (\`from\` field):**
            * Default to \`"patient"\` for the \`simulatorResponse\`.
            * **Switch to \`"coach"\` IF:**
                * The provider asks for an interpreter and the patient's \`englishProficiency\` is "None" or "Beginner". \`simulatorResponse\` should confirm interpreter.
                * The provider's \`latestInput\` is nonsensical, irrelevant to a medical conversation, or gibberish. \`simulatorResponse\` should be a helpful coaching tip.
                * (Optional: You can add more coach intervention triggers here based on critical mistakes like rudeness, major ethical ethical breach etc. - the simulator should *always* intervene as coach for these.)

        5.  **Response Format:** Your output MUST be a JSON object with the following keys:

            \`\`\`json
            {
              "from": "patient" | "coach", // MANDATORY: indicates who the response is from
              "simulatorResponse": "string", // The message from the patient OR coach
              "phaseAssessment": {
                "phaseComplete": boolean, // true if phase goals are met
                "justificationForCompletion": "string" // Explanation for phase completion status
              },
              "scoreUpdate": { // Score for the CURRENT TURN'S interaction
                "communication": { "points": 0 | 1, "justification": "string" },
                "trustRapport": { "points": 0 | 1, "justification": "string" },
                "accuracy": { "points": 0 | 1, "justification": "string" },
                "culturalHumility": { "points": 0 | 1, "justification": "string" },
                "sharedUnderstanding": { "points": 0 | 1, "justification": "string" }
              }
            }
            \`\`\`
    `;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': geminiPrompt}]}],
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    const cleanResponseText = responseText.replace(/^```json\s*|\s*```$/gs, '');
    const parsedResponse = JSON.parse(cleanResponseText);
    return parsedResponse;
  } catch (error) {
    console.error('Error getting Gemini response for interaction:', error.message);
    throw new Error('Failed to get Gemini response for interaction: ' + error.message);
  }
}

/**
 * Generates an AI-driven "good" or "poor" provider response and its score.
 * This function is used for injecting pre-defined quality responses into the simulation
 * for demonstration or specific training scenarios.
 *
 * @param {object} patientState - The current patient's state.
 * @param {Array<object>} conversationHistory - The full conversation history.
 * @param {number} currentPhase - The current phase number.
 * @param {string} phaseName - The name of the current phase.
 * @param {string} phaseGoalDescription - The goal description of the current phase.
 * @param {"good"|"poor"} responseType - The type of response to generate ('good' or 'poor').
 * @return {Promise<object>} A promise that resolves with the generated response text and its score.
 */
async function generateInjectedProviderResponse(
  patientState,
  conversationHistory,
  currentPhase,
  phaseName,
  phaseGoalDescription,
  responseType,
) {
  const prompt = `
        You are SUSAN, a clinical communication simulator.
        Your task is to generate a **provider's response** that is either "${responseType}" or "poor" for the current clinical encounter context.
        You must also provide a score for this generated provider response based on the rubric.

        Your entire response MUST be a single, valid JSON object.
        Do not wrap it in markdown.

        ---
        **CURRENT ENCOUNTER PHASE: ${phaseName} (Phase ${currentPhase})**
        **GOAL FOR THIS PHASE:** ${phaseGoalDescription}
        ---

        **RUBRIC FOR SCORING THIS PROVIDER RESPONSE (Max 1 point per category):**
        ${Object.entries(PHASE_RUBRIC).map(([key, value]) => `- ${key} (${value.max} pt): ${value.desc}`).join('\n')}

        ---
        **PATIENT PROFILE:**
        ${JSON.stringify(patientState, null, 2)}
        ---

        **CONVERSATION HISTORY (All previous turns):**
        ${JSON.stringify(conversationHistory, null, 2)}
        ---

        **YOUR TASK:**
        Generate a concise, realistic provider response that exemplifies a "${responseType}" interaction in this phase.
        Then, score this generated provider response against the rubric.

        Response Format: Your output MUST be a JSON object with the following keys:

        \`\`\`json
        {
          "text": "string", // The generated provider response
          "scoreUpdate": { // Score for this generated provider response
            "communication": { "points": 0 | 1, "justification": "string" },
            "trustRapport": { "points": 0 | 1, "justification": "string" },
            "accuracy": { "points": 0 | 1, "justification": "string" },
            "culturalHumility": { "points": 0 | 1, "justification": "string" },
            "sharedUnderstanding": { "points": 0 | 1, "justification": "string" }
          }
        }
        \`\`\`
    `;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': prompt}]}],
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    const cleanResponseText = responseText.replace(/^```json\s*|\s*```$/gs, '');
    const parsedResponse = JSON.parse(cleanResponseText);
    return parsedResponse;
  } catch (error) {
    console.error('Error generating injected provider response:', error.message);
    throw new Error('Failed to generate injected provider response: ' + error.message);
  }
}

/**
 * Gets free-form advice from Gemini based on a provider's query.
 * This function allows the provider to ask for general guidance or tips
 * from the SUSAN coach at any point in the simulation.
 *
 * @param {string} patientInfo - Description of the patient.
 * @param {string} providerPerception - Provider's perception of the interaction.
 * @param {string} question - The specific question for SUSAN.
 * @return {Promise<string>} A promise that resolves with Gemini's advice text.
 */
async function getHelpAdviceFromGemini(patientInfo, providerPerception, question) {
  const prompt = `
    You are SUSAN, an expert medical educator and communication coach.
    A healthcare provider is asking for advice on a specific clinical communication scenario.
    Provide actionable, empathetic, and culturally sensitive advice. Focus on principles of patient-centered care and communication with LEP patients.

    ---
    **PATIENT INFORMATION:**
    ${patientInfo}
    ---

    **PROVIDER'S PERCEPTION OF INTERACTION:**
    ${providerPerception}
    ---

    **PROVIDER'S QUESTION:**
    ${question}
    ---

    **YOUR TASK:**
    Provide comprehensive and practical advice to the provider. Structure your advice clearly, perhaps with bullet points or numbered steps if appropriate. Maintain a supportive and educational tone.
    Do not use markdown fences (like \`\`\`json\`). Just return plain text.
  `;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': prompt}]}],
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    const cleanResponseText = responseText.replace(/^```(?:json|text)?\s*|\s*```$/gs, '');
    return cleanResponseText;
  } catch (error) {
    console.error('Error getting help advice from Gemini:', error.message);
    throw new Error('Failed to get help advice: ' + error.message);
  }
}

// --- Handler Functions for Firebase HTTP Triggers ---
// These functions orchestrate the calls to Gemini and manage the simulation state on the backend.

/**
 * Handles generating a new patient profile.
 * This function is typically called at the start of a new simulation.
 * It returns initial patient data and the starting encounter state.
 *
 * @param {object} res - The Express response object to send the response.
 */
async function handleGeneratePatient(res) {
  try {
    // In a real scenario, you'd call Gemini here to generate a new patient profile
    // based on certain parameters or a prompt.
    // For this example, we'll use a hardcoded placeholder patient for simplicity.
    const patientData = {
      'name': 'Maria Garcia',
      'age': 62,
      'genderIdentity': 'Female',
      'pronouns': 'she/her',
      'nativeLanguage': 'Spanish',
      'englishProficiency': 'Limited',
      'culturalBackground': 'Maria is from a rural part of Mexico, values family input in health decisions, and prefers natural remedies alongside modern medicine.',
      'mainComplaint': 'Me duele mucho la rodilla derecha y me cuesta caminar. (My right knee hurts a lot and it\'s hard for me to walk.)',
      'secondaryComplaint': 'I also feel more tired than usual.',
      'hiddenConcern': 'Worried about becoming a burden to her children.',
      'illnessPerception_Ideas': 'I think it\'s just old age, or maybe the cold weather.',
      'illnessPerception_Concerns': 'I\'m worried I won\'t be able to do my daily chores or play with my grandchildren.',
      'illnessPerception_Expectations': 'I hope there\'s some kind of cream or simple medicine to make it feel better.',
      'relevantPastMedicalHistory': 'Osteoarthritis in both knees, diagnosed 10 years ago. Hypertension, well-controlled with medication.',
      'relevantMedicationsAndAllergies': 'Lisinopril daily for blood pressure. Takes over-the-counter pain relievers occasionally. No known allergies.',
      'relevantFamilyHistory': 'Mother had severe arthritis. Father had heart disease.',
      'relevantSocialHistory': 'Lives with her daughter and grandchildren. Enjoys gardening. Was a homemaker.',
      'physicalExamFindings': 'Right knee swollen and tender to palpation. Crepitus on range of motion. Limited flexion and extension. No redness or warmth.',
      'correctDiagnosis': 'Osteoarthritis flare-up of the right knee',
      'managementPlanOutline': 'Pain management, physical therapy referral, consider joint injection, discuss weight management.',
      'redFlags_worseningConditions': 'The pain is now constant, even at rest, and my knee feels hot.',
      'familyInvolvementPreference': 'High',
      'patientPersona': 'Resigned but hopeful',
    };

    res.status(200).json({
      message: 'Patient generated successfully.',
      patient: patientData,
      initialCoachMessage: ENCOUNTER_PHASES[0].coachIntro(patientData),
      initialEncounterState: {
        currentPhase: 0, // Start at intro phase on the server.
        providerTurnCount: 0,
        phaseScores: {},
        currentCumulativeScore: 0,
        totalPossibleScore: 0,
      },
    });
    console.log('handleGeneratePatient: Patient generated and response sent.');
  } catch (error) {
    console.error('handleGeneratePatient: Error generating patient:', error);
    res.status(500).send('Failed to generate patient: ' + error.message);
  }
}

/**
 * Handles all types of simulation interactions. This is the main endpoint
 * for turn-by-turn communication in the simulation. It processes provider input,
 * gets Gemini's response (patient or coach), updates scores, and manages phase transitions.
 *
 * @param {object} req - The Express request object containing interaction details.
 * @param {object} res - The Express response object to send the response.
 */
async function handleInteraction(req, res) {
  try {
    const {actionType, patientState, conversationHistory, latestInput, encounterState} = req.body;

    // Validate required input data.
    if (!patientState || !conversationHistory || !encounterState) {
      return res.status(400).send('Missing required interaction data (patientState, conversationHistory, encounterState).');
    }

    // Destructure and initialize encounter state variables.
    let {currentPhase, providerTurnCount, phaseScores, currentCumulativeScore, totalPossibleScore} = encounterState;
    let currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];
    let simulatorResponse = '';
    let from = 'coach'; // Default response source.
    let scoreUpdate = {}; // Score for the current turn/interaction.
    let phaseComplete = false;
    let justificationForCompletion = '';
    let nextCoachMessage = null;
    let overallFeedback = null;
    let injectedProviderResponseText = null; // For the 'inject_provider_response' case.

    // Calculate current performance ratio for fidelity adjustment.
    const performanceRatio = totalPossibleScore > 0 ? currentCumulativeScore / totalPossibleScore : 1;

    // Create a mutable copy of conversation history for immediate updates within this function's scope.
    const updatedConversationHistory = [...conversationHistory];

    // Handle different types of interaction actions.
    switch (actionType) {
      case 'regular_interaction': {
        // If the encounter is already in the final phase, return a completion message.
        if (currentPhase >= Object.keys(ENCOUNTER_PHASES).length - 1) {
          simulatorResponse = ENCOUNTER_PHASES[6].coachPrompt; // "Encounter complete."
          from = 'coach';
          break; // Exit switch and send response.
        }

        providerTurnCount++; // Increment turn count for the current phase.
        currentPhaseConfig = ENCOUNTER_PHASES[currentPhase]; // Get current phase configuration.

        // Get Gemini's response (patient or coach) and the score for the current turn.
        const geminiRegularResponse = await getGeminiResponseForInteraction(
          patientState,
          updatedConversationHistory, // History already includes provider's latest input from client.
          latestInput,
          encounterState,
          currentPhase,
          currentPhaseConfig,
          performanceRatio,
        );

        // Update response and state based on Gemini's output.
        simulatorResponse = geminiRegularResponse.simulatorResponse;
        from = geminiRegularResponse.from;
        scoreUpdate = geminiRegularResponse.scoreUpdate;
        phaseComplete = geminiRegularResponse.phaseAssessment.phaseComplete;
        justificationForCompletion = geminiRegularResponse.phaseAssessment.justificationForCompletion;

        // Update cumulative scores based on the current turn's score.
        for (const category in scoreUpdate) {
          // Ensure the property belongs to the object itself, not its prototype chain.
          if (Object.hasOwnProperty.call(scoreUpdate, category)) {
            currentCumulativeScore += scoreUpdate[category].points;
            totalPossibleScore += PHASE_RUBRIC[category].max;
          }
        }

        // Check for auto-advance if the phase is not already marked complete by Gemini
        // and the maximum turns for the phase have been reached.
        if (!phaseComplete && currentPhaseConfig.maxTurns > 0 && providerTurnCount >= currentPhaseConfig.maxTurns) {
          phaseComplete = true;
          justificationForCompletion = `Automatically advanced after ${providerTurnCount} turns.`;
          // Append auto-advance message to simulator response.
          if (from === 'patient') {
            simulatorResponse += `\n\nCOACH: ${justificationForCompletion}`;
            from = 'coach'; // Switch to coach if auto-advancing from a patient turn.
          } else { // If it was already a coach message from Gemini, just prepend to it.
            simulatorResponse = `COACH: ${justificationForCompletion}\n\n` + simulatorResponse;
          }
        }
      } break; // End of 'regular_interaction' case.

      case 'get_coach_tip': {
        currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];
        // Provide a general tip, which is the current phase's prompt.
        simulatorResponse = currentPhaseConfig.coachPrompt || 'I don\'t have a specific tip for this phase right now. Keep focusing on the phase goals!';
        from = 'coach';
        // No score update for requesting a tip.
        scoreUpdate = Object.fromEntries(
          Object.keys(PHASE_RUBRIC).map((key) => [key, {points: 0, justification: 'Requested coach tip (no score update for turn).'}]),
        );
      } break; // End of 'get_coach_tip' case.

      case 'inject_provider_response': {
        const responseType = latestInput; // This will be "good" or "poor".
        currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];

        // 1. Generate the AI-driven provider response and its *initial* score.
        const injectedResponseData = await generateInjectedProviderResponse(
          patientState,
          updatedConversationHistory, // History *before* injecting this turn.
          currentPhase,
          currentPhaseConfig.name,
          currentPhaseConfig.phaseGoalDescription,
          responseType,
        );

        injectedProviderResponseText = injectedResponseData.text; // Store this to send back.
        // The scoreUpdate from injectedResponseData is for the injected provider turn.
        // We'll apply this to overall cumulative score later.

        // 2. Add the injected provider response to the history for the *next* Gemini call (patient reaction).
        updatedConversationHistory.push({role: 'provider', parts: [{text: injectedProviderResponseText}]});
        providerTurnCount++; // Injected response counts as a turn.

        // 3. Get the patient's reaction to the injected provider response.
        const patientReactionData = await getGeminiResponseForInteraction(
          patientState,
          updatedConversationHistory, // History now includes the injected provider response.
          injectedProviderResponseText, // Patient reacts to this.
          encounterState, // Pass current state.
          currentPhase,
          currentPhaseConfig,
          performanceRatio,
        );

        simulatorResponse = patientReactionData.simulatorResponse;
        from = patientReactionData.from;
        scoreUpdate = patientReactionData.scoreUpdate; // This is the score for the patient's reaction turn.
        phaseComplete = patientReactionData.phaseAssessment.phaseComplete;
        justificationForCompletion = patientReactionData.phaseAssessment.justificationForCompletion;

        // Apply scores for both the injected provider turn (from injectedResponseData)
        // AND the patient's reaction turn (from patientReactionData).
        // For simplicity, `scoreUpdate` sent back will be the patient's reaction score.
        // The cumulative score will reflect both.
        for (const category in scoreUpdate) {
          if (Object.hasOwnProperty.call(scoreUpdate, category)) {
            currentCumulativeScore += scoreUpdate[category].points;
            totalPossibleScore += PHASE_RUBRIC[category].max;
          }
        }

        // Check for auto-advance after patient's reaction to injected response.
        if (!phaseComplete && currentPhaseConfig.maxTurns > 0 && providerTurnCount >= currentPhaseConfig.maxTurns) {
          phaseComplete = true;
          justificationForCompletion = `Automatically advanced after ${providerTurnCount} turns due to injected response.`;
          if (from === 'patient') { // If patient responded, append coach message.
            simulatorResponse += `\n\nCOACH: ${justificationForCompletion}`;
            from = 'coach';
          } else { // If Gemini already acted as coach, prepend/amend its message.
            simulatorResponse = `COACH: ${justificationForCompletion}\n\n` + simulatorResponse;
          }
        }
      } break; // End of 'inject_provider_response' case.

      case 'move_to_next_phase': {
        // Prevent moving past the final phase.
        if (currentPhase >= Object.keys(ENCOUNTER_PHASES).length - 1) {
          simulatorResponse = ENCOUNTER_PHASES[6].coachPrompt;
          from = 'coach';
          break;
        }
        phaseComplete = true;
        justificationForCompletion = 'Manually advanced by provider.';
        simulatorResponse = `COACH: You have chosen to advance to the next phase. ${justificationForCompletion}`;
        from = 'coach';
        // For manual advance, assign zero points for the *current turn's* score.
        // The *phase score* will be calculated and added below.
        scoreUpdate = Object.fromEntries(
          Object.keys(PHASE_RUBRIC).map((key) => [key, {points: 0, justification: 'Phase manually advanced. No AI score provided for this specific turn.'}]),
        );
      } break; // End of 'move_to_next_phase' case.

      default:
        console.warn('handleInteraction: Unknown actionType received:', actionType);
        return res.status(400).send('Invalid \'actionType\' for interaction.');
    }

    // --- Phase Transition Logic (applies after any action that might complete a phase) ---
    let nextPhase = currentPhase; // Initialize nextPhase with currentPhase.

    if (phaseComplete) {
      // Score the phase that just completed (which is `currentPhase` before incrementing `nextPhase`).
      const completedPhaseName = ENCOUNTER_PHASES[currentPhase].name;
      const completedPhaseDescription = ENCOUNTER_PHASES[currentPhase].phaseGoalDescription;

      console.log(`Phase ${currentPhase} (${completedPhaseName}) completed. Calculating score for this phase.`);
      const fullPhaseScore = await getPhaseScoreFromGemini(patientState, updatedConversationHistory, completedPhaseName, completedPhaseDescription);

      // Store the full phase score under the completed phase's name.
      // This is crucial for displaying phase-by-phase scores on the client.
      phaseScores = {...phaseScores, [completedPhaseName]: fullPhaseScore};

      // Sum up points from the just-completed phase's full score to add to cumulative total.
      for (const category in fullPhaseScore) {
        if (Object.hasOwnProperty.call(fullPhaseScore, category)) {
          currentCumulativeScore += (fullPhaseScore[category]?.points || 0);
          totalPossibleScore += (PHASE_RUBRIC[category]?.max || 0);
        }
      }

      // Move to the next phase for the *next* interaction.
      nextPhase = currentPhase + 1;
      const nextPhaseConfig = ENCOUNTER_PHASES[nextPhase];

      // Reset turn count for the *new* phase.
      providerTurnCount = 0;

      // Prepare the coach message for the next phase.
      if (nextPhaseConfig) {
        if (nextPhaseConfig.coachIntro) {
          nextCoachMessage = nextPhaseConfig.coachIntro(patientState);
        } else if (nextPhaseConfig.coachPrompt) {
          nextCoachMessage = `COACH: Transitioning to **Phase ${nextPhase}: ${nextPhaseConfig.name}**. ${nextPhaseConfig.coachPrompt}`;
        }
      }

      // If transitioning to the final "Encounter Complete" phase (phase 6).
      if (nextPhase === Object.keys(ENCOUNTER_PHASES).length - 1) {
        console.log('Encounter is complete. Generating overall feedback.');
        overallFeedback = await getOverallFeedbackFromGemini(patientState, phaseScores, updatedConversationHistory);
        // This is the final message shown to the user on encounter completion.
        nextCoachMessage = `COACH: The encounter is complete! Here is your overall feedback:\n\n${overallFeedback}`;
        from = 'coach'; // Ensure final message is from coach.
      }

      // Update the main simulatorResponse if a phase transition message needs to take precedence.
      // This ensures the client shows the coach's phase transition message clearly.
      if (nextCoachMessage) {
        simulatorResponse = nextCoachMessage;
        from = 'coach';
      }
    }

    // Send the final response back to the client.
    res.status(200).json({
      simulatorResponse: simulatorResponse,
      from: from,
      scoreUpdate: scoreUpdate, // Score for the immediate turn/action.
      phaseComplete: phaseComplete,
      justificationForCompletion: justificationForCompletion, // More for internal use or detailed display.
      nextCoachMessage: nextCoachMessage, // Message for next phase if applicable.
      overallFeedback: overallFeedback, // Final feedback if encounter is truly over.
      encounterState: { // The full updated state for the client.
        currentPhase: nextPhase,
        providerTurnCount: providerTurnCount,
        phaseScores: phaseScores, // Updated with the score of the just-completed phase.
        currentCumulativeScore: currentCumulativeScore,
        totalPossibleScore: totalPossibleScore,
      },
      // Only include this if it was an "inject_provider_response" action to handle it client-side.
      injectedProviderResponse: injectedProviderResponseText,
    });
  } catch (error) {
    console.error('handleInteraction: Error processing interaction:', error);
    res.status(500).send('Failed to process interaction: ' + error.message);
  }
}

/**
 * Main Firebase HTTP Callable Function for the SUSAN Simulator.
 * This is the entry point for all client-side requests to the backend.
 * It routes requests to appropriate handler functions based on the 'action' in the request body.
 */
exports.susanSimulator = onRequest({cors: true}, async (req, res) => {
  // Only allow POST requests.
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Ensure the GEMINI_API_KEY is set.
    if (!GEMINI_API_KEY) {
      console.error('susanSimulator: GEMINI_API_KEY is not set in the environment.');
      return res.status(500).send('Server configuration error.');
    }

    console.log('susanSimulator: Received request body:', JSON.stringify(req.body, null, 2));

    const {action} = req.body; // Extract the action type from the request.

    // Route the request based on the action type.
    if (action === 'generate_patient') {
      console.log('susanSimulator: Routing to handleGeneratePatient.');
      await handleGeneratePatient(res);
    } else if (action === 'interact_conversation') {
      console.log('susanSimulator: Routing to handleInteraction for conversation.');
      await handleInteraction(req, res);
    } else if (action === 'get_help_advice') {
      console.log('susanSimulator: Routing to handleHelpAdvice.');
      const {patientInfo, providerPerception, question} = req.body;
      // Validate required data for help advice.
      if (!patientInfo || !providerPerception || !question) {
        return res.status(400).send('Missing data for help advice request.');
      }
      const advice = await getHelpAdviceFromGemini(patientInfo, providerPerception, question);
      res.status(200).json({advice: advice});
    } else {
      // Handle unknown or missing action types.
      console.warn('susanSimulator: Invalid or missing \'action\' in request body:', action);
      return res.status(400).send('Invalid or missing \'action\' in request body. Expected \'generate_patient\', \'interact_conversation\', or \'get_help_advice\'.');
    }
  } catch (error) {
    // Catch any unexpected errors during request processing.
    console.error('susanSimulator: Error processing request after retries:', error);
    res.status(500).send('An internal server error occurred: ' + error.message);
  }
});
