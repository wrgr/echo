import { describe, it, expect } from 'vitest';
import { createDemoProvider } from '../providers/demo.js';
import { orchestrateInteraction } from '../orchestrator.js';
import { validateScoreUpdate, INTERACTION_SCHEMA, toGeminiSchema } from '../schemas.js';
import { RUBRIC_CATEGORIES } from '../encounter.js';
import predefinedPatients from '../../patients/predefinedPatients.json';

describe('demo provider full encounter', () => {
  it('advances through all phases and produces final feedback offline', async () => {
    const demo = createDemoProvider();
    const patient = predefinedPatients[0];
    let encounterState = {
      currentPhase: 1,
      providerTurnCount: 0,
      phaseScores: {},
      currentCumulativeScore: 0,
      totalPossibleScore: 0,
    };
    const history = [];
    let overallFeedback = null;

    for (let i = 0; i < 40 && !overallFeedback; i++) {
      const input = `Provider turn ${i}`;
      const res = await demo.interact({
        actionType: 'regular_interaction',
        latestInput: input,
        patientState: patient,
        conversationHistory: history,
        encounterState,
      });
      // Mimic the frontend: append provider + response turns to the history.
      history.push({ role: 'provider', parts: [{ text: input }] });
      history.push({ role: res.from, parts: [{ text: res.simulatorResponse }] });
      encounterState = res.encounterState;
      if (res.overallFeedback) overallFeedback = res.overallFeedback;
    }

    expect(overallFeedback).toBeTruthy();
    expect(encounterState.currentPhase).toBe(6);
    expect(encounterState.totalPossibleScore).toBeGreaterThan(0);
    expect(Object.keys(encounterState.phaseScores).length).toBe(5);
  });
});

describe('score validation / clamping', () => {
  it('clamps out-of-range and non-numeric scores', () => {
    const raw = {
      communication: { points: 5, justification: 'too high' },
      trustRapport: { points: -2, justification: 'too low' },
      clinicalReasoning: { points: 'x', justification: 'bad' },
      // culturalHumility + sharedDecisionMaking missing entirely
    };
    const v = validateScoreUpdate(raw);
    expect(v.communication.points).toBe(3);
    expect(v.trustRapport.points).toBe(0);
    expect(v.clinicalReasoning.points).toBe(0);
    expect(v.culturalHumility.points).toBe(0);
    expect(Object.keys(v).sort()).toEqual([...RUBRIC_CATEGORIES].sort());
  });
});

describe('gemini schema adapter', () => {
  it('strips additionalProperties for Gemini', () => {
    const g = toGeminiSchema(INTERACTION_SCHEMA);
    expect(JSON.stringify(g)).not.toContain('additionalProperties');
    expect(g.properties.from.enum).toEqual(['patient', 'coach']);
  });
});
