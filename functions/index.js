// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 1: IMPORTS AND SETUP
// ============================================================================

// Node.js standard imports
const https = require('https');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Firebase Functions SDK imports
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');

// Third-party middleware
const cors = require('cors')({ origin: true });

// --- Firebase Admin SDK Initialization ---
admin.initializeApp();

// --- Global Options for all v2 Functions ---
setGlobalOptions({ region: 'us-central1' });

// --- Define the Secret for Gemini API Key ---
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Load prompt templates from JSON file
const promptsPath = path.join(__dirname, 'prompts.json');
const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
const promptMap = Object.fromEntries(promptsData.map(p => [p.prompt, p]));

// Utility to interpolate template strings using variables
const formatPrompt = (template, vars = {}) =>
  new Function(...Object.keys(vars), `return \`${template}\`;`)(
    ...Object.values(vars),
  );

const getPrompt = (name) => {
  if (!promptMap[name]) {
    throw new Error(`Prompt '${name}' not found in prompts.json`);
  }
  return promptMap[name].promptText;
};

// --- Helper function for the API call with retries ---
const callGeminiWithRetries = async (geminiApiSecret, options, postData, retries = 3) => {
  const apiKey = await geminiApiSecret.value();
  const fullPath = `${options.path}?key=${apiKey}`;

  return new Promise((resolve, reject) => {
    const attempt = (tryCount) => {
      const reqOptions = {
        hostname: options.hostname,
        path: fullPath,
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
              console.log(`Attempt ${retries - tryCount + 1} failed with status ${apiRes.statusCode}, retrying...`);
              setTimeout(() => attempt(tryCount - 1), 1000);
            } else {
              reject(new Error(`API request failed with status ${apiRes.statusCode}: ${data}`));
            }
          }
        });
      });

      apiReq.on('error', (e) => {
        console.error(`API request network error: ${e.message}`);
        if (tryCount > 1) {
          console.log(`Attempt ${tryCount - 1} failed due to network error, retrying...`);
          setTimeout(() => attempt(tryCount - 1), 1000);
        } else {
          reject(e);
        }
      });

      apiReq.write(postData);
      apiReq.end();
    };

    attempt(retries);
  });
};

// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 2: CONFIGURATION
// ============================================================================

