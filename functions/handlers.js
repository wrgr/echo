const { Buffer } = require('buffer');

const { ENCOUNTER_PHASES, PHASE_RUBRIC } = require('./constants');
const {
  callGeminiWithRetries,
  generatePatientFromGemini,
  getPhaseScoreFromGemini,
  getOverallFeedbackFromGemini,
  getGeminiResponseForInteraction,
  generateInjectedProviderResponse,
} = require('./gemini');
const { formatPatientResponse } = require('./languageUtils');

async function handleGeneratePatient(req, res, geminiApiSecret) {
  try {
    const patientData = await generatePatientFromGemini(geminiApiSecret);

    res.status(200).json({
      message: 'Patient generated successfully.',
      patient: patientData,
      initialCoachMessage: ENCOUNTER_PHASES[0].coachIntro(patientData),
      initialEncounterState: {
        currentPhase: 1, // Start at Phase 1
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

async function handleGeneratePatientFromForm(req, res, geminiApiSecret) {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).send('Missing form data for patient generation.');
    }

    const patientProfile = {
      name: formData.name || 'Custom Patient',
      age: parseInt(formData.age, 10) || 35,
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
        updatedConversationHistory.push({ role: 'provider', parts: [{ text: latestInput }] });
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
        if (from === 'patient') {
          simulatorResponse = await formatPatientResponse(
            simulatorResponse,
            patientState.englishProficiency,
            patientState.nativeLanguage,
          );
        }
        updatedConversationHistory.push({ role: from, parts: [{ text: simulatorResponse }] });
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
        if (from === 'patient') {
          simulatorResponse = await formatPatientResponse(
            simulatorResponse,
            patientState.englishProficiency,
            patientState.nativeLanguage,
          );
        }
        updatedConversationHistory.push({ role: from, parts: [{ text: simulatorResponse }] });
        for (const category in scoreUpdate) {
          if (Object.hasOwnProperty.call(scoreUpdate, category)) {
            currentCumulativeScore += scoreUpdate[category].points;
            totalPossibleScore += PHASE_RUBRIC[category].max;
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

      if (nextPhaseConfig && nextPhase > 1) {
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
          default: break;
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

module.exports = {
  handleGeneratePatient,
  handleGeneratePatientFromForm,
  handleInteraction,
  handleAiPopulateFields,
};
