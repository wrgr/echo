const https = require('https');
const { Buffer } = require('buffer');

const { formatPrompt, getPrompt } = require('./prompts');
const { PHASE_RUBRIC } = require('./constants');

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

async function generatePatientFromGemini(geminiApiSecret) {
  console.log('🎭 Starting enhanced patient generation...');

  const basePrompt = getPrompt('generate_patient');

  const randomElements = [
    'Consider including patients from diverse cultural backgrounds: Latino/Hispanic, African American, Asian (Chinese, Korean, Japanese, Vietnamese, etc.), Middle Eastern, European, Native American, Pacific Islander, or mixed heritage.',
    'Vary the age range: young adults (18-30), middle-aged (31-55), older adults (56-75), or elderly (75+).',
    'Include different English proficiency levels: None, Limited, Beginner, Intermediate, Conversational, or Fluent.',
    'Consider various medical presentations: acute vs chronic, common vs uncommon, physical vs mental health, preventive care visits.',
    'Include diverse socioeconomic backgrounds and living situations.',
  ];

  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);

  const enhancedPrompt = `${basePrompt}

IMPORTANT RANDOMIZATION INSTRUCTIONS:
${randomElements.join('\n')}

Generation Seed: ${timestamp}-${randomSeed}

Make this patient profile unique and different from previous generations. Ensure clinical realism while maximizing educational diversity. Choose unexpected but realistic combinations of demographics, cultural backgrounds, and medical conditions.`;

  const postData = JSON.stringify({
    'contents': [{'parts': [{'text': enhancedPrompt}]}],
    'generationConfig': {
      'temperature': 1.0,
      'topP': 0.9,
      'topK': 40,
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

  const geminiPrompt = formatPrompt(getPrompt('gemini_interaction'), {
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

async function generateInjectedProviderResponse(
  geminiApiSecret,
  patientState,
  conversationHistory,
  currentPhase,
  phaseName,
  phaseGoalDescription,
  responseType,
) {
  const prompt = formatPrompt(getPrompt('provider_response'), {
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

async function getHelpAdviceFromGemini(geminiApiSecret, patientInfo, providerPerception, question) {
  const prompt = formatPrompt(getPrompt('help_advice'), {
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

module.exports = {
  callGeminiWithRetries,
  generatePatientFromGemini,
  getPhaseScoreFromGemini,
  getOverallFeedbackFromGemini,
  getGeminiResponseForInteraction,
  generateInjectedProviderResponse,
  getHelpAdviceFromGemini,
};