// --- Encounter Phases Configuration ---
const ENCOUNTER_PHASES = {
  0: {
    name: 'Introduction & Initial Presentation',
    coachIntro: (patient) =>
      `Welcome to ECHO! You are entering a patient room, where you will meet ${patient.name}, a ${patient.age}-year-old ${patient.genderIdentity} (${patient.pronouns}) whose primary language is ${patient.nativeLanguage} (${patient.englishProficiency} English proficiency). Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter with cultural humility and shared understanding. Entering Phase 1: Initiation and Building the Relationship. What is your first step?`,
    phaseGoalDescription: 'This is the initial introduction to the scenario. There are no direct tasks for the provider in this phase other than to transition into Phase 1.',
    maxTurns: 0,
  },
  1: {
    name: 'Initiation & Building the Relationship',
    coachIntro: null,
    coachPrompt: 'You are in Phase 1 (Initiation & Relationship). Focus on greeting the patient, introducing yourself, establishing rapport, and clearly identifying the patient\'s chief complaint and agenda for the visit.',
    phaseGoalDescription: 'The provider should greet the patient, introduce themselves, establish initial rapport, and identify the patient\'s chief complaint and their agenda for the visit. Key actions include: open-ended questions about their visit, empathetic statements, and active listening.',
    maxTurns: 10,
  },
  2: {
    name: 'Information Gathering & History Taking',
    coachIntro: null,
    coachPrompt: 'You are in Phase 2 (Information Gathering). Focus on a comprehensive History of Present Illness (HPI), and relevant Past Medical, Social, Family History. Critically, explore the patient\'s Ideas, Concerns, and Expectations.',
    phaseGoalDescription: 'The provider should gather a comprehensive History of Present Illness and inquire about relevant Past Medical History, Medications/Allergies, Family History, and Social History. It is crucial to explore the patient\'s Ideas, Concerns, and Expectations. The provider should use a mix of open-ended and focused questions, and demonstrate active listening.',
    maxTurns: 10,
  },
  3: {
    name: 'Physical Examination',
    coachIntro: null,
    coachPrompt: 'You are in Phase 3 (Physical Examination). Clearly state what exam components you are performing. Remember to explain what you\'re doing and ask for consent. The patient will then state the findings.',
    phaseGoalDescription: 'The provider should clearly state the intention to perform a physical exam, explain what will be done, and ask for consent. They should then state specific, focused components of the physical exam relevant to the patient\'s complaint. The patient will then provide relevant findings.',
    maxTurns: 7,
  },
  4: {
    name: 'Assessment & Plan / Shared Decision-Making',
    coachIntro: null,
    coachPrompt: 'You are in Phase 4 (Assessment & Plan). Your goal is to synthesize findings, state a diagnosis, propose a management plan, and ensure shared understanding with the patient. Use the teach-back method.',
    phaseGoalDescription: 'The provider should synthesize the gathered subjective and objective data, formulate and communicate a likely diagnosis to the patient, propose a management plan (tests, treatments, referrals), and engage in shared decision-making. Critically, the provider must use techniques like teach-back to ensure the patient\'s understanding and address their preferences and concerns.',
    maxTurns: 7,
  },
  5: {
    name: 'Closure',
    coachIntro: null,
    coachPrompt: 'You are in Phase 5 (Closure). Summarize the agreed-upon plan, provide safety netting instructions (what to do if symptoms worsen), and address any final questions the patient may have.',
    phaseGoalDescription: 'The provider should provide a concise summary of the encounter and the agreed-upon plan, give clear safety-netting instructions (what to do, when to seek help), invite any final questions or concerns from the patient, and professionally close the encounter.',
    maxTurns: 3,
  },
  6: {
    name: 'Encounter Complete',
    coachIntro: null,
    coachPrompt: 'The encounter is complete.',
    phaseGoalDescription: 'The simulation has ended. Review the total score and detailed feedback.',
    maxTurns: 0,
  },
};

// Rubric for scoring each phase
const PHASE_RUBRIC = {
  communication: {max: 1, desc: 'Clear, active listening, appropriate language. Asks clear questions, summarizes effectively.'},
  trustRapport: {max: 1, desc: 'Establishes empathetic connection, shows respect, builds trust, manages emotions.'},
  accuracy: {max: 1, desc: 'Asks clinically relevant questions, gathers precise and complete information, identifies key symptoms/history.'},
  culturalHumility: {max: 1, desc: 'Explores patient\'s ideas/beliefs/context respectfully, avoids assumptions, acknowledges cultural factors in health/illness.'},
  sharedUnderstanding: {max: 1, desc: 'Ensures patient comprehension of information/plan, actively involves patient in decisions, uses teach-back.'},
};


// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 3: ENHANCED PATIENT GENERATION
// ============================================================================

// ENHANCED: Helper function to generate a new patient profile from Gemini
async function generatePatientFromGemini(geminiApiSecret) {
  console.log('🎭 Starting enhanced patient generation...');
  
  // Get base prompt
  const basePrompt = getPrompt('generate_patient');
  
  // Add randomization elements to ensure variety
  const randomElements = [
    'Consider including patients from diverse cultural backgrounds: Latino/Hispanic, African American, Asian (Chinese, Korean, Japanese, Vietnamese, etc.), Middle Eastern, European, Native American, Pacific Islander, or mixed heritage.',
    'Vary the age range: young adults (18-30), middle-aged (31-55), older adults (56-75), or elderly (75+).',
    'Include different English proficiency levels: None, Limited, Beginner, Intermediate, Conversational, or Fluent.',
    'Consider various medical presentations: acute vs chronic, common vs uncommon, physical vs mental health, preventive care visits.',
    'Include diverse socioeconomic backgrounds and living situations.',
  ];
  
  // Add timestamp-based seed for additional randomization
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  
  // Enhanced prompt with randomization instructions
  const enhancedPrompt = `${basePrompt}

IMPORTANT RANDOMIZATION INSTRUCTIONS:
${randomElements.join('\n')}

Generation Seed: ${timestamp}-${randomSeed}

Make this patient profile unique and different from previous generations. Ensure clinical realism while maximizing educational diversity. Choose unexpected but realistic combinations of demographics, cultural backgrounds, and medical conditions.`;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': enhancedPrompt}]}],
    'generationConfig': {
      'temperature': 1.0,        // Maximum creativity for uniqueness
      'topP': 0.9,              // Use nucleus sampling for variety
      'topK': 40,               // Consider top 40 tokens for diversity
      'maxOutputTokens': 2000,   // Allow for detailed profiles
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

    console.log('✅ Successfully generated unique patient:', patientProfile.name, '-', patientProfile.mainComplaint);
    return patientProfile;
  } catch (error) {
    console.error('Error generating patient from Gemini:', error.message);
    throw new Error('Failed to generate patient from Gemini: ' + error.message);
  }
}
// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 4: HELPER FUNCTIONS
// ============================================================================

