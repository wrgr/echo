/**
 * Client-side encounter orchestrator.
 *
 * Ported from functions/handlers.js `handleInteraction` so that direct (BYOK)
 * providers can run a full ECHO encounter in the browser with no backend. It
 * owns the phase/turn/score bookkeeping and calls provider "primitives" for the
 * actual model work:
 *
 *   api.getInteractionResponse({ patientState, history, currentPhase, phaseConfig, performanceRatio })
 *   api.getPhaseScore({ patientState, history, phaseName, phaseDescription })
 *   api.getOverallFeedback({ patientState, phaseScores, history })
 *   api.getInjectedProviderResponse({ patientState, history, currentPhase, phaseName, phaseGoalDescription, responseType })
 *
 * Returns the same response shape the Firebase backend returned, so the React
 * layer (useSimulation) is agnostic to which provider produced it.
 */

import { ENCOUNTER_PHASES, PHASE_RUBRIC, RUBRIC_CATEGORIES } from './encounter.js';

const MAX_INPUT_LENGTH = 5000;

export function sanitizeUserInput(text) {
  if (typeof text !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  let clean = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (clean.length > MAX_INPUT_LENGTH) clean = clean.substring(0, MAX_INPUT_LENGTH);
  return clean.trim();
}

function accumulateScore(scoreUpdate, currentCumulativeScore, totalPossibleScore) {
  for (const category in scoreUpdate) {
    if (Object.prototype.hasOwnProperty.call(scoreUpdate, category) && PHASE_RUBRIC[category]) {
      const pts = Math.max(0, Math.min(PHASE_RUBRIC[category].max, Math.round(scoreUpdate[category].points || 0)));
      currentCumulativeScore += pts;
      totalPossibleScore += PHASE_RUBRIC[category].max;
    }
  }
  return { currentCumulativeScore, totalPossibleScore };
}

function zeroScore(justification) {
  return Object.fromEntries(RUBRIC_CATEGORIES.map((k) => [k, { points: 0, justification }]));
}

const LAST_PHASE = Object.keys(ENCOUNTER_PHASES).length - 1; // 6

export async function orchestrateInteraction(api, { actionType, latestInput, patientState, conversationHistory, encounterState }) {
  const cleanInput = sanitizeUserInput(latestInput);
  let { currentPhase, providerTurnCount, phaseScores, currentCumulativeScore, totalPossibleScore } = encounterState;
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
  const updatedHistory = [...conversationHistory];

  switch (actionType) {
    case 'regular_interaction': {
      if (currentPhase >= LAST_PHASE) {
        simulatorResponse = ENCOUNTER_PHASES[LAST_PHASE].coachPrompt;
        from = 'coach';
        break;
      }
      providerTurnCount++;
      // Ensure the model sees the provider's latest message.
      updatedHistory.push({ role: 'provider', parts: [{ text: cleanInput }] });

      const res = await api.getInteractionResponse({
        patientState,
        history: updatedHistory,
        currentPhase,
        phaseConfig: currentPhaseConfig,
        performanceRatio,
      });

      simulatorResponse = res.simulatorResponse;
      from = res.from;
      scoreUpdate = res.scoreUpdate;
      phaseComplete = res.phaseAssessment.phaseComplete;
      justificationForCompletion = res.phaseAssessment.justificationForCompletion;

      ({ currentCumulativeScore, totalPossibleScore } = accumulateScore(scoreUpdate, currentCumulativeScore, totalPossibleScore));

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
      simulatorResponse = currentPhaseConfig.coachPrompt || "I don't have a specific tip for this phase right now. Keep focusing on the phase goals!";
      from = 'coach';
      scoreUpdate = zeroScore('Requested coach tip (no score update for turn).');
      break;

    case 'inject_provider_response': {
      const responseType = cleanInput;
      const injected = await api.getInjectedProviderResponse({
        patientState,
        history: updatedHistory,
        currentPhase,
        phaseName: currentPhaseConfig.name,
        phaseGoalDescription: currentPhaseConfig.phaseGoalDescription,
        responseType,
      });

      injectedProviderResponseText = injected.text;
      updatedHistory.push({ role: 'provider', parts: [{ text: injectedProviderResponseText }] });
      providerTurnCount++;

      const reaction = await api.getInteractionResponse({
        patientState,
        history: updatedHistory,
        currentPhase,
        phaseConfig: currentPhaseConfig,
        performanceRatio,
      });

      simulatorResponse = reaction.simulatorResponse;
      from = reaction.from;
      scoreUpdate = reaction.scoreUpdate;
      phaseComplete = reaction.phaseAssessment.phaseComplete;
      justificationForCompletion = reaction.phaseAssessment.justificationForCompletion;

      ({ currentCumulativeScore, totalPossibleScore } = accumulateScore(scoreUpdate, currentCumulativeScore, totalPossibleScore));
      break;
    }

    case 'move_to_next_phase':
      if (currentPhase >= LAST_PHASE) {
        simulatorResponse = ENCOUNTER_PHASES[LAST_PHASE].coachPrompt;
        from = 'coach';
        break;
      }
      phaseComplete = true;
      justificationForCompletion = 'Manually advanced by provider.';
      simulatorResponse = `COACH: You have chosen to advance to the next phase. ${justificationForCompletion}`;
      from = 'coach';
      scoreUpdate = zeroScore('Phase manually advanced. No AI score provided for this specific turn.');
      break;

    default:
      throw new Error(`Invalid actionType for interaction: ${actionType}`);
  }

  let nextPhase = currentPhase;

  if (phaseComplete) {
    const completedPhaseName = ENCOUNTER_PHASES[currentPhase].name;
    const completedPhaseDescription = ENCOUNTER_PHASES[currentPhase].phaseGoalDescription;

    const fullPhaseScore = await api.getPhaseScore({
      patientState,
      history: updatedHistory,
      phaseName: completedPhaseName,
      phaseDescription: completedPhaseDescription,
    });

    phaseScores = { ...phaseScores, [completedPhaseName]: fullPhaseScore };
    ({ currentCumulativeScore, totalPossibleScore } = accumulateScore(fullPhaseScore, currentCumulativeScore, totalPossibleScore));

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

    if (nextPhase === LAST_PHASE) {
      overallFeedback = await api.getOverallFeedback({ patientState, phaseScores, history: updatedHistory });
      nextCoachMessage = `COACH: The encounter is complete! Here is your overall feedback:\n\n${overallFeedback}`;
      from = 'coach';
    }

    if (nextCoachMessage) {
      simulatorResponse = nextCoachMessage;
      from = 'coach';
    }
  }

  return {
    simulatorResponse,
    from,
    scoreUpdate,
    phaseComplete,
    justificationForCompletion,
    nextCoachMessage,
    overallFeedback,
    encounterState: {
      currentPhase: nextPhase,
      providerTurnCount,
      phaseScores,
      currentCumulativeScore,
      totalPossibleScore,
    },
    injectedProviderResponse: injectedProviderResponseText,
  };
}
