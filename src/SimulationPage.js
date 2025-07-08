import React, { useState, useEffect, useRef, useCallback } from "react";
import predefinedPatients from "./predefinedPatients.json";
import styled from '@emotion/styled';
import { css } from '@emotion/react';

// --- Media Query Constants ---
const mobileBreakpoint = '768px';

// --- Styled Components with Emotion ---

const AppContainer = styled.div`
  font-family: 'Roboto', sans-serif;
  max-width: 1200px;
  width: 98%;
  margin: 30px auto;
  padding: 0;
  border: 1px solid #dbe1e8;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(21, 48, 74, 0.08);
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 98vh; /* This is crucial for vertical flex layout */
  overflow: hidden; /* Prevents scrollbars on the main container itself */
  min-height: 600px;

  @media (max-width: ${mobileBreakpoint}) {
    margin: 0;
    height: auto;
    min-height: 100vh;
    border-radius: 0;
    border: none;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const DynamicPatientHeader = styled.div`
  background-color: #eef2f7;
  border-bottom: 1px solid #dbe1e8;
  padding: 10px 20px;
  font-size: 0.9em;
  color: #334155;
  text-align: center;
  line-height: 1.5;
  flex-shrink: 0;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 8px 10px;
    font-size: 0.8em;
  }
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden; /* Important for containing chat and potential side panels */

  @media (max-width: ${mobileBreakpoint}) {
    flex-direction: column;
    flex-grow: 0;
    height: auto;
    overflow-y: visible;
  }
`;

const ChatAndInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;

  @media (max-width: ${mobileBreakpoint}) {
    width: 100%;
    flex-grow: 0;
    height: auto;
    min-height: 40vh;
    overflow-y: auto; /* Ensures scrollability on mobile */
  }
`;

const ChatWindow = styled.div`
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto; /* Enables scrolling for chat messages */
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 10px;
  }
`;

const MessageBase = styled.div`
  padding: 12px 18px;
  border-radius: 20px;
  max-width: 75%;
  line-height: 1.5;
  word-break: break-word;
  font-size: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* Softer shadow */

  @media (max-width: ${mobileBreakpoint}) {
    max-width: 90%;
    font-size: 14px;
  }
`;

const PatientMessage = styled(MessageBase)`
  background-color: #eef2f7;
  color: #334155;
  align-self: flex-start;
  border-bottom-left-radius: 5px;
`;

const ProviderMessage = styled(MessageBase)`
  background-color: #0d9488;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 5px;
`;

const CoachMessage = styled(MessageBase)`
  background-color: #fffbeb;
  color: #b45309;
  align-self: center;
  border: 1px solid #fde68a;
  width: 90%;
  text-align: center;
  font-style: italic;

  @media (max-width: ${mobileBreakpoint}) {
    width: 95%;
    padding: 8px 12px;
    font-size: 13px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 15px 20px;
  border-top: 1px solid #dbe1e8;
  background-color: #f7f9fc;
  flex-shrink: 0;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 10px;
    flex-direction: column;
  }
`;

const InputBox = styled.input`
  flex-grow: 1;
  padding: 12px 15px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 25px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);
  }

  @media (max-width: ${mobileBreakpoint}) {
    width: 100%;
    margin-bottom: 10px;
  }
`;

const SendButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  background-color: #0d9488;
  color: white;
  cursor: pointer;
  border-radius: 25px;
  margin-left: 10px;
  transition: background-color 0.2s, transform 0.1s;

  &:hover:not(:disabled) {
    background-color: #0c7b6f;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #a7f3d0;
    cursor: not-allowed;
  }

  @media (max-width: ${mobileBreakpoint}) {
    width: 100%;
    margin-left: 0;
  }
`;

const CompactScoreSummary = styled.div`
  text-align: center;
  padding: 10px 20px;
  background-color: #f7f9fc;
  border-top: 1px solid #dbe1e8;
  font-size: 1.1em;
  font-weight: bold;
  color: #15304a;
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 8px 10px;
    font-size: 0.9em;
    gap: 10px;
  }
