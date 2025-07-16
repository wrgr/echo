// Node.js standard imports
const https = require('https');
const { Buffer } = require('buffer');
const admin = require('firebase-admin');

// Firebase Functions SDK imports
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
// Import defineSecret and defineString from 'firebase-functions/v2/params'
const { defineSecret } = require('firebase-functions/params'); // <--- THIS IS THE CHANGE

// Third-party middleware
const cors = require('cors')({ origin: true });

// --- Firebase Admin SDK Initialization ---
admin.initializeApp();

// --- Global Options for all v2 Functions ---
setGlobalOptions({ region: 'us-central1' });

// --- Define the Secret for Gemini API Key ---
// This tells Firebase that your function needs access to a secret named 'GEMINI_API_KEY'.
// The name here MUST match the name of the secret in Google Cloud Secret Manager.
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// --- Helper function for the API call with retries ---
// This function will now accept the secret object and extract its value when used.
// --- Helper function for the API call with retries ---
// Make the outer function `async`
const callGeminiWithRetries = async (geminiApiSecret, options, postData, retries = 3) => {
  // Await the secret value here, outside the Promise constructor
  const apiKey = await geminiApiSecret.value();

  // Construct the full path with the API key
  const fullPath = `${options.path}?key=${apiKey}`;

  return new Promise((resolve, reject) => { // Executor is NO LONGER async
    const attempt = (tryCount) => {
      // Create request options with the key appended to the path
      const reqOptions = {
        hostname: options.hostname,
        path: fullPath, // Use the fullPath which already includes the API key
        method: options.method,
        headers: options.headers,
      };

      const apiReq = https.request(reqOptions, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
          data += chunk;
        });
        apiRes.on('end', () => {
          if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
            resolve(data);
          } else {
            console.error(`API request failed with status ${apiRes.statusCode}: ${data}`);
            if (apiRes.statusCode >= 500 && tryCount > 1) {
              console.log(
                `Attempt ${retries - tryCount + 1} failed with status ${apiRes.statusCode}, retrying...`,
              );
              setTimeout(() => attempt(tryCount - 1), 1000);
            } else {
              reject(
                new Error(
                  `API request failed with status ${apiRes.statusCode}: ${data}`,
                ),
              );
            }
          }
        });
      });

      apiReq.on('error', (e) => {
        console.error(`API request network error: ${e.message}`);
        if (tryCount > 1) {
          console.log(
            `Attempt ${tryCount - 1} failed due to network error, retrying...`,
          );
          setTimeout(() => attempt(tryCount - 1), 1000);
        } else {
          reject(e);
        }
      });

      apiReq.write(postData);
      apiReq.end();
    };

    attempt(retries); // Start the first attempt
  });
};

