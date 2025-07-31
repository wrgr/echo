import React, { useState, useEffect, useRef, useCallback } from "react";
import predefinedPatients from "./predefinedPatients.json";

// Client-side mirroring of phases for display purposes (maxScore is still used here)
const ENCOUNTER_PHASES_CLIENT = {
  0: { name: "Introduction & Initial Presentation", maxScore: 0, coachIntro: (patient) => `Welcome to ECHO! You're about to meet **${patient.name}**, a **${patient.age}**-year-old. Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter adhering to the Patient-Centered / Biopsychosocial model. Let's begin with **Phase 1: Initiation and Building the Relationship**. What is your first step?"` },
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
  // --- State Declarations ---
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

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/echoSimulator";

  // --- API Interaction Functions ---

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
        currentPhase: 0,
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

      setMessages((prev) => [...prev, { text: data.simulatorResponse, from: data.from }]);
      setConversationHistoryForAPI((prev) => [...prev, { role: data.from, parts: [{ text: data.simulatorResponse }] }]);

      if (data.nextCoachMessage && data.nextCoachMessage !== data.simulatorResponse) {
          setMessages((prev) => [...prev, { text: data.nextCoachMessage, from: "coach" }]);
          setConversationHistoryForAPI((prev) => [...prev, { role: "coach", parts: [{ text: data.nextCoachMessage }] }]);
      }

    } catch (err) {
      console.error("Failed to communicate with cloud function:", err);
      setError(`Failed to communicate with the AI backend: ${err.message}. Please try again.`);
      setMessages((prev) => [...prev, { text: `Sorry, an error occurred with the AI backend. Check console for details.`, from: "coach" }]);
      if (actionType === "regular_interaction") {
          setConversationHistoryForAPI((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [patientState, isLoading, conversationHistoryForAPI, encounterState, functionUrl, setError, setMessages, setConversationHistoryForAPI, setEncounterState, setOverallFeedback]);

  // --- Event Handlers ---

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || !patientState || isLoading || encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
      if (encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
        setMessages((prev) => [...prev, { text: "The encounter is complete. Please start a new patient.", from: "coach"}]);
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
    if (encounterState.currentPhase === 0) {
        setEncounterState(prev => ({ ...prev, currentPhase: 1 }));
        setMessages((prev) => [...prev, {text: `COACH: You've started Phase 1: ${ENCOUNTER_PHASES_CLIENT[1].name}. ${ENCOUNTER_PHASES_CLIENT[1].coachPrompt || ''}`, from: "coach"}]);
        return;
    }
    await sendInteractionToServer("move_to_next_phase", "");
  };

  // --- Effects ---

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

  // --- Calculated Values ---
  const totalScore = encounterState.currentCumulativeScore;
  const maxPossibleScore = encounterState.totalPossibleScore;
  const isFinished = encounterState.currentPhase === Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1;

  // Function to download transcript
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
    const fileName = `ECHO_Encounter_Transcript_${patientState?.name?.replace(/\s/g, "_") || "unknown_patient"}_${dateString}.txt`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="simulation-container">
      {showInstructions && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowInstructions(false)}>×</button>
            <h2 className="modal-title">Welcome to ECHO: Your Clinical Communication Simulator!</h2>
            <p className="modal-text">
              ECHO (Empowering Conversations for better Healthcare Outcomes) is designed to help you practice and refine your patient communication and clinical reasoning skills, especially with patients who may have Limited English Proficiency (LEP) or diverse cultural backgrounds.
            </p>
            <h3 className="modal-text-bold">How to Use the Simulator:</h3>
            <ul className="modal-list">
              <li className="modal-list-item">
                <span className="modal-text-bold">Start a Scenario:</span> Click "Generate New Patient" to get a dynamically created patient profile, or select from the "Load Predefined Patient" dropdown. (A default patient is loaded automatically when you start the app.)
              </li>
              <li className="modal-list-item">
                <span className="modal-text-bold">Engage in Conversation:</span> Read the coach's introduction message in the chat window. Type your responses in the input box and press Enter or click "Send". Messages will be clearly labeled: <span className="modal-text-bold">Coach</span> (guidance), <span className="modal-text-bold">Provider</span> (your messages), and <span className="modal-text-bold">Patient</span> (the standardized patient's responses).
              </li>
              <li className="modal-list-item">
                <span className="modal-text-bold">Navigate Encounter Phases:</span> The clinical encounter is broken down into 5 phases, mirroring the Patient-Centered / Biopsychosocial Model:
                <ul className="modal-list">
                  {Object.values(ENCOUNTER_PHASES_CLIENT).slice(1, 6).map((phase) => (
                    <li key={phase.name} className="modal-list-item">{phase.name}</li>
                  ))}
                </ul>
                The coach will introduce each new phase and provide its goals.
              </li>
              <li className="modal-list-item">
                <span className="modal-text-bold">Receive Feedback & Scoring:</span> After each meaningful interaction, the simulator will assess your performance. The <span className="modal-text-bold">Rubric Scorecard</span> (at the bottom) will show points for: Communication, Trust & Rapport, Accuracy, Cultural Humility, and Shared Understanding. Each category is worth 1 point per phase. Justifications will explain the scoring. When a phase is completed (either automatically or manually), you'll receive a summary score for that phase.
              </li>
              <li className="modal-list-item">
                <span className="modal-text-bold">Use Helper Buttons:</span>
                <ul className="modal-list">
                  <li className="modal-list-item">
                    <span className="modal-text-bold">Coach Tip:</span> Get a coach's tip based on your actions so far, providing context and guidance for the current phase.
                  </li>
                  <li className="modal-list-item">
                    <span className="modal-text-bold">Inject Good Response / Inject Poor Response:</span> These buttons will inject an AI-generated provider response into the chat, simulating an ideal or less-than-ideal action, and show its impact.
                  </li>
                  <li className="modal-list-item">
                    <span className="modal-text-bold">Move to Next Phase:</span> If you feel you've completed the current phase, or are stuck, click this button to manually advance the scenario. A score for the completed phase will be provided.
                  </li>
                  <li className="modal-list-item">
                    <span className="modal-text-bold">Download Transcript:</span> At the end of the encounter, download the full conversation history and score summary.
                  </li>
                </ul>
              </li>
              <li className="modal-list-item">
                <span className="modal-text-bold">Complete the Encounter:</span> The encounter ends after the Closure phase. Your final total score and overall feedback will be displayed.
              </li>
            </ul>
            <p className="modal-text-center">
              <span className="modal-text-bold">Remember:</span> Focus on clear communication, active listening, and integrating the patient's unique background into your approach. Good luck!
            </p>
          </div>
        </div>
      )}

      {showFullPatientInfo && patientState && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowFullPatientInfo(false)}>×</button>
            <h2 className="modal-title">Full Patient Information Cheatsheet</h2>
            <p className="modal-text">This information is available to guide your interaction. Not all details may be immediately apparent in the conversation.</p>
            <div className="patient-info-details">
              <p className="patient-info-detail"><span className="patient-info-label">Name:</span> {patientState.name}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Age:</span> {patientState.age}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Gender:</span> {patientState.genderIdentity} ({patientState.pronouns})</p>
              <p className="patient-info-detail"><span className="patient-info-label">Main Complaint:</span> {patientState.mainComplaint}</p>
              {patientState.secondaryComplaint && <p className="patient-info-detail"><span className="patient-info-label">Secondary Complaint:</span> {patientState.secondaryComplaint}</p>}
              <p className="patient-info-detail"><span className="patient-info-label">Native Language:</span> {patientState.nativeLanguage}</p>
              <p className="patient-info-detail"><span className="patient-info-label">English Proficiency:</span> {patientState.englishProficiency}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Cultural Background:</span> {patientState.culturalBackground}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Patient Persona:</span> {patientState.patientPersona}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Ideas about Illness:</span> {patientState.illnessPerception_Ideas}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Concerns:</span> {patientState.illnessPerception_Concerns}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Expectations:</span> {patientState.illnessPerception_Expectations}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Past Medical History:</span> {patientState.relevantPastMedicalHistory}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Medications & Allergies:</span> {patientState.relevantMedicationsAndAllergies}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Family History:</span> {patientState.relevantFamilyHistory}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Social History:</span> {patientState.relevantSocialHistory}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Physical Exam Findings:</span> {patientState.physicalExamFindings}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Correct Diagnosis:</span> {patientState.correctDiagnosis}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Management Plan Outline:</span> {patientState.managementPlanOutline}</p>
              {patientState.redFlags_worseningConditions && <p className="patient-info-detail"><span className="patient-info-label">Red Flags/Worsening Conditions:</span> {patientState.redFlags_worseningConditions}</p>}
              <p className="patient-info-detail"><span className="patient-info-label">Family Involvement Preference:</span> {patientState.familyInvolvementPreference}</p>
            </div>
          </div>
        )}
      </div>

      <div className="controls-container">
        <button className="control-button" onClick={handleNewPatientClick} disabled={isLoading}>Generate New Patient</button>
        <select
          className="dropdown"
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
        </select>
        <button className="control-button" onClick={() => setShowInstructions(true)} disabled={isLoading}>Instructions</button>
        <button className="control-button" onClick={() => setShowFullPatientInfo(true)} disabled={isLoading || !patientState}>Full Patient Info</button>
        <button className="control-button" onClick={handleCoachTipRequest} disabled={isLoading || !patientState || isFinished}>Coach Tip</button>
        <button className="control-button" onClick={() => handleInjectProviderResponse("good")} disabled={isLoading || !patientState || isFinished}>Inject Good Response</button>
        <button className="control-button" onClick={() => handleInjectProviderResponse("poor")} disabled={isLoading || !patientState || isFinished}>Inject Poor Response</button>
        <button
          className="control-button"
          onClick={handleMoveToNextPhase}
          disabled={isLoading || !patientState || isFinished}
        >
          Move to Next Phase
        </button>
      </div>

      {patientState && (
        <div className="compact-score-summary">
          <span>Total Score: {totalScore} / {maxPossibleScore}</span>
          {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => {
            const categoryMaxTotal = Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).length * def.max;
            const categoryAchievedTotal = Object.values(encounterState.phaseScores).reduce((sum, phaseScoreObj) => {
              return sum + (phaseScoreObj ? (phaseScoreObj[key]?.points || 0) : 0);
            }, 0);
            return (
              <span key={key} className="compact-score-category">
                {def.label}: {categoryAchievedTotal}/{categoryMaxTotal}
              </span>
            );
          })}
          <button className="control-button scoring-button" onClick={() => setShowScoringModal(true)} disabled={isLoading}>View Full Scoring</button>
        </div>
      )}
    </div>
  );
}