`;

const CompactScoreCategory = styled.span`
  font-size: 0.9em;
  color: #334155;
  white-space: nowrap;
`;

const FinalScoreContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 20px 10px;
  }
`;

const FinalScoreValue = styled.div`
  font-size: 52px;
  font-weight: bold;
  color: #0d9488;
  margin: 20px 0;

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 40px;
  }
`;

const OverallFeedbackBox = styled.div`
  background-color: #eef2f7;
  border: 1px solid #dbe1e8;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: left;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #334155;
  font-size: 0.95em;
  max-height: 250px; /* Limit height for scrollability */
  overflow-y: auto; /* Make the overall feedback box scrollable */
  width: 100%;
  box-sizing: border-box;
`;

const LoadingMessage = styled.p`
  font-style: italic;
  color: #64748b;
  text-align: center;
  padding: 20px;

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 14px;
    padding: 10px;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: #f7f9fc;
  border-top: 1px solid #eef2f7;
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: ${mobileBreakpoint}) {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
`;

const ControlButton = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid #9ca3af;
  background-color: #f9fafb;
  color: #374151;
  cursor: pointer;
  border-radius: 20px;
  transition: background-color 0.2s, transform 0.1s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: #eef2f7;
    border-color: #64748b;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${mobileBreakpoint}) {
    width: 100%;
    padding: 12px;
  }
`;

const Dropdown = styled.select`
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid #9ca3af;
  background-color: #f9fafb;
  color: #374151;
  border-radius: 20px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 30px;
  transition: border-color 0.2s;

  &:hover:not(:disabled) {
    border-color: #64748b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: ${mobileBreakpoint}) {
    width: 100%;
    padding: 12px;
  }
`;

const PhaseIndicator = styled.p`
  text-align: center;
  font-weight: bold;
  color: #0d9488;
  margin-bottom: 10px;
  font-size: 1.1em;
  padding: 0 20px; /* Add padding to prevent text from touching edges on small screens */
  flex-shrink: 0; /* Prevents shrinking on smaller screens */

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 0.9em;
    padding: 0 10px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 10px; /* Add some padding for very small screens */
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 16px;
  max-width: 600px;
  max-height: 90vh; /* Ensure modal content is scrollable */
  overflow-y: auto; /* Make modal content scrollable */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex; /* Use flex for internal layout of modal content */
  flex-direction: column; /* Stack content vertically */

  @media (max-width: ${mobileBreakpoint}) {
    width: 95%;
    padding: 20px;
    margin: 10px;
    border-radius: 8px;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: transparent;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #64748b;
  padding: 5px;
  &:hover {
    color: #334155;
  }
`;

const ModalTitle = styled.h2`
  color: #15304a;
  font-size: 24px;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
`;

const ModalText = styled.p`
  color: #334155;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 10px;
`;

const ModalTextBold = styled.span`
  font-weight: bold;
`;

const ModalList = styled.ul`
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 10px;
`;

const ModalListItem = styled.li`
  margin-bottom: 5px;
`;

const ScoreCardTitle = styled.h3`
  color: #15304a;
  text-align: left;
  font-size: 16px;
  margin: 0 0 8px 0;
  font-weight: 700;

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 14px;
    margin: 0 0 5px 0;
  }
`;

const ScoreCategoryRow = styled.p`
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  font-size: 14px;

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 12px;
  }
`;

const JustificationText = styled.span`
  font-size: 0.85em;
  color: #64748b;
  font-style: italic;
  margin-top: 2px;
  margin-left: 15px;
  flex-basis: 100%;
  display: block;
  white-space: pre-wrap;
`;

// New styled component for the progress bar
const ProgressBarContainer = styled.div`
  width: 100%;
  background-color: #e0e0e0;
  height: 8px;
`;

const ProgressBarFill = styled.div`
  background-color: #0d9488;
  height: 100%;
  transition: width 0.5s ease-in-out;
