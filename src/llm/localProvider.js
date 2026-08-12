/**
 * Local (direct / BYOK) provider factory.
 *
 * Given a low-level LLM adapter — `{ generateJson(prompt, schema), generateText(prompt) }`
 * — this builds a full ECHO provider: the primitives the orchestrator needs plus
 * the component-facing methods (generatePatient, populateFields, helpAdvice,
 * generatePatientFromForm, interact). Anthropic and Gemini differ ONLY in the
 * adapter; all prompt building, schema use, validation, and orchestration are shared.
 */

import {
  buildGeneratePatientPrompt,
  buildInteractionPrompt,
  buildPhaseScorePrompt,
  buildOverallFeedbackPrompt,
  buildProviderResponsePrompt,
  buildHelpAdvicePrompt,
  buildPopulateFieldsPrompt,
} from './prompts.js';
import {
  INTERACTION_SCHEMA,
  PHASE_SCORE_SCHEMA,
  INJECTED_RESPONSE_SCHEMA,
  PATIENT_SCHEMA,
  PATIENT_FIELDS,
  validateInteractionResponse,
  validateScoreUpdate,
} from './schemas.js';
import { orchestrateInteraction } from './orchestrator.js';

const FORM_DEFAULTS = {
  name: 'Custom Patient',
  age: 35,
  genderIdentity: 'Not specified',
  pronouns: 'they/them',
  nativeLanguage: 'English',
  englishProficiency: 'Fluent',
  culturalBackground: 'Not specified',
  mainComplaint: 'General consultation',
  secondaryComplaint: '',
  hiddenConcern: '',
  patientPersona: 'Cooperative and engaged',
  illnessPerception_Ideas: 'Unsure about the cause',
  illnessPerception_Concerns: 'Wants to feel better',
  illnessPerception_Expectations: 'Hopes for effective treatment',
  relevantPastMedicalHistory: 'No significant past medical history',
  relevantMedicationsAndAllergies: 'No known medications or allergies',
  relevantFamilyHistory: 'Non-contributory family history',
  relevantSocialHistory: 'Non-smoker, occasional alcohol use',
  physicalExamFindings: 'Normal physical examination',
  correctDiagnosis: 'To be determined',
  managementPlanOutline: 'Supportive care and follow-up as needed',
  redFlags_worseningConditions: 'Return if symptoms worsen',
  familyInvolvementPreference: 'Moderate',
};

export function createLocalProvider({ generateJson, generateText }) {
  const api = {
    async getInteractionResponse({ patientState, history, currentPhase, phaseConfig, performanceRatio }) {
      const prompt = buildInteractionPrompt({ phaseConfig, currentPhase, patientState, history, performanceRatio });
      const parsed = await generateJson(prompt, INTERACTION_SCHEMA);
      return validateInteractionResponse(parsed);
    },

    async getPhaseScore({ patientState, history, phaseName, phaseDescription }) {
      const prompt = buildPhaseScorePrompt({ phaseName, phaseDescription, patientState, history });
      const parsed = await generateJson(prompt, PHASE_SCORE_SCHEMA);
      return validateScoreUpdate(parsed);
    },

    async getOverallFeedback({ patientState, phaseScores, history }) {
      const prompt = buildOverallFeedbackPrompt({ patientState, phaseScores, history });
      return (await generateText(prompt)).trim();
    },

    async getInjectedProviderResponse({ patientState, history, currentPhase, phaseName, phaseGoalDescription, responseType }) {
      const prompt = buildProviderResponsePrompt({ phaseName, currentPhase, phaseGoalDescription, patientState, history, responseType });
      const parsed = await generateJson(prompt, INJECTED_RESPONSE_SCHEMA);
      const text = typeof parsed.text === 'string' && parsed.text.trim()
        ? parsed.text
        : '(The AI was unable to generate an example response.)';
      return { text, scoreUpdate: validateScoreUpdate(parsed.scoreUpdate) };
    },
  };

  function normalizePatient(profile) {
    if (!profile || !profile.name || !profile.mainComplaint) {
      throw new Error('Generated patient profile is incomplete or malformed.');
    }
    if (typeof profile.age === 'string') profile.age = parseInt(profile.age, 10) || 0;
    return profile;
  }

  return {
    ...api,

    async generatePatient() {
      const parsed = await generateJson(buildGeneratePatientPrompt(), PATIENT_SCHEMA);
      return normalizePatient(parsed);
    },

    async generatePatientFromForm(formData) {
      const patient = { ...FORM_DEFAULTS };
      for (const field of PATIENT_FIELDS) {
        if (formData && formData[field] !== undefined && formData[field] !== '') {
          patient[field] = field === 'age' ? parseInt(formData[field], 10) || FORM_DEFAULTS.age : formData[field];
        }
      }
      return patient;
    },

    async populateFields({ description, existingData }) {
      const parsed = await generateJson(buildPopulateFieldsPrompt({ description }), PATIENT_SCHEMA);
      const merged = { ...parsed };
      if (existingData) {
        for (const key of Object.keys(existingData)) {
          const v = existingData[key];
          if (typeof v === 'string' && v.trim() !== '') merged[key] = v;
        }
      }
      return merged;
    },

    async helpAdvice({ patientInfo, providerPerception, question }) {
      const prompt = buildHelpAdvicePrompt({ patientInfo, providerPerception, question });
      return (await generateText(prompt)).trim();
    },

    interact(payload) {
      return orchestrateInteraction(api, payload);
    },
  };
}
