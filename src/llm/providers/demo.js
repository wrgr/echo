/**
 * Demo provider — a fully offline, canned encounter.
 *
 * Purpose: bridge the keyless first-run gap. A brand-new user with no API key
 * (and who doesn't want to use the shared backend) can still click through a
 * complete ECHO encounter to see how it works, with zero network calls. Replies
 * and scores are scripted; it reuses the real orchestrator so phase/score/flow
 * behavior matches the live providers.
 */

import predefinedPatients from '../../patients/predefinedPatients.json';
import { orchestrateInteraction } from '../orchestrator.js';
import { RUBRIC_CATEGORIES } from '../encounter.js';

const DEMO_JUSTIFICATION = 'Demo mode: scores are illustrative and fixed at "Meets Expectations".';

function demoScore() {
  return Object.fromEntries(RUBRIC_CATEGORIES.map((k) => [k, { points: 2, justification: DEMO_JUSTIFICATION }]));
}

// A small pool of plausible patient lines per phase, so the flow feels real.
const PATIENT_LINES = {
  1: [
    "Hello, doctor. Thank you for seeing me today.",
    "Yes, that's me. I've been meaning to come in for a while.",
  ],
  2: [
    "It started a few weeks ago and it's been getting worse. I'm a bit worried about what it could be.",
    "I haven't had anything like this before. My family has a history of similar problems, though.",
  ],
  3: [
    "Okay, that's fine. Please go ahead — thank you for explaining what you're doing.",
    "It's a little tender right there, but I'm comfortable. Thank you for being gentle.",
  ],
  4: [
    "That makes sense. So you're saying we should try this first and see how it goes?",
    "I understand. I'd like to be involved in deciding what happens next.",
  ],
  5: [
    "Thank you, doctor. I feel much better knowing what the plan is.",
    "Yes, I'll watch for those warning signs and come back if anything changes.",
  ],
};

function demoReply(phase, history) {
  const lines = PATIENT_LINES[phase] || ['I see. Please continue.'];
  const providerTurns = history.filter((m) => m.role === 'provider').length;
  return lines[(providerTurns - 1 + lines.length) % lines.length];
}

const DEMO_FEEDBACK = `Demo Encounter Summary

This is a scripted demo, so the feedback below is illustrative rather than a real assessment of your performance.

1. Overall Performance Level (RIME): Interpreter — you moved through the encounter and engaged the patient at each phase.
2. Strengths: You greeted the patient, explored their concerns, and involved them in the plan.
3. Areas for Growth: In a real encounter, try open-to-closed questioning and explicitly explore the patient's Ideas, Concerns, and Expectations (ICE).
4. Cultural Competency: Adapt your language to the patient's background and check understanding with teach-back.
5. Clinical Reasoning: Gather pertinent positives and negatives systematically before planning.
6. Recommended Practice Focus: Add your own Anthropic or Gemini API key in Settings to run real, scored encounters with live feedback.`;

const demoApi = {
  async getInteractionResponse({ currentPhase, history }) {
    const providerTurns = history.filter((m) => m.role === 'provider').length;
    return {
      from: 'patient',
      simulatorResponse: demoReply(currentPhase, history),
      phaseAssessment: {
        phaseComplete: providerTurns > 0 && providerTurns % 2 === 0,
        justificationForCompletion: 'Demo mode: advancing after two exchanges in this phase.',
      },
      scoreUpdate: demoScore(),
    };
  },
  async getPhaseScore() {
    return demoScore();
  },
  async getOverallFeedback() {
    return DEMO_FEEDBACK;
  },
  async getInjectedProviderResponse() {
    return {
      text: '(Demo) "I understand this has been worrying you. Can you tell me more about what you\'ve been experiencing?"',
      scoreUpdate: demoScore(),
    };
  },
};

export function createDemoProvider() {
  return {
    interact(payload) {
      return orchestrateInteraction(demoApi, payload);
    },

    async generatePatient() {
      const i = Math.floor(Math.random() * predefinedPatients.length);
      return predefinedPatients[i];
    },

    async generatePatientFromForm(formData) {
      return { name: 'Demo Patient', age: 40, mainComplaint: 'General consultation', ...formData };
    },

    async populateFields({ description }) {
      return {
        name: 'Demo Patient',
        age: 40,
        mainComplaint: description ? description.slice(0, 120) : 'General consultation',
        patientPersona: 'Cooperative (demo)',
      };
    },

    async helpAdvice() {
      return 'Demo mode: AI coaching is disabled. Add an Anthropic or Gemini API key in Settings (or select the shared backend) to get real, framework-based advice.';
    },
  };
}