`;


// Client-side mirroring of phases for display purposes
const ENCOUNTER_PHASES_CLIENT = {
  0: { name: "Introduction & Initial Presentation", maxScore: 0, coachIntro: (patient) => `Welcome to SUSAN! You are about to meet ${patient.name}.`},
  1: { name: "Initiation & Building the Relationship", maxScore: 5 },
  2: { name: "Information Gathering & History Taking", maxScore: 5 },
  3: { name: "Physical Examination", maxScore: 5 },
  4: { name: "Assessment & Plan / Shared Decision-Making", maxScore: 5 },
  5: { name: "Closure", maxScore: 5 },
  6: { name: "Encounter Complete", maxScore: 0 },
};

// Rubric definitions for display (same as backend, for consistent labels)
const PHASE_RUBRIC_DEFINITIONS = {
  communication: { label: "Communication", desc: "Provider demonstrates clear, appropriate language, active listening, and effective questioning techniques. Messages are easy to understand for the patient.", max: 1 },
  trustRapport: { label: "Trust & Rapport", desc: "Provider establishes an empathetic and respectful connection with the patient, builds trust, and manages emotions effectively, fostering an open environment.", max: 1 },
  accuracy: { label: "Accuracy", desc: "Provider asks clinically relevant questions, gathers precise and complete information, and identifies key symptoms/history details crucial for diagnosis.", max: 1 },
  culturalHumility: { label: "Cultural Humility", desc: "Provider explores patient's ideas, beliefs, and cultural context respectfully, avoids assumptions, and acknowledges cultural factors influencing health/illness and decision-making.", max: 1 },
  sharedUnderstanding: { label: "Shared Understanding", desc: "Provider ensures patient comprehension of information and the management plan, actively involves the patient in decisions, and effectively uses techniques like teach-back.", max: 1 },
};


function SimulationPage() {
  const [messages, setMessages] = useState([]);
  const [conversationHistoryForAPI, setConversationHistoryForAPI] = useState([]);
  const [patientState, setPatientState] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showFullPatientInfo, setShowFullPatientInfo] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState(null);
  const [error, setError] = useState(null);

  const [encounterState, setEncounterState] = useState({
    currentPhase: 0,
    providerTurnCount: 0,
    phaseScores: {},
    currentCumulativeScore: 0,
    totalPossibleScore: 0,
  });

  const chatWindowRef = useRef(null);

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/susanSimulator";

  const resetSimulation = useCallback(() => {
    setIsLoading(false);
    setMessages([]);
    setConversationHistoryForAPI([]);
    setPatientState(null);
    setSelectedPatientIndex("");
    setShowFullPatientInfo(false);
    setShowScoringModal(false);
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
    setMessages([{ text: initialCoachMessage, from: "coach" }]);
    setConversationHistoryForAPI([]);
    setEncounterState(initialEncounterState);
  }, []);

  const handleNewPatientClick = useCallback(async () => {
    resetSimulation();
    setIsLoading(true);
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_patient" }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to generate patient: ${errorBody}`);
      }
      const data = await response.json();
      loadPatient(data.patient, data.initialCoachMessage, data.initialEncounterState);
      console.log("New patient data loaded:", data);
    } catch (error) {
      console.error("Error generating new patient:", error);
      setMessages([{ text: `Sorry, an error occurred while generating a new patient: ${error.message}`, from: "coach" }]);
      setError(`Failed to generate patient: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [resetSimulation, loadPatient, functionUrl, setError, setMessages]);

  const handlePredefinedPatientChange = useCallback((event) => {
    resetSimulation();
    const index = event.target.value;
    setSelectedPatientIndex(index);
    if (index !== "") {
      const patient = predefinedPatients[parseInt(index, 10)];
      const initialCoachMessage = ENCOUNTER_PHASES_CLIENT[0].coachIntro(patient);
      setPatientState(patient);
      setMessages([{ text: initialCoachMessage, from: "coach" }]);
      setConversationHistoryForAPI([]);
      setEncounterState({
        currentPhase: 1,
        providerTurnCount: 0,
        phaseScores: {},
        currentCumulativeScore: 0,
        totalPossibleScore: 0,
      });
    }
  }, [resetSimulation, setPatientState, setSelectedPatientIndex, setMessages, setConversationHistoryForAPI, setEncounterState]);


  const sendInteractionToServer = useCallback(async (actionType, input) => {
    if (!patientState || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interact_conversation",
          actionType: actionType,
          latestInput: input,
          patientState: patientState,
          conversationHistory: conversationHistoryForAPI,
          encounterState: encounterState,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log("Received data from server:", data);

      setPatientState(data.patientState || patientState);
      setEncounterState(data.encounterState);
      setOverallFeedback(data.overallFeedback);

      if (data.injectedProviderResponse) {
        setMessages((prev) => [...prev, { text: data.injectedProviderResponse, from: "provider" }]);
        setConversationHistoryForAPI((prev) => [...prev, { role: "provider", parts: [{ text: data.injectedProviderResponse }] }]);
      }

      const simulatorResponseText = data.from === "coach" ? `SUSAN: ${data.simulatorResponse.replace(/^COACH:\s*/, '')}` : data.simulatorResponse;
      setMessages((prev) => [...prev, { text: simulatorResponseText, from: data.from }]);
      setConversationHistoryForAPI((prev) => [...prev, { role: data.from, parts: [{ text: simulatorResponseText }] }]);

      if (data.nextCoachMessage && data.nextCoachMessage !== data.simulatorResponse) {
          const nextCoachMessageText = `SUSAN: ${data.nextCoachMessage.replace(/^COACH:\s*/, '')}`;
          setMessages((prev) => [...prev, { text: nextCoachMessageText, from: "coach" }]);
          setConversationHistoryForAPI((prev) => [...prev, { role: "coach", parts: [{ text: nextCoachMessageText }] }]);
      }

    } catch (err) {
      console.error("Failed to communicate with cloud function:", err);
      setError(`Failed to communicate with the AI backend: ${err.message}. Please try again.`);
      setMessages((prev) => [...prev, { text: `SUSAN: Sorry, an error occurred with the AI backend. Check console for details.`, from: "coach" }]);
      if (actionType === "regular_interaction") {
          setConversationHistoryForAPI((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [patientState, isLoading, conversationHistoryForAPI, encounterState, functionUrl, setError, setMessages, setConversationHistoryForAPI, setEncounterState, setOverallFeedback]);


  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || !patientState || isLoading || encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
      if (encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
        setMessages((prev) => [...prev, { text: "SUSAN: The encounter is complete. Please start a new patient.", from: "coach"}]);
      }
      setInputValue("");
      return;
    }

    const providerMessageText = inputValue;
    setMessages((prev) => [...prev, { text: providerMessageText, from: "provider" }]);
    setConversationHistoryForAPI((prev) => [...prev, { role: "provider", parts: [{ text: providerMessageText }] }]);
    setInputValue("");

    await sendInteractionToServer("regular_interaction", providerMessageText);
  };

  const handleCoachTipRequest = async () => {
    await sendInteractionToServer("get_coach_tip", "");
  };

  const handleInjectProviderResponse = async (type) => {
    await sendInteractionToServer("inject_provider_response", type);
  };

  const handleMoveToNextPhase = async () => {
    await sendInteractionToServer("move_to_next_phase", "");
  };


  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!patientState) {
      handleNewPatientClick();
    }
  }, [patientState, handleNewPatientClick]);


  const totalScore = encounterState.currentCumulativeScore;
  const maxPossibleScore = encounterState.totalPossibleScore;
  const isFinished = encounterState.currentPhase === Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1;


  const downloadTranscript = () => {
    const transcriptContent = messages.map((msg) => {
      const cleanText = msg.text.replace(/\*\*(.*?)\*\*/g, "$1");
      return `[${msg.from.toUpperCase()}] ${cleanText}`;
    }).join("\n\n");

    let scoreSummary = "\n\n--- ENCOUNTER SUMMARY ---\n";
    scoreSummary += `Total Score: ${totalScore} / ${maxPossibleScore}\n\n`;

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

    const blob = new Blob([transcriptContent + scoreSummary], {type: "text/plain;charset=utf-8"});
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10);
    const fileName = `SUSAN_Encounter_Transcript_${patientState?.name?.replace(/\s/g, "_") || "unknown_patient"}_${dateString}.txt`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <AppContainer>
      {showInstructions && (
        <ModalOverlay>
          <ModalContent>
            <ModalCloseButton onClick={() => setShowInstructions(false)}>X</ModalCloseButton>
            <ModalTitle>Welcome to SUSAN: Your Clinical Communication Simulator!</ModalTitle>
            <ModalText>
              SUSAN (Simulating Understanding and Support for Adaptive Narratives) is designed to help you practice and refine your patient communication and clinical reasoning skills, especially with patients who may have Limited English Proficiency (LEP) or diverse cultural backgrounds.
            </ModalText>
            <ModalTextBold as="h3">How to Use the Simulator:</ModalTextBold>
            <ModalList>
              <ModalListItem>
                <ModalTextBold>Start a Scenario:</ModalTextBold> Click "Generate Patient" to get a dynamically created patient profile, or select from the "Load Predefined Patient" dropdown. (A default patient is loaded automatically when you start the app.)
              </ModalListItem>
              <ModalListItem>
                <ModalTextBold>Engage in Conversation:</ModalTextBold> Read the SUSAN's introduction message in the chat window. Type your responses in the input box and press Enter or click "Send". Messages will be clearly labeled: <ModalTextBold>SUSAN</ModalTextBold> (guidance), <ModalTextBold>Provider</ModalTextBold> (your messages), and <ModalTextBold>Patient</ModalTextBold> (the standardized patient's responses).
              </ModalListItem>
              <ModalListItem>
                <ModalTextBold>Navigate Encounter Phases:</ModalTextBold> The clinical encounter is broken down into 5 phases, mirroring the Patient-Centered / Biopsychosocial Model:
                <ModalList>
                  {Object.values(ENCOUNTER_PHASES_CLIENT).slice(1, 6).map((phase) => (
                    <ModalListItem key={phase.name}>{phase.name}</ModalListItem>
                  ))}
                </ModalList>
                SUSAN will introduce each new phase and provide its goals.
              </ModalListItem>
              <ModalListItem>
                <ModalTextBold>Receive Feedback & Scoring:</ModalTextBold> After each meaningful interaction, the simulator will assess your performance. The <ModalTextBold>Rubric Scorecard</ModalTextBold> (at the bottom) will show points for: Communication, Trust & Rapport, Accuracy, Cultural Humility, and Shared Understanding. Each category is worth 1 point per phase. Justifications will explain the scoring. When a phase is completed (either automatically or manually), you'll receive a summary score for that phase.
              </ModalListItem>
              <ModalListItem>
                <ModalTextBold>Use Helper Buttons:</ModalTextBold>
                <ModalList>
                  <ModalListItem>
                    <ModalTextBold>SUSAN</ModalTextBold> Get a tip from SUSAN based on your actions so far, providing context and guidance for the current phase.
                  </ModalListItem>
                  <ModalListItem>
                    <ModalTextBold> Good Response / Poor Response:</ModalTextBold> These buttons will inject an AI-generated provider response into the chat, simulating an ideal or less-than-ideal action, and show its impact.
                  </ModalListItem>
                  <ModalListItem>
                    <ModalTextBold>Move to Next Phase:</ModalTextBold> If you feel you've completed the current phase, or are stuck, click this button to manually advance the scenario. A score for the completed phase will be provided.
                  </ModalListItem>
                  <ModalListItem>
                    <ModalTextBold>Download Transcript:</ModalTextBold> At the end of the encounter, download the full conversation history and score summary.
                  </ModalListItem>
                </ModalList>
              </ModalListItem>
              <ModalListItem>
                <ModalTextBold>Complete the Encounter:</ModalTextBold> The encounter ends after the Closure phase. Your final total score and overall feedback will be displayed.
              </ModalListItem>
            </ModalList>
            {/* Using standard style prop for simple, non-media-query-dependent styling */}
            <ModalText style={{ textAlign: "center", marginTop: "20px"}}>
              <ModalTextBold>Remember:</ModalTextBold> Focus on clear communication, active listening, and integrating the patient's unique background into your approach. Good luck!
            </ModalText>
          </ModalContent>
        </ModalOverlay>
      )}

      {showFullPatientInfo && patientState && (
        <ModalOverlay>
          <ModalContent>
            <ModalCloseButton onClick={() => setShowFullPatientInfo(false)}>X</ModalCloseButton>
            <ModalTitle>Full Patient Information Cheatsheet</ModalTitle>
            <ModalText>This information is available to guide your interaction. Not all details may be immediately apparent in the conversation.</ModalText>
            <ModalText><ModalTextBold>Name:</ModalTextBold> {patientState.name}</ModalText>
            <ModalText><ModalTextBold>Age:</ModalTextBold> {patientState.age}</ModalText>
            <ModalText><ModalTextBold>Gender:</ModalTextBold> {patientState.genderIdentity} ({patientState.pronouns})</ModalText>
            <ModalText><ModalTextBold>Main Complaint:</ModalTextBold> {patientState.mainComplaint}</ModalText>
            {patientState.secondaryComplaint && <ModalText><ModalTextBold>Secondary Complaint:</ModalTextBold> {patientState.secondaryComplaint}</ModalText>}
            <ModalText><ModalTextBold>Native Language:</ModalTextBold> {patientState.nativeLanguage}</ModalText>
            <ModalText><ModalTextBold>English Proficiency:</ModalTextBold> {patientState.englishProficiency}</ModalText>
            <ModalText><ModalTextBold>Cultural Background:</ModalTextBold> {patientState.culturalBackground}</ModalText>
            <ModalText><ModalTextBold>Patient Persona:</ModalTextBold> {patientState.patientPersona}</ModalText>
            <ModalText><ModalTextBold>Ideas about Illness:</ModalTextBold> {patientState.illnessPerception_Ideas}</ModalText>
            <ModalText><ModalTextBold>Concerns:</ModalTextBold> {patientState.illnessPerception_Concerns}</ModalText>
            <ModalText><ModalTextBold>Expectations:</ModalTextBold> {patientState.illnessPerception_Expectations}</ModalText>
            <ModalText><ModalTextBold>Relevant Past Medical History:</ModalTextBold> {patientState.relevantPastMedicalHistory}</ModalText>
            <ModalText><ModalTextBold>Relevant Medications & Allergies:</ModalTextBold> {patientState.relevantMedicationsAndAllergies}</ModalText>
            <ModalText><ModalTextBold>Relevant Family History:</ModalTextBold> {patientState.relevantFamilyHistory}</ModalText>
            <ModalText><ModalTextBold>Relevant Social History:</ModalTextBold> {patientState.relevantSocialHistory}</ModalText>
            <ModalText><ModalTextBold>Physical Exam Findings:</ModalTextBold> {patientState.physicalExamFindings}</ModalText>
            <ModalText><ModalTextBold>Correct Diagnosis:</ModalTextBold> {patientState.correctDiagnosis}</ModalText>
            <ModalText><ModalTextBold>Management Plan Outline:</ModalTextBold> {patientState.managementPlanOutline}</ModalText>
            {patientState.redFlags_worseningConditions && <ModalText><ModalTextBold>Red Flags/Worsening Conditions:</ModalTextBold> {patientState.redFlags_worseningConditions}</ModalText>}
            <ModalText><ModalTextBold>Family Involvement Preference:</ModalTextBold> {patientState.familyInvolvementPreference}</ModalText>
          </ModalContent>
        </ModalOverlay>
      )}

      {showScoringModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalCloseButton onClick={() => setShowScoringModal(false)}>X</ModalCloseButton>
            <ModalTitle>Rubric & Phase Scores</ModalTitle>
            <ScoreCardTitle>Rubric Definitions:</ScoreCardTitle>
            {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => (
              <ScoreCategoryRow style={{ flexDirection: "column"}} key={`rubric-def-modal-${key}`}>
                <span style={{ display: "flex", justifyContent: "space-between", width: "100%"}}>
                  <ModalTextBold>{def.label}:</ModalTextBold>
                </span>
                <JustificationText>{def.desc}</JustificationText>
              </ScoreCategoryRow>
            ))}
            {Object.values(encounterState.phaseScores).some((score) => score !== null) && (
              <>
                <hr style={{ borderTop: "1px solid #eee", margin: "15px 0"}} />
                <ScoreCardTitle>Phase Scores:</ScoreCardTitle>
              </>
            )}
            {Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).map((phaseKey) => {
              const phaseName = ENCOUNTER_PHASES_CLIENT[phaseKey].name;
              const phaseMaxScore = ENCOUNTER_PHASES_CLIENT[phaseKey].maxScore;
              const phaseCategoryScores = encounterState.phaseScores[phaseName];

              return (
                <React.Fragment key={phaseName}>
                  {phaseCategoryScores && (
                    <>
                      <ScoreCategoryRow style={{ fontWeight: "bold", marginTop: "10px"}}>
                        <span>{phaseName}:</span>
                        <span>{Object.values(phaseCategoryScores).reduce((sum, score) => sum + (score?.points || 0), 0)} / {phaseMaxScore}</span>
                      </ScoreCategoryRow>
                      {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([categoryKey, categoryDef]) => {
                        const scoreDetails = phaseCategoryScores[categoryKey];
                        return (
                          <ScoreCategoryRow style={{ flexDirection: "column"}} key={`${phaseName}-${categoryKey}`}>
                            <span style={{ display: "flex", justifyContent: "space-between", width: "100%"}}>
                              <span style={{ textTransform: "capitalize"}}>{categoryDef.label}:</span>
                              <strong>{scoreDetails?.points !== undefined ? `${scoreDetails.points}/${categoryDef.max}` : "Pending"}</strong>
                            </span>
                            {scoreDetails?.justification && (
                              <JustificationText>Justification: {scoreDetails.justification}</JustificationText>
                            )}
                          </ScoreCategoryRow>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
            <ScoreCategoryRow style={{ fontWeight: "bold", borderTop: "1px solid #dbe1e8", paddingTop: "10px", marginTop: "10px"}}>
              <span>TOTAL SCORE:</span>
              <span>{totalScore} / {maxPossibleScore}</span>
            </ScoreCategoryRow>
          </ModalContent>
        </ModalOverlay>
      )}


      {patientState && (
        <DynamicPatientHeader>
          Patient: {patientState.name}, {patientState.age} ({patientState.genderIdentity}, {patientState.pronouns}) | Language: {patientState.nativeLanguage} ({patientState.englishProficiency} English Proficiency) | Main Complaint: {patientState.mainComplaint}
        </DynamicPatientHeader>
      )}

      {patientState && encounterState.currentPhase >= 1 && !isFinished && (
        <ProgressBarContainer>
          <ProgressBarFill style={{
            width: `${((encounterState.currentPhase - 1) / (Object.keys(ENCOUNTER_PHASES_CLIENT).length - 2)) * 100}%`,
          }} />
        </ProgressBarContainer>
      )}

      <MainContentWrapper>
        <ChatAndInputContainer>
          {patientState && encounterState.currentPhase > 0 && !isFinished && (
            <PhaseIndicator>
              Current Phase: {ENCOUNTER_PHASES_CLIENT[encounterState.currentPhase]?.name || 'Unknown Phase'}
            </PhaseIndicator>
          )}

          <ChatWindow ref={chatWindowRef}>
            {messages.map((msg, index) => {
              if (msg.from === "patient") {
                return <PatientMessage key={index}><p style={{margin: 0, whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: msg.text}}></p></PatientMessage>;
              } else if (msg.from === "coach") {
                return <CoachMessage key={index}><p style={{margin: 0, whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: msg.text}}></p></CoachMessage>;
              } else {
                return <ProviderMessage key={index}><p style={{margin: 0, whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: msg.text}}></p></ProviderMessage>;
              }
            })}
            {isLoading && <LoadingMessage>SUSAN is thinking...</LoadingMessage>}
            {!patientState && !isLoading && (
              <LoadingMessage>
                Click "Generate Patient" to begin, or select a patient from the list below.
              </LoadingMessage>
            )}
            {error && <LoadingMessage style={{ color: '#dc2626'}}>{error}</LoadingMessage>}
          </ChatWindow>

          {!isFinished ? (
            <InputContainer>
              <InputBox type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Type your response..." disabled={isLoading || !patientState} />
              <SendButton onClick={handleSendMessage} disabled={isLoading || !patientState}>Send</SendButton>
            </InputContainer>
          ) : (
              <FinalScoreContainer>
                <h2>Encounter Complete!</h2>
                <p>Your Final Score:</p>
                <FinalScoreValue>{totalScore} / {maxPossibleScore}</FinalScoreValue>
                {overallFeedback && (
                    <OverallFeedbackBox>
                        <h3>Overall Feedback:</h3>
                        <p dangerouslySetInnerHTML={{__html: overallFeedback}}></p>
                    </OverallFeedbackBox>
                )}
                {totalScore > 0 && (
                    <ControlButton style={{ marginTop: "20px"}} onClick={downloadTranscript}>Download Transcript</ControlButton>
                )}
              </FinalScoreContainer>
          )}
        </ChatAndInputContainer>
      </MainContentWrapper>

      <ControlsContainer>
        <ControlButton onClick={handleNewPatientClick} disabled={isLoading}>Generate Patient</ControlButton>
        <Dropdown
          onChange={handlePredefinedPatientChange}
          value={selectedPatientIndex}
          disabled={isLoading}
        >
          <option value="">Load Predefined Patient</option>
          {predefinedPatients.map((patient, index) => (
            <option key={index} value={index}>
              {patient.name} ({patient.mainComplaint.substring(0, Math.min(patient.mainComplaint.length, 30))}...)
            </option>
          ))}
        </Dropdown>
        <ControlButton onClick={() => setShowInstructions(true)} disabled={isLoading}>Instructions</ControlButton>
        <ControlButton onClick={() => setShowFullPatientInfo(true)} disabled={isLoading || !patientState}>Patient Info</ControlButton>
        <ControlButton onClick={handleCoachTipRequest} disabled={isLoading || !patientState || isFinished}>SUSAN</ControlButton>
        <ControlButton onClick={() => handleInjectProviderResponse("good")} disabled={isLoading || !patientState || isFinished}>Good Response</ControlButton>
        <ControlButton onClick={() => handleInjectProviderResponse("poor")} disabled={isLoading || !patientState || isFinished}>Poor Response</ControlButton>
        <ControlButton
          onClick={handleMoveToNextPhase}
          disabled={isLoading || !patientState || isFinished}
        >
          Next Phase
        </ControlButton>
      </ControlsContainer>

      {patientState && (
        <CompactScoreSummary>
          <span>Total Score: {totalScore} / {maxPossibleScore}</span>
          {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => {
            const categoryMaxTotal = Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).length * def.max;
            const categoryAchievedTotal = Object.values(encounterState.phaseScores).reduce((sum, phaseScoreObj) => {
              return sum + (phaseScoreObj ? (phaseScoreObj[key]?.points || 0) : 0);
            }, 0);
            return (
              <CompactScoreCategory key={key}>
                {def.label}: {categoryAchievedTotal}/{categoryMaxTotal}
              </CompactScoreCategory>
            );
          })}
          <ControlButton style={{ marginLeft: "15px"}} onClick={() => setShowScoringModal(true)} disabled={isLoading}>View Full Scoring</ControlButton>
        </CompactScoreSummary>
      )}
    </AppContainer>
  );
}
export default SimulationPage;