// Helper function to get a score for a completed phase from Gemini
async function getPhaseScoreFromGemini(geminiApiSecret, patientState, conversationHistory, phaseName, phaseDescription) {
  const scorePrompt = formatPrompt(getPrompt('phase_score'), {
    phaseName,
    phaseDescription,
    patientState: JSON.stringify(patientState, null, 2),
    conversationHistory: JSON.stringify(conversationHistory, null, 2),
    PHASE_RUBRIC,
  });

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

// Helper function to get overall feedback from Gemini at the end of the encounter
async function getOverallFeedbackFromGemini(geminiApiSecret, patientState, phaseScores, conversationHistory) {
  const feedbackPrompt = formatPrompt(getPrompt('overall_feedback'), {
    patientState: JSON.stringify(patientState, null, 2),
    phaseScores: JSON.stringify(phaseScores, null, 2),
    conversationHistory: JSON.stringify(conversationHistory, null, 2),
  });

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

  const geminiPrompt = formatPrompt(getPrompt("gemini_interaction"), {
    phaseConfig,
    currentPhase,
    patientState,
    formattedHistoryForGemini,
    fidelityInstruction,
    PHASE_RUBRIC,
  });

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
  const prompt = formatPrompt(getPrompt("provider_response"), {
    patientState,
    conversationHistory,
    currentPhase,
    phaseName,
    phaseGoalDescription,
    responseType,
    PHASE_RUBRIC,
  });

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

// Helper function for the Help/Advice functionality
async function getHelpAdviceFromGemini(geminiApiSecret, patientInfo, providerPerception, question) {
  const prompt = formatPrompt(getPrompt("help_advice"), {
    patientInfo,
    providerPerception,
    question,
  });

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
// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 5: REQUEST HANDLERS
// ============================================================================

// Handler for generating a new patient profile
async function handleGeneratePatient(req, res, geminiApiSecret) {
  try {
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

// Handler for generating a patient from form data
async function handleGeneratePatientFromForm(req, res, geminiApiSecret) {
  try {
    const { formData } = req.body;
    
    if (!formData) {
      return res.status(400).send('Missing form data for patient generation.');
    }

    // Create patient profile from form data
    const patientProfile = {
      name: formData.name || 'Custom Patient',
      age: parseInt(formData.age) || 35,
      genderIdentity: formData.genderIdentity || 'Not specified',
      pronouns: formData.pronouns || 'they/them',
      nativeLanguage: formData.nativeLanguage || 'English',
      englishProficiency: formData.englishProficiency || 'Fluent',
      culturalBackground: formData.culturalBackground || 'Not specified',
      mainComplaint: formData.mainComplaint || 'General consultation',
      secondaryComplaint: formData.secondaryComplaint || '',
      hiddenConcern: formData.hiddenConcern || '',
      patientPersona: formData.patientPersona || 'Cooperative and engaged',
      illnessPerception_Ideas: formData.illnessPerception_Ideas || 'Unsure about the cause',
      illnessPerception_Concerns: formData.illnessPerception_Concerns || 'Wants to feel better',
      illnessPerception_Expectations: formData.illnessPerception_Expectations || 'Hopes for effective treatment',
      relevantPastMedicalHistory: formData.relevantPastMedicalHistory || 'No significant past medical history',
      relevantMedicationsAndAllergies: formData.relevantMedicationsAndAllergies || 'No known medications or allergies',
      relevantFamilyHistory: formData.relevantFamilyHistory || 'Non-contributory family history',
      relevantSocialHistory: formData.relevantSocialHistory || 'Non-smoker, occasional alcohol use',
      physicalExamFindings: formData.physicalExamFindings || 'Normal physical examination',
      correctDiagnosis: formData.correctDiagnosis || 'To be determined',
      managementPlanOutline: formData.managementPlanOutline || 'Supportive care and follow-up as needed',
      redFlags_worseningConditions: formData.redFlags_worseningConditions || 'Return if symptoms worsen',
      familyInvolvementPreference: formData.familyInvolvementPreference || 'Moderate'
    };

    res.status(200).json({
      message: 'Patient generated from form successfully.',
      patient: patientProfile,
    });
    console.log('handleGeneratePatientFromForm: Patient generated from form:', patientProfile.name);
  } catch (error) {
    console.error('handleGeneratePatientFromForm: Error generating patient from form:', error);
    res.status(500).send('Failed to generate patient from form: ' + error.message);
  }
}
// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 6: MAIN INTERACTION HANDLER
// ============================================================================

// Handler for all types of simulation interactions
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

      case 'inject_provider_response': {
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

    // Handle phase completion and transitions
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

// ============================================================================
// ECHO SIMULATOR - FIREBASE CLOUD FUNCTION - PART 7: AI POPULATE FIELDS AND MAIN EXPORT
// ============================================================================

// Handler for AI field population
async function handleAiPopulateFields(req, res, geminiApiSecret) {
  try {
    const { description, existingData } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description is required and must be a string' });
    }

    const populatePrompt = `You are an expert medical educator creating realistic patient scenarios. Based on the following patient description, please populate ALL the form fields with realistic, clinically accurate information.

Patient Description: "${description}"

Please respond with a JSON object containing ALL of the following fields. If information isn't provided in the description, create realistic details that are consistent with the scenario:

{
  "name": "Full patient name (create if not provided)",
  "age": "Age in years (number or realistic estimate)",
  "genderIdentity": "Gender identity (Male/Female/Non-binary)",
  "pronouns": "Appropriate pronouns (he/him, she/her, they/them)",
  "mainComplaint": "Primary presenting complaint",
  "secondaryComplaint": "Secondary concerns if any",
  "hiddenConcern": "What the patient is really worried about but might not say directly",
  "nativeLanguage": "Patient's first language",
  "englishProficiency": "None/Limited/Beginner/Intermediate/Conversational/Fluent",
  "culturalBackground": "Cultural/ethnic background and relevant cultural considerations",
  "patientPersona": "Personality traits, communication style, demeanor",
  "illnessPerception_Ideas": "What the patient thinks is causing their symptoms",
  "illnessPerception_Concerns": "What worries the patient most about their condition",
  "illnessPerception_Expectations": "What the patient hopes to achieve from this visit",
  "relevantPastMedicalHistory": "Relevant past medical conditions and surgeries",
  "relevantMedicationsAndAllergies": "Current medications and known allergies",
  "relevantFamilyHistory": "Relevant family medical history",
  "relevantSocialHistory": "Social factors affecting health (work, living situation, habits)",
  "physicalExamFindings": "Expected physical examination findings",
  "correctDiagnosis": "The most likely diagnosis",
  "managementPlanOutline": "Appropriate treatment and follow-up plan",
  "redFlags_worseningConditions": "Warning signs that would indicate worsening",
  "familyInvolvementPreference": "High/Moderate/Low - how much family should be involved"
}

Make sure the information is:
- Clinically realistic and appropriate
- Culturally sensitive and accurate
- Internally consistent
- Educationally valuable for healthcare providers
- Specific enough to guide a realistic patient interaction

Return ONLY the JSON object, no additional text.`;

    const postData = JSON.stringify({
      'contents': [{'parts': [{'text': populatePrompt}]}],
      'generationConfig': {
        'temperature': 0.7,
        'maxOutputTokens': 2000,
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

    const rawData = await callGeminiWithRetries(geminiApiSecret, options, postData);
    const geminiResponse = JSON.parse(rawData);
    const responseText = geminiResponse.candidates[0].content.parts[0].text;
    
    let populatedFields;
    try {
      const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
      populatedFields = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing Gemini JSON response:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse AI response. Please try rephrasing your description.',
        details: parseError.message 
      });
    }
    
    const requiredFields = [
      'name', 'age', 'genderIdentity', 'pronouns', 'mainComplaint', 
      'nativeLanguage', 'englishProficiency', 'culturalBackground', 
      'correctDiagnosis'
    ];
    
    const missingFields = requiredFields.filter(field => !populatedFields[field]);
    if (missingFields.length > 0) {
      console.warn('Missing required fields from AI response:', missingFields);
      missingFields.forEach(field => {
        switch(field) {
          case 'name': populatedFields[field] = 'Patient Name'; break;
          case 'age': populatedFields[field] = '45'; break;
          case 'genderIdentity': populatedFields[field] = 'Not specified'; break;
          case 'pronouns': populatedFields[field] = 'they/them'; break;
          case 'mainComplaint': populatedFields[field] = 'General consultation'; break;
          case 'nativeLanguage': populatedFields[field] = 'English'; break;
          case 'englishProficiency': populatedFields[field] = 'Fluent'; break;
          case 'culturalBackground': populatedFields[field] = 'Not specified'; break;
          case 'correctDiagnosis': populatedFields[field] = 'To be determined'; break;
        }
      });
    }
    
    const mergedFields = { ...populatedFields };
    if (existingData) {
      Object.keys(existingData).forEach(key => {
        if (existingData[key] && existingData[key].trim() !== '') {
          mergedFields[key] = existingData[key];
        }
      });
    }
    
    console.log('Successfully populated patient fields via AI');
    
    res.json({
      success: true,
      populatedFields: mergedFields,
      message: 'Fields populated successfully with AI assistance'
    });
    
  } catch (error) {
    console.error('Error in handleAiPopulateFields:', error);
    res.status(500).json({ 
      error: 'Failed to populate fields with AI assistance',
      details: error.message 
    });
  }
}

// ============================================================================
// MAIN HTTP CLOUD FUNCTION EXPORT
// ============================================================================

/**
 * Main HTTP trigger for the simulator. Routes requests based on 'action'.
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
      console.log('echoSimulator: Received request body:', JSON.stringify(req.body, null, 2));

      const {action} = req.body;

      if (action === 'generate_patient') {
        console.log('echoSimulator: Routing to handleGeneratePatient.');
        await handleGeneratePatient(req, res, GEMINI_API_KEY);
      } else if (action === 'interact_conversation') {
        console.log('echoSimulator: Routing to handleInteraction for conversation.');
        await handleInteraction(req, res, GEMINI_API_KEY);
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
      } else if (action === 'ai_populate_fields') {
        console.log('echoSimulator: Routing to handleAiPopulateFields.');
        await handleAiPopulateFields(req, res, GEMINI_API_KEY);
      } else if (action === 'generate_patient_from_form') {
        console.log('echoSimulator: Routing to handleGeneratePatientFromForm.');
        await handleGeneratePatientFromForm(req, res, GEMINI_API_KEY);
      } else {
        console.warn('echoSimulator: Invalid or missing \'action\' in request body:', action);
        return res.status(400).send('Invalid or missing \'action\' in request body. Expected \'generate_patient\', \'interact_conversation\', \'get_help_advice\', \'ai_populate_fields\', or \'generate_patient_from_form\'.');
      }
    } catch (error) {
      console.error('echoSimulator: Error processing request:', error);
      res.status(500).send('An internal server error occurred: ' + error.message);
    }
  });
});
