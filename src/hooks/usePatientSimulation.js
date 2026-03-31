// src/hooks/usePatientSimulation.js

import { useState, useCallback, useEffect } from 'react';
import { PATIENT_COMMUNICATION_RUBRIC } from '../utils/patientConstants';

const FUNCTION_URL =
  'https://us-central1-echo-d825e.cloudfunctions.net/echoSimulator';

export const usePatientSimulation = () => {
  // ─── State ───────────────────────────────────────────────────────────────
  const [conversation, setConversation] = useState([]);
  const [conversationHistoryForAPI, setConversationHistoryForAPI] = useState([]);
  const [patientState, setPatientState] = useState(null);
  const [encounterState, setEncounterState] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentSpecialty, setCurrentSpecialty] = useState(null);

  const [rubricScores, setRubricScores] = useState({});
  const [currentScore, setCurrentScore] = useState(0);
  const [feedback, setFeedback] = useState(null);



















//   // ─── startSimulation ─────────────────────────────────────────────────────


const startSimulation = useCallback(async (scenario, specialty) => {
  console.log('[startSimulation] begin', { scenario, specialty });

  setCurrentScenario(scenario);
  setCurrentSpecialty(specialty);
  setConversation([]);
  setConversationHistoryForAPI([]);
  setEncounterState(null);
  setFeedback(null);
  setCurrentScore(0);
  setRubricScores({});

  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate_patient' }),
  });
  console.log('[startSimulation] status', resp.status);

  if (!resp.ok) {
    console.error('[startSimulation] fail:', await resp.text());
    return;
  }
  const data = await resp.json();
  console.log('[startSimulation] ok', data);

  setPatientState(data.patient);
  setEncounterState(data.initialEncounterState);

  setConversation([
    {
      role: 'coach',
      content: data.initialCoachMessage,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  setConversationHistoryForAPI([
    { role: 'coach', parts: [{ text: data.initialCoachMessage }] },
  ]);

  setIsActive(true);
}, []);








// const startSimulation = useCallback(async (scenario, specialty) => {
//   // 0) store selection
//   setCurrentScenario(scenario);
//   setCurrentSpecialty(specialty);

//   // 1) make a simple patientState from the scenario (no generation)
//   const ps = {
//     name: 'You',
//     mainComplaint: scenario.title,
//     scenarioId: scenario.id,
//     specialtyId: specialty.id,
//     scenarioContext: scenario.context,
//     patientPersona: 'Engaged and curious',
//     englishProficiency: 'Fluent',
//     // add anything else you want, these fields are optional
//   };

//   const initialEncounter = {
//     currentPhase: 0,
//     providerTurnCount: 0,
//     phaseScores: {},
//     currentCumulativeScore: 0,
//     totalPossibleScore: 0,
//   };

//   // 2) set local state
//   setPatientState(ps);
//   setEncounterState(initialEncounter);
//   setConversation([]);
//   setConversationHistoryForAPI([]);
//   setFeedback(null);
//   setCurrentScore(0);
//   setRubricScores({});

//   // 3) get a coach tip from your existing function to start the session
//   const resp = await fetch(FUNCTION_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       action: 'interact_conversation',
//       actionType: 'get_coach_tip',
//       latestInput: '',
//       patientState: ps,
//       conversationHistory: [],
//       encounterState: initialEncounter,
//     }),
//   });

//   if (!resp.ok) {
//     console.error('startSimulation get_coach_tip failed:', await resp.text());
//     return;
//   }
//   const data = await resp.json();

//   // 4) seed the chat with the coach’s message
//   const ts = new Date().toLocaleTimeString();
//   setConversation([{ role: data.from || 'coach', content: data.simulatorResponse, timestamp: ts }]);
//   setConversationHistoryForAPI([{ role: data.from || 'coach', parts: [{ text: data.simulatorResponse }] }]);
//   setIsActive(true);
// }, []);


















  // ─── sendMessage ─────────────────────────────────────────────────────────

  


const sendMessage = useCallback(
  async (message, phase) => {
    if (!isActive) return;

    // add patient turn
    const userMsg = {
      role: 'patient',
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setConversation(prev => [...prev, userMsg]);

    // build updated history to send
    const newHistory = [
      ...conversationHistoryForAPI,
      { role: 'patient', parts: [{ text: message }] },
    ];
    setConversationHistoryForAPI(newHistory);

    // call Cloud Function
    const resp = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'interact_conversation',
        actionType: 'regular_interaction',       // <-- REQUIRED
        latestInput: message,
        patientState,
        conversationHistory: newHistory,         // <-- send updated history
        encounterState,
      }),
    });

    if (!resp.ok) {
      console.error('sendMessage error:', await resp.text());
      return;
    }
    const data = await resp.json();

    // append simulator response
    setConversation(prev => [
      ...prev,
      {
        role: data.from,
        content: data.simulatorResponse,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setConversationHistoryForAPI(prev => [
      ...prev,
      { role: data.from, parts: [{ text: data.simulatorResponse }] },
    ]);

    if (data.nextCoachMessage) {
      setConversation(prev => [
        ...prev,
        {
          role: 'coach',
          content: data.nextCoachMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setConversationHistoryForAPI(prev => [
        ...prev,
        { role: 'coach', parts: [{ text: data.nextCoachMessage }] },
      ]);
    }

    setEncounterState(data.encounterState);
  },
  [isActive, patientState, conversationHistoryForAPI, encounterState]
);




















// const sendMessage = useCallback(async (message) => {
//   if (!isActive) return;

//   const ts = new Date().toLocaleTimeString();

//   // add patient turn locally
//   const userMsg = { role: 'patient', content: message, timestamp: ts };
//   setConversation(prev => [...prev, userMsg]);

//   // build the history we will send (use local variable so it's not stale)
//   const localHistory = [
//     ...conversationHistoryForAPI,
//     { role: 'patient', parts: [{ text: message }] },
//   ];

//   // call your function
//   const resp = await fetch(FUNCTION_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       action: 'interact_conversation',
//       actionType: 'regular_interaction',   // <-- REQUIRED
//       latestInput: message,
//       patientState,                        // <-- we set in startSimulation
//       conversationHistory: localHistory,   // <-- send the updated history
//       encounterState,                      // <-- current encounter state
//     }),
//   });

//   if (!resp.ok) {
//     console.error('sendMessage error:', await resp.text());
//     return;
//   }
//   const data = await resp.json();

//   // append simulator response
//   const simTs = new Date().toLocaleTimeString();
//   setConversation(prev => [
//     ...prev,
//     { role: data.from, content: data.simulatorResponse, timestamp: simTs },
//   ]);

//   // update history & encounter
//   setConversationHistoryForAPI(localHistory.concat([
//     { role: data.from, parts: [{ text: data.simulatorResponse }] },
//   ]));

//   if (data.nextCoachMessage) {
//     const coachTs = new Date().toLocaleTimeString();
//     setConversation(prev => [
//       ...prev,
//       { role: 'coach', content: data.nextCoachMessage, timestamp: coachTs },
//     ]);
//     setConversationHistoryForAPI(prev => [
//       ...prev,
//       { role: 'coach', parts: [{ text: data.nextCoachMessage }] },
//     ]);
//   }

//   setEncounterState(data.encounterState);
// }, [isActive, patientState, conversationHistoryForAPI, encounterState]);



















  // ─── endSimulation ─────────────────────────────────────────────────────────
  const endSimulation = useCallback(() => {
    if (!isActive) return;
    setConversation(prev => [
      ...prev,
      {
        role: 'system',
        content: 'Session ended. Thanks for participating!',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setIsActive(false);
  }, [isActive]);

  // ─── resetSimulation ───────────────────────────────────────────────────────
  const resetSimulation = useCallback(() => {
    setConversation([]);
    setConversationHistoryForAPI([]);
    setPatientState(null);
    setEncounterState(null);
    setIsActive(false);
    setCurrentScenario(null);
    setCurrentSpecialty(null);
    setRubricScores({});
    setCurrentScore(0);
    setFeedback(null);
  }, []);

  // ─── persist to localStorage (optional) ───────────────────────────────────
  useEffect(() => {
    if (conversation.length) {
      localStorage.setItem(
        'patientSimState',
        JSON.stringify({
          conversation,
          conversationHistoryForAPI,
          encounterState,
          isActive,
          currentScenario: currentScenario?.id,
          currentSpecialty: currentSpecialty?.id,
        })
      );
    }
  }, [
    conversation,
    conversationHistoryForAPI,
    encounterState,
    isActive,
    currentScenario,
    currentSpecialty,
  ]);

  // ─── restore from localStorage (optional) ────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('patientSimState');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.isActive) {
          setConversation(s.conversation);
          setConversationHistoryForAPI(s.conversationHistoryForAPI);
          setEncounterState(s.encounterState);
          setIsActive(s.isActive);
        }
      } catch {}
    }
  }, []);

  // ─── all the hook’s public API ────────────────────────────────────────────
  return {
    conversation,
    conversationHistoryForAPI,
    patientState,
    encounterState,
    rubricScores,
    currentScore,
    feedback,
    isActive,
    currentScenario,
    currentSpecialty,
    startSimulation,
    sendMessage,
    endSimulation,
    resetSimulation,
  };
};