export default SimulationPage;State.physicalExamFindings}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Correct Diagnosis:</span> {patientState.correctDiagnosis}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Management Plan Outline:</span> {patientState.managementPlanOutline}</p>
              {patientState.redFlags_worseningConditions && <p className="patient-info-detail"><span className="patient-info-label">Red Flags/Worsening Conditions:</span> {patientState.redFlags_worseningConditions}</p>}
              <p className="patient-info-detail"><span className="patient-info-label">Family Involvement Preference:</span> {patientState.familyInvolvementPreference}</p>
            </div>
          </div>
        </div>
      )}

      {showScoringModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowScoringModal(false)}>×</button>
            <h2 className="modal-title">Rubric & Phase Scores</h2>
            <h3 className="score-card-title">Rubric Definitions:</h3>
            {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => (
              <div className="score-category-row-modal" key={`rubric-def-modal-${key}`}>
                <div className="score-category-header">
                  <span className="modal-text-bold">{def.label}:</span>
                </div>
                <span className="justification-text">{def.desc}</span>
              </div>
            ))}
            {Object.values(encounterState.phaseScores).some((score) => score !== null) && (
              <>
                <hr className="modal-divider" />
                <h3 className="score-card-title">Phase Scores:</h3>
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
                      <div className="score-category-row phase-header">
                        <span>{phaseName}:</span>
                        <span>{Object.values(phaseCategoryScores).reduce((sum, score) => sum + (score?.points || 0), 0)} / {phaseMaxScore}</span>
                      </div>
                      {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([categoryKey, categoryDef]) => {
                        const scoreDetails = phaseCategoryScores[categoryKey];
                        return (
                          <div className="score-category-row-modal" key={`${phaseName}-${categoryKey}`}>
                            <div className="score-category-header">
                              <span className="score-category-name">{categoryDef.label}:</span>
                              <strong>{scoreDetails?.points !== undefined ? `${scoreDetails.points}/${categoryDef.max}` : "Pending"}</strong>
                            </div>
                            {scoreDetails?.justification && (
                              <span className="justification-text">Justification: {scoreDetails.justification}</span>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
            <div className="score-category-row total-score">
              <span>TOTAL SCORE:</span>
              <span>{totalScore} / {maxPossibleScore}</span>
            </div>
          </div>
        </div>
      )}

      <div className="main-content-wrapper">
        <div className="chat-and-input-container">
          {patientState && encounterState.currentPhase > 0 && !isFinished && (
            <p className="phase-indicator">
              Current Phase: {ENCOUNTER_PHASES_CLIENT[encounterState.currentPhase]?.name || 'Unknown Phase'}
            </p>
          )}

          <div className="chat-window" ref={chatWindowRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.from}-message`}>
                <p dangerouslySetInnerHTML={{__html: msg.text}}></p>
              </div>
            ))}
            {isLoading && <p className="loading-message">ECHO is thinking...</p>}
            {!patientState && !isLoading && (
              <p className="loading-message">
                Click "Generate New Patient" to begin, or select a patient from the list below.
              </p>
            )}
            {error && <p className="error-message">{error}</p>}
          </div>

          {!isFinished ? (
            <div className="input-container">
              <input 
                type="text" 
                className="input-box" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} 
                placeholder="Type your response..." 
                disabled={isLoading || !patientState} 
              />
              <button 
                className="send-button" 
                onClick={handleSendMessage} 
                disabled={isLoading || !patientState}
              >
                Send
              </button>
            </div>
          ) : (
            <div className="final-score-container">
              <h2>Encounter Complete!</h2>
              <p>Your Final Score:</p>
              <div className="final-score-value">{totalScore} / {maxPossibleScore}</div>
              {overallFeedback && (
                <div className="overall-feedback-box">
                  <h3>Overall Feedback:</h3>
                  <p dangerouslySetInnerHTML={{__html: overallFeedback}}></p>
                </div>
              )}
              {totalScore > 0 && (
                <button className="control-button download-button" onClick={downloadTranscript}>Download Transcript</button>
              )}
            </div>
          )}
        </div>

        {patientState && (
          <div className="patient-info-panel">
            <h3 className="patient-info-title">Patient Information</h3>
            <div className="patient-info-details">
              <p className="patient-info-detail"><span className="patient-info-label">Name:</span> {patientState.name}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Age:</span> {patientState.age}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Gender:</span> {patientState.genderIdentity} ({patientState.pronouns})</p>
              <p className="patient-info-detail"><span className="patient-info-label">Main Complaint:</span> {patientState.mainComplaint}</p>
              {patientState.secondaryComplaint && <p className="patient-info-detail"><span className="patient-info-label">Secondary Complaint:</span> {patientState.secondaryComplaint}</p>}
              <p className="patient-info-detail"><span className="patient-info-label">Native Language:</span> {patientState.nativeLanguage}</p>
              <p className="patient-info-detail"><span className="patient-info-label">English Proficiency:</span> {patientState.englishProficiency}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Cultural Background:</span> {patientState.culturalBackground}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Patient Persona:</span> {patientState.patientPersona}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Ideas about Illness:</span> {patientState.illnessPerception_Ideas}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Concerns:</span> {patientState.illnessPerception_Concerns}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Expectations:</span> {patientState.illnessPerception_Expectations}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Past Medical History:</span> {patientState.relevantPastMedicalHistory}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Medications & Allergies:</span> {patientState.relevantMedicationsAndAllergies}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Family History:</span> {patientState.relevantFamilyHistory}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Relevant Social History:</span> {patientState.relevantSocialHistory}</p>
              <p className="patient-info-detail"><span className="patient-info-label">Physical Exam Findings:</span> {patient