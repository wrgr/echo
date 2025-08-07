import { useState, useCallback, useEffect, useRef } from 'react';
import predefinedPatients from '../patients/predefinedPatients.json';
import { ENCOUNTER_PHASES_CLIENT, PHASE_RUBRIC_DEFINITIONS } from '../utils/constants';
import { useUserPatients } from './useUserPatients';

export const useSimulation = () => {
  const [messages, setMessages] = useState([]);
  const [conversationHistoryForAPI, setConversationHistoryForAPI] = useState([]);
  const conversationHistoryRef = useRef([]);
  const [patientState, setPatientState] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState('');
  const [error, setError] = useState(null);
  const [showCoachPanel, setShowCoachPanel] = useState(false);

  const [showFullPatientInfo, setShowFullPatientInfo] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);

  const [encounterState, setEncounterState] = useState({
    currentPhase: 0,
    providerTurnCount: 0,
    phaseScores: {},
    currentCumulativeScore: 0,
    totalPossibleScore: 0,
  });

  const [overallFeedback, setOverallFeedback] = useState(null);

  const { userPatients, refreshUserPatients } = useUserPatients();

  const functionUrl = 'https://us-central1-echo-d825e.cloudfunctions.net/echoSimulator';

  const resetSimulation = useCallback(() => {
    setIsLoading(false);
    setMessages([]);
    setConversationHistoryForAPI([]);
    conversationHistoryRef.current = [];
    setPatientState(null);
    setSelectedPatientIndex('');
    setShowFullPatientInfo(false);
    setShowScoringModal(false);
    setShowCoachPanel(false);
    setOverallFeedback(null);
    setError(null);
    setEncounterState({
      currentPhase: 0,
      providerTurnCount: 0,
      phaseScores: {},
      currentCumulativeScore: 0,
      totalPossibleScore: 0,
    });
  }, []);

  const loadPatient = useCallback((patientProfile, initialCoachMessage, initialEncounterState) => {
    setPatientState(patientProfile);
    setMessages([{ text: initialCoachMessage, from: 'coach' }]);
    setConversationHistoryForAPI([]);
    conversationHistoryRef.current = [];
    setEncounterState(initialEncounterState);
  }, []);

  const handlePredefinedPatientChange = useCallback((event) => {
    resetSimulation();
    const value = event.target.value;
    setSelectedPatientIndex(value);

    if (value !== '') {
      let patient;
      let isUserGenerated = false;

      if (value.startsWith('user-')) {
        const userId = parseInt(value.replace('user-', ''), 10);
        patient = userPatients.find(p => p.id === userId);
        isUserGenerated = true;
      } else {
        const index = parseInt(value, 10);
        patient = predefinedPatients[index];
      }

      if (patient) {
        const initialCoachMessage = ENCOUNTER_PHASES_CLIENT[0].coachIntro(patient);
        setPatientState(patient);
        setMessages([{ text: initialCoachMessage, from: 'coach' }]);
        setConversationHistoryForAPI([]);
        conversationHistoryRef.current = [];
        setEncounterState({
          currentPhase: 1,
          providerTurnCount: 0,
          phaseScores: {},
          currentCumulativeScore: 0,
          totalPossibleScore: 0,
        });

        if (isUserGenerated) {
          console.log('Loaded user-generated patient:', patient.name);
        }
      }
    }
  }, [resetSimulation, userPatients]);

  const sendInteractionToServer = useCallback(async (actionType, input) => {
    if (!patientState || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'interact_conversation',
          actionType: actionType,
          latestInput: input,
          patientState: patientState,
          conversationHistory: conversationHistoryRef.current,
          encounterState: encounterState,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log('Received data from server:', data);

      setPatientState(data.patientState || patientState);
      setEncounterState(data.encounterState);
      setOverallFeedback(data.overallFeedback);

      if (data.injectedProviderResponse) {
        setMessages((prev) => [...prev, { text: data.injectedProviderResponse, from: 'provider' }]);
        setConversationHistoryForAPI((prev) => {
          const updated = [...prev, { role: 'provider', parts: [{ text: data.injectedProviderResponse }] }];
          conversationHistoryRef.current = updated;
          return updated;
        });
      }

      setMessages((prev) => [...prev, { text: data.simulatorResponse, from: data.from }]);
      setConversationHistoryForAPI((prev) => {
        const updated = [...prev, { role: data.from, parts: [{ text: data.simulatorResponse }] }];
        conversationHistoryRef.current = updated;
        return updated;
      });

      if (data.nextCoachMessage && data.nextCoachMessage !== data.simulatorResponse) {
        setMessages((prev) => [...prev, { text: data.nextCoachMessage, from: 'coach' }]);
        setConversationHistoryForAPI((prev) => {
          const updated = [...prev, { role: 'coach', parts: [{ text: data.nextCoachMessage }] }];
          conversationHistoryRef.current = updated;
          return updated;
        });
      }

    } catch (err) {
      console.error('Failed to communicate with cloud function:', err);
      setError(`Failed to communicate with the AI backend: ${err.message}. Please try again.`);
      setMessages((prev) => [...prev, { text: `Sorry, an error occurred with the AI backend. Check console for details.`, from: 'coach' }]);

      if (actionType === 'regular_interaction') {
        setConversationHistoryForAPI((prev) => {
          const updated = prev.slice(0, -1);
          conversationHistoryRef.current = updated;
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [patientState, isLoading, encounterState, functionUrl]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || !patientState || isLoading || encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
      if (encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
        setMessages((prev) => [...prev, { text: 'The encounter is complete. Please start a new patient.', from: 'coach'}]);
      }
      setInputValue('');
      return;
    }

    const providerMessageText = inputValue;
    setMessages((prev) => [...prev, { text: providerMessageText, from: 'provider' }]);
    const updatedHistory = [...conversationHistoryRef.current, { role: 'provider', parts: [{ text: providerMessageText }] }];
    setConversationHistoryForAPI(updatedHistory);
    conversationHistoryRef.current = updatedHistory;
    setInputValue('');

    await sendInteractionToServer('regular_interaction', providerMessageText);
  };

  const handleCoachTipRequest = async () => {
    setShowCoachPanel(true);
    await sendInteractionToServer('get_coach_tip', '');
  };

  const handleInjectProviderResponse = async (type) => {
    await sendInteractionToServer('inject_provider_response', type);
  };

  const handleMoveToNextPhase = async () => {
    await sendInteractionToServer('move_to_next_phase', '');
  };

  const getProgressPercentage = () => {
    const totalPhases = Object.keys(ENCOUNTER_PHASES_CLIENT).length - 2;
    const currentProgress = Math.max(0, encounterState.currentPhase - 1);
    return Math.min(100, (currentProgress / totalPhases) * 100);
  };

  const getScoreClass = (score, maxScore) => {
    if (maxScore === 0) return 'score-neutral';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'score-good';
    if (percentage >= 60) return 'score-average';
    return 'score-poor';
  };

  const downloadTranscript = () => {
    const transcriptContent = messages.map((msg) => {
      const cleanText = msg.text.replace(/\*\*(.*?)\*\*/g, '$1');
      return `[${msg.from.toUpperCase()}] ${cleanText}`;
    }).join('\n\n');

    let scoreSummary = '\n\n--- ENCOUNTER SUMMARY ---\n';
    scoreSummary += `Total Score: ${encounterState.currentCumulativeScore} / ${encounterState.totalPossibleScore}\n\n`;

    if (typeof encounterState.phaseScores === 'object' && encounterState.phaseScores !== null) {
      Object.entries(encounterState.phaseScores).forEach(([phaseName, phaseCategoryScores]) => {
        if (phaseCategoryScores) {
          scoreSummary += `\n--- ${phaseName} Score ---\n`;
          Object.entries(PHASE_RUBRIC_DEFINITIONS).forEach(([catKey, catDef]) => {
            const score = phaseCategoryScores[catKey];
            if (score) {
              scoreSummary += `${catDef.label}: ${score.points}/${catDef.max} - ${score.justification}\n`;
            }
          });
        }
      });
    }

    if (overallFeedback) {
      scoreSummary += `\n\n--- OVERALL FEEDBACK ---\n${overallFeedback}\n`;
    }

    const blob = new Blob([transcriptContent + scoreSummary], {type: 'text/plain;charset=utf-8'});
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10);
    const fileName = `ECHO_Encounter_Transcript_${patientState?.name?.replace(/\s/g, '_') || 'unknown_patient'}_${dateString}.txt`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    if (!patientState && predefinedPatients.length > 0) {
      const patient = predefinedPatients[0];
      const initialCoachMessage = ENCOUNTER_PHASES_CLIENT[0].coachIntro(patient);
      setPatientState(patient);
      setMessages([{ text: initialCoachMessage, from: 'coach' }]);
      setSelectedPatientIndex('0');
      setEncounterState({
        currentPhase: 1,
        providerTurnCount: 0,
        phaseScores: {},
        currentCumulativeScore: 0,
        totalPossibleScore: 0,
      });
    }
  }, [patientState]);

  useEffect(() => {
    refreshUserPatients();
  }, [refreshUserPatients]);

  return {
    messages,
    conversationHistoryForAPI,
    patientState,
    inputValue,
    isLoading,
    selectedPatientIndex,
    error,
    showCoachPanel,
    showFullPatientInfo,
    showScoringModal,
    encounterState,
    overallFeedback,
    userPatients,
    refreshUserPatients,
    setInputValue,
    setShowFullPatientInfo,
    setShowScoringModal,
    setShowCoachPanel,
    setSelectedPatientIndex,
    resetSimulation,
    loadPatient,
    handlePredefinedPatientChange,
    sendInteractionToServer,
    handleSendMessage,
    handleCoachTipRequest,
    handleInjectProviderResponse,
    handleMoveToNextPhase,
    getProgressPercentage,
    getScoreClass,
    downloadTranscript,
  };
};