// --- Encounter Phases Configuration (No change) ---
const ENCOUNTER_PHASES = { /* ... your ENCOUNTER_PHASES object ... */
  0: { // Special introductory phase, not scored directly
    name: 'Introduction & Initial Presentation',
    coachIntro: (patient) =>
      `Welcome to ECHO! You are entering a patient room, where you will meet ${patient.name}, a ${patient.age}-year-old ${patient.genderIdentity} (${patient.pronouns}) whose primary language is ${patient.nativeLanguage} (${patient.englishProficiency} English proficiency). Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter with cultural humility and shared understanding. Entering Phase 1: Initiation and Building the Relationship. What is your first step?"`,
    phaseGoalDescription: 'This is the initial introduction to the scenario. There are no direct tasks for the provider in this phase other than to transition into Phase 1.',
    maxTurns: 0, // No turns in this intro phase
  },
  1: {
    name: 'Initiation & Building the Relationship',
    coachIntro: null, // Intro handled by Phase 0's nextPhaseIntro
    coachPrompt: 'You are in Phase 1 (Initiation & Relationship). Focus on greeting the patient, introducing yourself, establishing rapport, and clearly identifying the patient\'s chief complaint and agenda for the visit.',
    phaseGoalDescription: 'The provider should greet the patient, introduce themselves, establish initial rapport, and identify the patient\'s chief complaint and their agenda for the visit. Key actions include: open-ended questions about their visit, empathetic statements, and active listening.',
    maxTurns: 10, // Auto-advance after 5 provider turns (10 total messages)
  },
  2: {
    name: 'Information Gathering & History Taking',
    coachIntro: null,
    coachPrompt: 'You are in Phase 2 (Information Gathering). Focus on a comprehensive History of Present Illness (HPI), and relevant Past Medical, Social, Family History. Critically, explore the patient\'s Ideas, Concerns, and Expectations.',
    phaseGoalDescription: 'The provider should gather a comprehensive History of Present Illness and inquire about relevant Past Medical History, Medications/Allergies, Family History, and Social History. It is crucial to explore the patient\'s Ideas, Concerns, and Expectations. The provider should use a mix of open-ended and focused questions, and demonstrate active listening.',
    maxTurns: 10, // Auto-advance after 10 provider turns (20 total messages)
  },
  3: {
    name: 'Physical Examination',
    coachIntro: null,
    coachPrompt: 'You are in Phase 3 (Physical Examination). Clearly state what exam components you are performing. Remember to explain what you\'re doing and ask for consent. The patient will then state the findings.',
    phaseGoalDescription: 'The provider should clearly state the intention to perform a physical exam, explain what will be done, and ask for consent. They should then state specific, focused components of the physical exam relevant to the patient\'s complaint. The patient will then provide relevant findings.',
    maxTurns: 7, // Auto-advance after 3 provider turns (6 total messages)
  },
  4: {
    name: 'Assessment & Plan / Shared Decision-Making',
    coachIntro: null,
    coachPrompt: 'You are in Phase 4 (Assessment & Plan). Your goal is to synthesize findings, state a diagnosis, propose a management plan, and ensure shared understanding with the patient. Use the teach-back method.',
    phaseGoalDescription: 'The provider should synthesize the gathered subjective and objective data, formulate and communicate a likely diagnosis to the patient, propose a management plan (tests, treatments, referrals), and engage in shared decision-making. Critically, the provider must use techniques like teach-back to ensure the patient\'s understanding and address their preferences and concerns.',
    maxTurns: 7, // Auto-advance after 7 provider turns (14 total messages)
  },
  5: {
    name: 'Closure',
    coachIntro: null,
    coachPrompt: 'You are in Phase 5 (Closure). Summarize the agreed-upon plan, provide safety netting instructions (what to do if symptoms worsen), and address any final questions the patient may have.',
    phaseGoalDescription: 'The provider should provide a concise summary of the encounter and the agreed-upon plan, give clear safety-netting instructions (what to do, when to seek help), invite any final questions or concerns from the patient, and professionally close the encounter.',
    maxTurns: 3, // Auto-advance after 3 provider turns (6 total messages)
  },
  6: { // Final phase, for displaying final score
    name: 'Encounter Complete',
    coachIntro: null,
    coachPrompt: 'The encounter is complete.',
    phaseGoalDescription: 'The simulation has ended. Review the total score and detailed feedback.',
    maxTurns: 0, // No turns in this final phase
  },
};


// Rubric for scoring each phase (No change)
const PHASE_RUBRIC = {
  communication: {max: 1, desc: 'Clear, active listening, appropriate language. Asks clear questions, summarizes effectively.'},
  trustRapport: {max: 1, desc: 'Establishes empathetic connection, shows respect, builds trust, manages emotions.'},
  accuracy: {max: 1, desc: 'Asks clinically relevant questions, gathers precise and complete information, identifies key symptoms/history.'},
  culturalHumility: {max: 1, desc: 'Explores patient\'s ideas/beliefs/context respectfully, avoids assumptions, acknowledges cultural factors in health/illness.'},
  sharedUnderstanding: {max: 1, desc: 'Ensures patient comprehension of information/plan, actively involves patient in decisions, uses teach-back.'},
};


// Helper function to get a score for a completed phase from Gemini
async function getPhaseScoreFromGemini(geminiApiSecret, patientState, conversationHistory, phaseName, phaseDescription) {
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
    path: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    const cleanResponseText = responseText.replace(/^```json\s*|\s*```$/gs, '');
    const parsedScore = JSON.parse(cleanResponseText);

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

// Helper function to generate a new patient profile from Gemini
/**
 * Generates a new patient profile from Gemini.
 * @param {Secret} geminiApiSecret - The Gemini API key secret object.
 * @return {Promise<object>} A promise that resolves with the generated patient profile.
 */
async function generatePatientFromGemini(geminiApiSecret) {
  const patientGenerationPrompt = `
    You are a medical simulation AI. Your task is to generate a detailed, realistic patient profile for a clinical encounter simulation. The patient should be a unique individual with specific characteristics and an accurate medical complaint. Ensure the patient's characteristics are diverse (e.g., varying age, gender identity, native language, English proficiency, cultural background, and type of complaint).

    Your entire response MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown or add any additional text.

    Response Format:
    {
      "name": "string",
      "age": number,
      "genderIdentity": "string (e.g., 'Male', 'Female', 'Non-binary')",
      "pronouns": "string (e.g., 'he/him', 'she/her', 'they/them')",
      "nativeLanguage": "string (e.g., 'Spanish', 'Somali', 'Mandarin', 'Vietnamese', 'Arabic', 'Russian')",
      "englishProficiency": "string ('None', 'Beginner', 'Limited', 'Fluent')",
      "culturalBackground": "string (brief description of cultural values relevant to healthcare, e.g., 'values family input', 'prefers traditional healing', 'may be hesitant to disclose')",
      "mainComplaint": "string (patient's chief complaint in their native language if not fluent, with English translation in parentheses if applicable)",
      "secondaryComplaint": "string (optional, a less prominent complaint)",
      "hiddenConcern": "string (an underlying worry the patient has but might not immediately state, e.g., 'worried about cancer', 'financial burden')",
      "illnessPerception_Ideas": "string (patient's ideas about what's causing their illness)",
      "illnessPerception_Concerns": "string (patient's worries/fears about their illness)",
      "illnessPerception_Expectations": "string (patient's expectations for diagnosis, treatment, and outcome)",
      "relevantPastMedicalHistory": "string (brief, relevant past medical history, e.g., 'Type 2 Diabetes', 'Asthma')",
      "relevantMedicationsAndAllergies": "string (brief, relevant medications and known allergies)",
      "relevantFamilyHistory": "string (brief, relevant family history, e.g., 'Mother had heart disease')",
      "relevantSocialHistory": "string (brief, relevant social history, lifestyle, living situation, occupation)",
      "physicalExamFindings": "string (brief, realistic physical exam findings relevant to main complaint)",
      "correctDiagnosis": "string (the most likely medical diagnosis)",
      "managementPlanOutline": "string (brief outline of management steps: tests, treatments, referrals)",
      "redFlags_worseningConditions": "string (what signs/symptoms would indicate a worsening condition that warrants immediate attention)",
      "familyInvolvementPreference": "string ('High', 'Medium', 'Low')",
      "patientPersona": "string (brief description of their general demeanor/attitude, e.g., 'anxious but cooperative', 'stoic', 'demanding')"
    }
  `;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': patientGenerationPrompt}]}],
    'generationConfig': {
      'temperature': 0.9, // Adjust temperature for variability (0.0 to 1.0)
      'maxOutputTokens': 1500, // Ensure enough tokens for a full profile
    },
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
    const geminiResponse = JSON.parse(rawData);
    if (!geminiResponse || !geminiResponse.candidates || !geminiResponse.candidates[0] ||
        !geminiResponse.candidates[0].content || !geminiResponse.candidates[0].content.parts ||
        !geminiResponse.candidates[0].content.parts[0] || !geminiResponse.candidates[0].content.parts[0].text) {
      console.error('Gemini did not return text content for patient generation:', JSON.stringify(geminiResponse, null, 2));
      throw new Error('Gemini response missing expected content for patient generation.');
    }
    const responseText = geminiResponse.candidates[0].content.parts[0].text;

    const cleanResponseText = responseText.replace(/^```json\s*|\s*```$/gs, '');
    const patientProfile = JSON.parse(cleanResponseText);

    if (!patientProfile || !patientProfile.name || !patientProfile.mainComplaint) {
      console.warn('Generated patient profile is incomplete:', patientProfile);
      throw new Error('Generated patient profile is incomplete or malformed.');
    }

    return patientProfile;
  } catch (error) {
    console.error('Error generating patient from Gemini:', error.message);
    throw new Error('Failed to generate patient from Gemini: ' + error.message);
  }
}
// Helper function to get overall feedback from Gemini at the end of the encounter
async function getOverallFeedbackFromGemini(geminiApiSecret, patientState, phaseScores, conversationHistory) {
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
    path: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    const cleanResponseText = responseText.replace(/^```(?:json|text)?\s*|\s*```$/gs, '');
    return cleanResponseText;
  } catch (error) {
    console.error('Error getting overall feedback from Gemini:', error.message);
    return 'An error occurred while generating overall feedback. Please check server logs.';
  }
}


// Helper function to get Gemini's response for a regular interaction
async function getGeminiResponseForInteraction(
  geminiApiSecret,
  patientState,
  formattedHistoryForGemini,
  latestInput,
  encounterState,
  currentPhase,
  phaseConfig,
  currentPerformanceRatio,
) {
  const fidelityInstruction = `Provider performance has been ${(currentPerformanceRatio * 100).toFixed(0)}% score so far. ` +
    (currentPerformanceRatio < 0.5 ?
      'The patient\'s provided information should now be less clear, more vague, or occasionally contradictory. Do not explicitly state this, but subtly withhold or muddle information.' :
      (currentPerformanceRatio < 0.75 ?
        'The patient\'s information may become slightly less direct or require more probing.' :
        'The patient should remain cooperative and provide information clearly and accurately based on their profile.'));

  const geminiPrompt = `
    You are ECHO, a clinical communication simulator.
    Your primary role is to act as the **patient** based on the provided 'Patient Profile' and 'Current Encounter Phase'.
    You will also act as the **coach** to provide feedback and facilitate phase progression.

    Your entire response MUST be a single, valid JSON object and nothing else.
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
    path: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
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


// Helper function to generate an injected provider response (good/poor)
async function generateInjectedProviderResponse(
  geminiApiSecret,
  patientState,
  conversationHistory,
  currentPhase,
  phaseName,
  phaseGoalDescription,
  responseType,
) {
  const prompt = `
    You are ECHO, a clinical communication simulator.
    Your task is to generate a **provider's response** that is either "${responseType}" or "poor" for the current clinical encounter context.
    You must also provide a score for this generated provider response based on the rubric.

    Your entire response MUST be a single, valid JSON object and nothing else.
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
    path: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
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


// Helper function for the new Help/Advice functionality
async function getHelpAdviceFromGemini(geminiApiSecret, patientInfo, providerPerception, question) {
  const prompt = `
    You are ECHO, an expert medical educator and communication coach.
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
    path: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  try {
    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
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

/**
 * Handles generating a new patient profile.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Secret} geminiApiSecret - The Gemini API key secret object.
 */
async function handleGeneratePatient(req, res, geminiApiSecret) {
  try {
    // Call the new helper function to generate a patient using Gemini
    const patientData = await generatePatientFromGemini(geminiApiSecret); 
    

    res.status(200).json({
      message: 'Patient generated successfully.',
      patient: patientData,
      initialCoachMessage: ENCOUNTER_PHASES[0].coachIntro(patientData),
      initialEncounterState: {
        currentPhase: 0,
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
 * Handles all types of simulation interactions (regular messages, tips, phase changes, injected responses).
 * @param {object} req - The Express request object containing interaction details.
 * @param {object} res - The Express response object.
 * @param {Secret} geminiApiSecret - The Gemini API key secret object.
 */
async function handleInteraction(req, res, geminiApiSecret) {
  try {
    const {actionType, patientState, conversationHistory, latestInput, encounterState} = req.body;

    if (!patientState || !conversationHistory || !encounterState) {
      return res.status(400).send('Missing required interaction data (patientState, conversationHistory, encounterState).');
    }

    let {currentPhase, providerTurnCount, phaseScores, currentCumulativeScore, totalPossibleScore} = encounterState;
    let currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];
    let simulatorResponse = '';
    let from = 'coach';
    let scoreUpdate = {};
    let phaseComplete = false;
    let justificationForCompletion = '';
    let nextCoachMessage = null;
    let overallFeedback = null;
    let injectedProviderResponseText = null;

    const performanceRatio = totalPossibleScore > 0 ? currentCumulativeScore / totalPossibleScore : 1;
    const updatedConversationHistory = [...conversationHistory];

    switch (actionType) {
      case 'regular_interaction': {
        if (currentPhase >= Object.keys(ENCOUNTER_PHASES).length - 1) {
          simulatorResponse = ENCOUNTER_PHASES[6].coachPrompt;
          from = 'coach';
          break;
        }

        providerTurnCount++;
        currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];

        const geminiRegularResponse = await getGeminiResponseForInteraction(
          geminiApiSecret,
          patientState,
          updatedConversationHistory,
          latestInput,
          encounterState,
          currentPhase,
          currentPhaseConfig,
          performanceRatio,
        );

        simulatorResponse = geminiRegularResponse.simulatorResponse;
        from = geminiRegularResponse.from;
        scoreUpdate = geminiRegularResponse.scoreUpdate;
        phaseComplete = geminiRegularResponse.phaseAssessment.phaseComplete;
        justificationForCompletion = geminiRegularResponse.phaseAssessment.justificationForCompletion;

        for (const category in scoreUpdate) {
          if (Object.hasOwnProperty.call(scoreUpdate, category)) {
            currentCumulativeScore += scoreUpdate[category].points;
            totalPossibleScore += PHASE_RUBRIC[category].max;
          }
        }

        if (!phaseComplete && currentPhaseConfig.maxTurns > 0 && providerTurnCount >= currentPhaseConfig.maxTurns) {
          phaseComplete = true;
          justificationForCompletion = `Automatically advanced after ${providerTurnCount} turns.`;
          if (from === 'patient') {
            simulatorResponse += `\n\nCOACH: ${justificationForCompletion}`;
            from = 'coach';
          } else {
            simulatorResponse = `COACH: ${justificationForCompletion}\n\n` + simulatorResponse;
          }
        }
        break;
      }
      case 'get_coach_tip':
        currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];
        simulatorResponse = currentPhaseConfig.coachPrompt || 'I don\'t have a specific tip for this phase right now. Keep focusing on the phase goals!';
        from = 'coach';
        scoreUpdate = Object.fromEntries(
          Object.keys(PHASE_RUBRIC).map((key) => [key, {points: 0, justification: 'Requested coach tip (no score update for turn).'}]),
        );
        break;

      case 'inject_provider_response':{
        const responseType = latestInput;
        currentPhaseConfig = ENCOUNTER_PHASES[currentPhase];

        const injectedResponseData = await generateInjectedProviderResponse(
          geminiApiSecret,
          patientState,
          updatedConversationHistory,
          currentPhase,
          currentPhaseConfig.name,
          currentPhaseConfig.phaseGoalDescription,
          responseType,
        );

        injectedProviderResponseText = injectedResponseData.text;
        updatedConversationHistory.push({role: 'provider', parts: [{text: injectedProviderResponseText}]});
        providerTurnCount++;

        const patientReactionData = await getGeminiResponseForInteraction(
          geminiApiSecret,
          patientState,
          updatedConversationHistory,
          injectedProviderResponseText,
          encounterState,
          currentPhase,
          currentPhaseConfig,
          performanceRatio,
        );

        simulatorResponse = patientReactionData.simulatorResponse;
        from = patientReactionData.from;
        scoreUpdate = patientReactionData.scoreUpdate;
        phaseComplete = patientReactionData.phaseAssessment.phaseComplete;
        justificationForCompletion = patientReactionData.phaseAssessment.justificationForCompletion;

        for (const category in scoreUpdate) {
          if (Object.hasOwnProperty.call(scoreUpdate, category)) {
            currentCumulativeScore += scoreUpdate[category].points;
            totalPossibleScore += PHASE_RUBRIC[category].max;
          }
        }

        if (!phaseComplete && currentPhaseConfig.maxTurns > 0 && providerTurnCount >= currentPhaseConfig.maxTurns) {
          phaseComplete = true;
          justificationForCompletion = `Automatically advanced after ${providerTurnCount} turns due to injected response.`;
          if (from === 'patient') {
            simulatorResponse += `\n\nCOACH: ${justificationForCompletion}`;
            from = 'coach';
          } else {
            simulatorResponse = `COACH: ${justificationForCompletion}\n\n` + simulatorResponse;
          }
        }
        break;
      }
      case 'move_to_next_phase':
        if (currentPhase >= Object.keys(ENCOUNTER_PHASES).length - 1) {
          simulatorResponse = ENCOUNTER_PHASES[6].coachPrompt;
          from = 'coach';
          break;
        }
        phaseComplete = true;
        justificationForCompletion = 'Manually advanced by provider.';
        simulatorResponse = `COACH: You have chosen to advance to the next phase. ${justificationForCompletion}`;
        from = 'coach';
        scoreUpdate = Object.fromEntries(
          Object.keys(PHASE_RUBRIC).map((key) => [key, {points: 0, justification: 'Phase manually advanced. No AI score provided for this specific turn.'}]),
        );
        break;

      default:
        console.warn('handleInteraction: Unknown actionType received:', actionType);
        return res.status(400).send('Invalid \'actionType\' for interaction.');
    }

    let nextPhase = currentPhase;

    if (phaseComplete) {
      const completedPhaseName = ENCOUNTER_PHASES[currentPhase].name;
      const completedPhaseDescription = ENCOUNTER_PHASES[currentPhase].phaseGoalDescription;

      console.log(`Phase ${currentPhase} (${completedPhaseName}) completed. Calculating score for this phase.`);
      const fullPhaseScore = await getPhaseScoreFromGemini(geminiApiSecret, patientState, updatedConversationHistory, completedPhaseName, completedPhaseDescription);

      phaseScores = {...phaseScores, [completedPhaseName]: fullPhaseScore};

      for (const category in fullPhaseScore) {
        if (Object.hasOwnProperty.call(fullPhaseScore, category)) {
          currentCumulativeScore += (fullPhaseScore[category]?.points || 0);
          totalPossibleScore += (PHASE_RUBRIC[category]?.max || 0);
        }
      }

      nextPhase = currentPhase + 1;
      const nextPhaseConfig = ENCOUNTER_PHASES[nextPhase];

      providerTurnCount = 0;

      if (nextPhaseConfig) {
        if (nextPhaseConfig.coachIntro) {
          nextCoachMessage = nextPhaseConfig.coachIntro(patientState);
        } else if (nextPhaseConfig.coachPrompt) {
          nextCoachMessage = `COACH: Transitioning to **Phase ${nextPhase}: ${nextPhaseConfig.name}**. ${nextPhaseConfig.coachPrompt}`;
        }
      }

      if (nextPhase === Object.keys(ENCOUNTER_PHASES).length - 1) {
        console.log('Encounter is complete. Generating overall feedback.');
        overallFeedback = await getOverallFeedbackFromGemini(geminiApiSecret, patientState, phaseScores, updatedConversationHistory);
        nextCoachMessage = `COACH: The encounter is complete! Here is your overall feedback:\n\n${overallFeedback}`;
        from = 'coach';
      }

      if (nextCoachMessage) {
        simulatorResponse = nextCoachMessage;
        from = 'coach';
      }
    }


    res.status(200).json({
      simulatorResponse: simulatorResponse,
      from: from,
      scoreUpdate: scoreUpdate,
      phaseComplete: phaseComplete,
      justificationForCompletion: justificationForCompletion,
      nextCoachMessage: nextCoachMessage,
      overallFeedback: overallFeedback,
      encounterState: {
        currentPhase: nextPhase,
        providerTurnCount: providerTurnCount,
        phaseScores: phaseScores,
        currentCumulativeScore: currentCumulativeScore,
        totalPossibleScore: totalPossibleScore,
      },
      injectedProviderResponse: injectedProviderResponseText,
    });
  } catch (error) {
    console.error('handleInteraction: Error processing interaction:', error);
    res.status(500).send('Failed to process interaction: ' + error.message);
  }
}


/**
 * Main HTTP trigger for the simulator. Routes requests based on 'action'.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
exports.echoSimulator = onRequest({ cors: true, secrets: [GEMINI_API_KEY] }, async (req, res) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return cors(req, res, () => res.status(204).send(''));
  }

  // Apply CORS middleware for actual requests
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      // The secret value is now accessed via GEMINI_API_KEY.value()
      // The `secrets: [GEMINI_API_KEY]` in onRequest ensures it's loaded.
      // We don't need a direct `if (!GEMINI_API_KEY)` check here like before,
      // as `defineSecret` handles the binding and will throw a deployment error
      // if the secret isn't configured in Secret Manager.
      // If the secret is accessed before it's ready, the .value() call might throw.
      // The `secrets` option in onRequest ensures it's available.

      console.log('echoSimulator: Received request body:', JSON.stringify(req.body, null, 2));

      const {action} = req.body;

      if (action === 'generate_patient') {
        console.log('echoSimulator: Routing to handleGeneratePatient.');
        await handleGeneratePatient(req, res, GEMINI_API_KEY); // Pass the secret object
      } else if (action === 'interact_conversation') {
        console.log('echoSimulator: Routing to handleInteraction for conversation.');
        await handleInteraction(req, res, GEMINI_API_KEY); // Pass the secret object
      } else if (action === 'get_help_advice') {
        console.log('echoSimulator: Routing to handleHelpAdvice.');
        const {patientInfo, providerPerception, question} = req.body;
        if (!patientInfo || !providerPerception || !question) {
          return res.status(400).send('Missing data for help advice request.');
        }
        await getHelpAdviceFromGemini(GEMINI_API_KEY, patientInfo, providerPerception, question)
          .then(advice => res.status(200).json({advice: advice}))
          .catch(error => {
            console.error('echoSimulator: Error getting help advice from Gemini:', error);
            res.status(500).send('Failed to get help advice: ' + error.message);
          });
      } else {
        console.warn('echoSimulator: Invalid or missing \'action\' in request body:', action);
        return res.status(400).send('Invalid or missing \'action\' in request body. Expected \'generate_patient\', \'interact_conversation\', or \'get_help_advice\'.');
      }
    } catch (error) {
      console.error('echoSimulator: Error processing request:', error);
      res.status(500).send('An internal server error occurred: ' + error.message);
    }
  });
});
