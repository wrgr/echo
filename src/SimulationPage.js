import React, { useState, useEffect, useRef, useCallback } from "react";
import predefinedPatients from "./patients/predefinedPatients.json";
import { useUserPatients } from './hooks/useUserPatients';
import './index.css';
import { ENCOUNTER_PHASES_CLIENT, PHASE_RUBRIC_DEFINITIONS } from './utils/constants';

/**
 * ECHO Simulation Page - Modern Card-Based Design
 * 
 * This component provides the main clinical simulation interface where healthcare providers
 * can practice patient interactions. Features include:
 * - Real-time chat with AI-powered patient simulation
 * - Phase-based clinical encounter progression
 * - Real-time scoring and feedback
 * - Modern card-based UI with clean visual hierarchy
 * - Coach assistance and teaching moments
 * - Patient information display in an elegant card format
 */


// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SimulationPage() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  /**
   * Core conversation state
   * - messages: Array of chat messages for UI display
   * - conversationHistoryForAPI: Formatted conversation history for backend API
   * - patientState: Complete patient profile object
   * - inputValue: Current user input in the chat box
   */
  const [messages, setMessages] = useState([]);
  const [conversationHistoryForAPI, setConversationHistoryForAPI] = useState([]);
  const [patientState, setPatientState] = useState(null);
  const [inputValue, setInputValue] = useState("");
  
  /**
   * UI state management
   * - isLoading: Shows loading indicators during API calls
   * - selectedPatientIndex: Currently selected patient from dropdown
   * - error: Error message to display to user
   * - showCoachPanel: Toggle for coach assistance panel
   */
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState("");
  const [error, setError] = useState(null);
  const [showCoachPanel, setShowCoachPanel] = useState(false);
  
  /**
   * Modal state for different overlays
   * - showFullPatientInfo: Full patient details modal
   * - showScoringModal: Detailed scoring breakdown modal
   */
  const [showFullPatientInfo, setShowFullPatientInfo] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  
  /**
   * Clinical encounter state
   * - currentPhase: Which phase of the encounter we're in (0-6)
   * - providerTurnCount: Number of provider messages sent
   * - phaseScores: Object containing scores for each completed phase
   * - currentCumulativeScore: Running total score
   * - totalPossibleScore: Maximum possible score so far
   */
  const [encounterState, setEncounterState] = useState({
    currentPhase: 0,
    providerTurnCount: 0,
    phaseScores: {},
    currentCumulativeScore: 0,
    totalPossibleScore: 0,
  });
  
  /**
   * Final encounter feedback when simulation is complete
   */
  const [overallFeedback, setOverallFeedback] = useState(null);

  // ========================================================================
  // HOOKS AND REFS
  // ========================================================================
  
  /**
   * Custom hook for managing user-generated patients stored locally
   */
  const { userPatients, refreshUserPatients } = useUserPatients();
  
  /**
   * Reference to chat window for auto-scrolling to latest message
   */
  const chatWindowRef = useRef(null);
  
  /**
   * Firebase Cloud Function endpoint for all backend interactions
   */
  const functionUrl = "https://us-central1-echo-d825e.cloudfunctions.net/echoSimulator";

  // ========================================================================
  // CORE FUNCTIONALITY - SIMULATION MANAGEMENT
  // ========================================================================

  /**
   * Reset all simulation state to initial values
   * Called when starting a new patient or resetting the simulation
   */
  const resetSimulation = useCallback(() => {
    setIsLoading(false);
    setMessages([]);
    setConversationHistoryForAPI([]);
    setPatientState(null);
    setSelectedPatientIndex("");
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

  /**
   * Load a patient profile and initialize the simulation
   * @param {Object} patientProfile - Complete patient data object
   * @param {string} initialCoachMessage - Welcome message from coach
   * @param {Object} initialEncounterState - Starting encounter state
   */
  const loadPatient = useCallback((patientProfile, initialCoachMessage, initialEncounterState) => {
    setPatientState(patientProfile);
    setMessages([{ text: initialCoachMessage, from: "coach" }]);
    setConversationHistoryForAPI([]);
    setEncounterState(initialEncounterState);
  }, []);

  /**
   * Handle patient selection from dropdown menu
   * Supports both predefined patients and user-generated patients
   */
  const handlePredefinedPatientChange = useCallback((event) => {
    resetSimulation();
    const value = event.target.value;
    setSelectedPatientIndex(value);
    
    if (value !== "") {
      let patient;
      let isUserGenerated = false;
      
      // Determine if this is a user-generated patient (prefixed with "user-")
      if (value.startsWith("user-")) {
        const userId = parseInt(value.replace("user-", ""), 10);
        patient = userPatients.find(p => p.id === userId);
        isUserGenerated = true;
      } else {
        // It's a predefined patient
        const index = parseInt(value, 10);
        patient = predefinedPatients[index];
      }
      
      if (patient) {
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
        
        if (isUserGenerated) {
          console.log("Loaded user-generated patient:", patient.name);
        }
      }
    }
  }, [resetSimulation, userPatients]);

  // ========================================================================
  // API COMMUNICATION
  // ========================================================================

  /**
   * Generic function to communicate with the Firebase Cloud Function
   * Handles all types of interactions: messages, coach tips, injections, etc.
   * 
   * @param {string} actionType - The specific action to perform
   * @param {string} input - The input data (message, tip request, etc.)
   */
  const sendInteractionToServer = useCallback(async (actionType, input) => {
    // Prevent multiple simultaneous requests
    if (!patientState || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interact_conversation", // Main action for Firebase Function
          actionType: actionType, // Specific sub-action
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

      // Update patient state if server sends changes
      setPatientState(data.patientState || patientState);
      
      // Update encounter state (phase, scores, etc.)
      setEncounterState(data.encounterState);
      
      // Store final feedback if encounter is complete
      setOverallFeedback(data.overallFeedback);

      // Handle injected provider responses (for good/poor response demonstrations)
      if (data.injectedProviderResponse) {
        setMessages((prev) => [...prev, { text: data.injectedProviderResponse, from: "provider" }]);
        setConversationHistoryForAPI((prev) => [...prev, { role: "provider", parts: [{ text: data.injectedProviderResponse }] }]);
      }

      // Add the main response (patient or coach message)
      setMessages((prev) => [...prev, { text: data.simulatorResponse, from: data.from }]);
      setConversationHistoryForAPI((prev) => [...prev, { role: data.from, parts: [{ text: data.simulatorResponse }] }]);

      // Handle additional coach messages (e.g., phase transitions)
      if (data.nextCoachMessage && data.nextCoachMessage !== data.simulatorResponse) {
        setMessages((prev) => [...prev, { text: data.nextCoachMessage, from: "coach" }]);
        setConversationHistoryForAPI((prev) => [...prev, { role: "coach", parts: [{ text: data.nextCoachMessage }] }]);
      }

    } catch (err) {
      console.error("Failed to communicate with cloud function:", err);
      setError(`Failed to communicate with the AI backend: ${err.message}. Please try again.`);
      setMessages((prev) => [...prev, { text: `Sorry, an error occurred with the AI backend. Check console for details.`, from: "coach" }]);
      
      // Revert the last provider message from history if this was a regular interaction
      if (actionType === "regular_interaction") {
        setConversationHistoryForAPI((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [patientState, isLoading, conversationHistoryForAPI, encounterState, functionUrl]);

  // ========================================================================
  // USER INTERACTION HANDLERS
  // ========================================================================

  /**
   * Handle sending a provider message
   * Validates input, adds to conversation, and sends to backend
   */
  const handleSendMessage = async () => {
    // Validation checks
    if (inputValue.trim() === "" || !patientState || isLoading || encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
      if (encounterState.currentPhase >= Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1) {
        setMessages((prev) => [...prev, { text: "The encounter is complete. Please start a new patient.", from: "coach"}]);
      }
      setInputValue("");
      return;
    }

    const providerMessageText = inputValue;
    
    // Add message to UI immediately for responsive feel
    setMessages((prev) => [...prev, { text: providerMessageText, from: "provider" }]);
    setConversationHistoryForAPI((prev) => [...prev, { role: "provider", parts: [{ text: providerMessageText }] }]);
    setInputValue(""); // Clear input immediately

    // Send to backend for processing
    await sendInteractionToServer("regular_interaction", providerMessageText);
  };

  /**
   * Request a coaching tip from the AI coach
   */
  const handleCoachTipRequest = async () => {
    setShowCoachPanel(true); // Show coach panel
    await sendInteractionToServer("get_coach_tip", "");
  };

  /**
   * Inject a demonstration response (good or poor example)
   * @param {string} type - "good" or "poor"
   */
  const handleInjectProviderResponse = async (type) => {
    await sendInteractionToServer("inject_provider_response", type);
  };

  /**
   * Manually advance to the next phase of the encounter
   */
  const handleMoveToNextPhase = async () => {
    // Special handling for initial phase transition (client-side only)
    if (encounterState.currentPhase === 0) {
      setEncounterState(prev => ({ ...prev, currentPhase: 1 }));
      setMessages((prev) => [...prev, {text: `COACH: You've started Phase 1: ${ENCOUNTER_PHASES_CLIENT[1].name}. ${ENCOUNTER_PHASES_CLIENT[1].coachPrompt || ''}`, from: "coach"}]);
      return;
    }
    
    // For all other phases, let the server handle the transition
    await sendInteractionToServer("move_to_next_phase", "");
  };

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  /**
   * Calculate the completion percentage for the progress bar
   */
  const getProgressPercentage = () => {
    const totalPhases = Object.keys(ENCOUNTER_PHASES_CLIENT).length - 2; // Exclude phases 0 and 6
    const currentProgress = Math.max(0, encounterState.currentPhase - 1);
    return Math.min(100, (currentProgress / totalPhases) * 100);
  };

  /**
   * Get a color for the current score based on performance
   */
  const getScoreColor = (score, maxScore) => {
    if (maxScore === 0) return '#64748b';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#059669'; // Green
    if (percentage >= 60) return '#d97706'; // Orange
    return '#dc2626'; // Red
  };

  /**
   * Download the complete encounter transcript with scoring
   */
  const downloadTranscript = () => {
    const transcriptContent = messages.map((msg) => {
      const cleanText = msg.text.replace(/\*\*(.*?)\*\*/g, "$1");
      return `[${msg.from.toUpperCase()}] ${cleanText}`;
    }).join("\n\n");

    let scoreSummary = "\n\n--- ENCOUNTER SUMMARY ---\n";
    scoreSummary += `Total Score: ${encounterState.currentCumulativeScore} / ${encounterState.totalPossibleScore}\n\n`;

    // Add detailed phase scoring
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

    // Create and download the file
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

  // ========================================================================
  // SIDE EFFECTS
  // ========================================================================

  /**
   * Auto-scroll chat window to show latest message
   */
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Load a default patient when component mounts (if none selected)
   */
  useEffect(() => {
    if (!patientState && predefinedPatients.length > 0) {
      // Auto-load the first predefined patient
      const patient = predefinedPatients[0];
      const initialCoachMessage = ENCOUNTER_PHASES_CLIENT[0].coachIntro(patient);
      setPatientState(patient);
      setMessages([{ text: initialCoachMessage, from: "coach" }]);
      setSelectedPatientIndex("0");
    }
  }, [patientState]);

  /**
   * Refresh user-generated patients list on component mount
   */
  useEffect(() => {
    refreshUserPatients();
  }, [refreshUserPatients]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  
  const totalScore = encounterState.currentCumulativeScore;
  const maxPossibleScore = encounterState.totalPossibleScore;
  const isFinished = encounterState.currentPhase === Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1;
  const progressPercentage = getProgressPercentage();

  // ========================================================================
  // RENDER COMPONENT
  // ========================================================================

  return (
    <div className="app-container">
      {/* ================================================================ */}
      {/* MODAL OVERLAYS */}
      {/* ================================================================ */}
      
      {/* Full Patient Information Modal */}
      {showFullPatientInfo && patientState && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowFullPatientInfo(false)}>×</button>
            <h2 className="modal-title">Complete Patient Information</h2>
            <p className="modal-text">This information is available to guide your interaction. Not all details may be immediately apparent in the conversation.</p>
            
            <div className="patient-info-grid">
              <div className="patient-info-section">
                <h4>Demographics</h4>
                <p className="patient-info-detail"><span className="patient-info-label">Name:</span> {patientState.name}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Age:</span> {patientState.age}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Gender:</span> {patientState.genderIdentity} ({patientState.pronouns})</p>
                <p className="patient-info-detail"><span className="patient-info-label">Native Language:</span> {patientState.nativeLanguage}</p>
                <p className="patient-info-detail"><span className="patient-info-label">English Proficiency:</span> {patientState.englishProficiency}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Cultural Background:</span> {patientState.culturalBackground}</p>
              </div>
              
              <div className="patient-info-section">
                <h4>Presenting Concerns</h4>
                <p className="patient-info-detail"><span className="patient-info-label">Main Complaint:</span> {patientState.mainComplaint}</p>
                {patientState.secondaryComplaint && <p className="patient-info-detail"><span className="patient-info-label">Secondary Complaint:</span> {patientState.secondaryComplaint}</p>}
                <p className="patient-info-detail"><span className="patient-info-label">Patient's Ideas:</span> {patientState.illnessPerception_Ideas}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Patient's Concerns:</span> {patientState.illnessPerception_Concerns}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Patient's Expectations:</span> {patientState.illnessPerception_Expectations}</p>
              </div>
              
              <div className="patient-info-section">
                <h4>Medical Information</h4>
                <p className="patient-info-detail"><span className="patient-info-label">Past Medical History:</span> {patientState.relevantPastMedicalHistory}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Medications & Allergies:</span> {patientState.relevantMedicationsAndAllergies}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Family History:</span> {patientState.relevantFamilyHistory}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Social History:</span> {patientState.relevantSocialHistory}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Physical Exam Findings:</span> {patientState.physicalExamFindings}</p>
              </div>
              
              <div className="patient-info-section">
                <h4>Clinical Information</h4>
                <p className="patient-info-detail"><span className="patient-info-label">Correct Diagnosis:</span> {patientState.correctDiagnosis}</p>
                <p className="patient-info-detail"><span className="patient-info-label">Management Plan:</span> {patientState.managementPlanOutline}</p>
                {patientState.redFlags_worseningConditions && <p className="patient-info-detail"><span className="patient-info-label">Red Flags:</span> {patientState.redFlags_worseningConditions}</p>}
                <p className="patient-info-detail"><span className="patient-info-label">Family Involvement:</span> {patientState.familyInvolvementPreference}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Scoring Modal */}
      {showScoringModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowScoringModal(false)}>×</button>
            <h2 className="modal-title">Detailed Scoring Breakdown</h2>
            
            <div className="scoring-overview">
              <div className="score-summary-card">
                <h3>Overall Performance</h3>
                <div className="score-display">
                  <span className="score-number" style={{color: getScoreColor(totalScore, maxPossibleScore)}}>
                    {totalScore}
                  </span>
                  <span className="score-divider">/</span>
                  <span className="score-max">{maxPossibleScore}</span>
                </div>
                <div className="score-percentage">
                  {maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0}%
                </div>
              </div>
            </div>

            <h3 className="score-card-title">Rubric Categories</h3>
            {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => (
              <div key={`rubric-def-modal-${key}`} className="rubric-definition">
                <div className="rubric-header">
                  <span className="rubric-icon">{def.icon}</span>
                  <span className="rubric-label">{def.label}</span>
                </div>
                <p className="rubric-description">{def.desc}</p>
              </div>
            ))}

            {Object.values(encounterState.phaseScores).some((score) => score !== null) && (
              <>
                <hr className="modal-divider" />
                <h3 className="score-card-title">Phase-by-Phase Breakdown</h3>
              </>
            )}

            {/* Phase scoring details */}
            {Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).map((phaseKey) => {
              const phaseName = ENCOUNTER_PHASES_CLIENT[phaseKey].name;
              const phaseMaxScore = ENCOUNTER_PHASES_CLIENT[phaseKey].maxScore;
              const phaseCategoryScores = encounterState.phaseScores[phaseName];

              return (
                <React.Fragment key={phaseName}>
                  {phaseCategoryScores && (
                    <div className="phase-score-section">
                      <div className="phase-header">
                        <h4>{phaseName}</h4>
                        <span className="phase-score">
                          {Object.values(phaseCategoryScores).reduce((sum, score) => sum + (score?.points || 0), 0)} / {phaseMaxScore}
                        </span>
                      </div>
                      
                      <div className="category-scores">
                        {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([categoryKey, categoryDef]) => {
                          const scoreDetails = phaseCategoryScores[categoryKey];
                          return (
                            <div key={`${phaseName}-${categoryKey}`} className="category-score-item">
                              <div className="category-score-header">
                                <span className="category-icon">{categoryDef.icon}</span>
                                <span className="category-name">{categoryDef.label}</span>
                                <span className="category-points">
                                  {scoreDetails?.points !== undefined ? `${scoreDetails.points}/${categoryDef.max}` : "Pending"}
                                </span>
                              </div>
                              {scoreDetails?.justification && (
                                <p className="score-justification">{scoreDetails.justification}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MAIN INTERFACE */}
      {/* ================================================================ */}
      
      <div className="simulation-main">
        {/* Top Progress Bar and Phase Indicator */}
        {patientState && (
          <div className="simulation-header">
            <div className="phase-progress">
              <div className="progress-info">
                <h2 className="current-phase">
                  {encounterState.currentPhase > 0 && !isFinished 
                    ? ENCOUNTER_PHASES_CLIENT[encounterState.currentPhase]?.name 
                    : isFinished 
                    ? "Encounter Complete" 
                    : "Getting Started"
                  }
                </h2>
                <div className="progress-stats">
                  <span>Phase {Math.max(1, encounterState.currentPhase)} of 5</span>
                  {encounterState.providerTurnCount > 0 && (
                    <span>{encounterState.providerTurnCount} messages sent</span>
                  )}
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${progressPercentage}%`}}
                ></div>
              </div>
            </div>
            
            {/* Score Display */}
            <div className="score-display-header">
              <div className="score-card-mini">
                <div className="score-main">
                  <span style={{color: getScoreColor(totalScore, maxPossibleScore)}}>
                    {totalScore}
                  </span>
                  <span className="score-divider">/</span>
                  <span>{maxPossibleScore}</span>
                </div>
                <button 
                  className="score-detail-btn" 
                  onClick={() => setShowScoringModal(true)}
                  disabled={isLoading}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="simulation-content">
          {/* Chat Interface */}
          <div className="chat-section">
            <div className="chat-window modern-chat" ref={chatWindowRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`message modern-message ${
                  msg.from === "patient" ? "patient-message" : 
                  msg.from === "coach" ? "coach-message" : 
                  "provider-message"
                }`}>
                  <div className="message-header">
                    <span className="message-sender">
                      {msg.from === "patient" ? "👤 Patient" : 
                       msg.from === "coach" ? "🎓 Coach" : 
                       "🩺 You"}
                    </span>
                    <span className="message-time">
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="message-content">
                    <p dangerouslySetInnerHTML={{__html: msg.text}}></p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message modern-message system-message">
                  <div className="loading-indicator">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>ECHO is thinking...</span>
                  </div>
                </div>
              )}
              
              {!patientState && !isLoading && (
                <div className="welcome-message">
                  <h3>Welcome to ECHO</h3>
                  <p>Select a patient from the dropdown below to begin your clinical encounter simulation.</p>
                </div>
              )}
              
              {error && (
                <div className="message modern-message error-message">
                  <div className="message-content">
                    <p>⚠️ {error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {!isFinished ? (
              <div className="input-section modern-input">
                <div className="input-container">
                  <input 
                    type="text" 
                    className="input-box modern-input-box" 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} 
                    placeholder="Type your response to the patient..." 
                    disabled={isLoading || !patientState} 
                  />
                  <button 
                    className="send-button modern-send-btn" 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !patientState || !inputValue.trim()}
                  >
                    <span>Send</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22,2 15,22 11,13 2,9"></polygon>
                    </svg>
                  </button>
                </div>
                
                {/* Coach Assistance Panel */}
                <div className={`coach-panel ${showCoachPanel ? 'coach-panel-visible' : ''}`}>
                  <div className="coach-panel-header">
                    <h4>🎓 Coach Assistance</h4>
                    <button 
                      className="coach-panel-toggle" 
                      onClick={() => setShowCoachPanel(!showCoachPanel)}
                    >
                      {showCoachPanel ? '−' : '+'}
                    </button>
                  </div>
                  
                  {showCoachPanel && (
                    <div className="coach-panel-content">
                      <p>Need help with your next response? Use these tools:</p>
                      <div className="coach-actions">
                        <button 
                          className="coach-btn tip-btn" 
                          onClick={handleCoachTipRequest}
                          disabled={isLoading || !patientState}
                        >
                          💡 Get Tip
                        </button>
                        <button 
                          className="coach-btn demo-btn good" 
                          onClick={() => handleInjectProviderResponse("good")}
                          disabled={isLoading || !patientState}
                        >
                          ✨ Show Good Response
                        </button>
                        <button 
                          className="coach-btn demo-btn poor" 
                          onClick={() => handleInjectProviderResponse("poor")}
                          disabled={isLoading || !patientState}
                        >
                          ⚠️ Show Poor Response
                        </button>
                        <button 
                          className="coach-btn advance-btn" 
                          onClick={handleMoveToNextPhase}
                          disabled={isLoading || !patientState}
                        >
                          ⏭️ Next Phase
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Final Results Display */
              <div className="final-results">
                <div className="results-header">
                  <h2>🎉 Encounter Complete!</h2>
                  <p>Congratulations on completing your clinical simulation</p>
                </div>
                
                <div className="results-content">
                  <div className="final-score-display">
                    <div className="score-circle">
                      <div className="score-value" style={{color: getScoreColor(totalScore, maxPossibleScore)}}>
                        {totalScore}
                      </div>
                      <div className="score-total">out of {maxPossibleScore}</div>
                      <div className="score-percentage">
                        {maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0}%
                      </div>
                    </div>
                    
                    <div className="score-breakdown">
                      {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => {
                        const categoryMaxTotal = Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).length * def.max;
                        const categoryAchievedTotal = Object.values(encounterState.phaseScores).reduce((sum, phaseScoreObj) => {
                          return sum + (phaseScoreObj ? (phaseScoreObj[key]?.points || 0) : 0);
                        }, 0);
                        
                        return (
                          <div key={key} className="category-summary">
                            <span className="category-icon">{def.icon}</span>
                            <span className="category-label">{def.label}</span>
                            <span className="category-score">
                              {categoryAchievedTotal}/{categoryMaxTotal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {overallFeedback && (
                    <div className="feedback-section">
                      <h3>📝 Overall Feedback</h3>
                      <div className="feedback-content">
                        <p dangerouslySetInnerHTML={{__html: overallFeedback}}></p>
                      </div>
                    </div>
                  )}
                  
                  <div className="results-actions">
                    <button 
                      className="btn-primary download-btn" 
                      onClick={downloadTranscript}
                    >
                      📥 Download Transcript
                    </button>
                    <button 
                      className="btn-secondary details-btn" 
                      onClick={() => setShowScoringModal(true)}
                    >
                      📊 View Detailed Scores
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Patient Information Card */}
          {patientState && (
            <div className="patient-card modern-card">
              <div className="patient-card-header">
                <div className="patient-avatar">
                  <span className="avatar-icon">👤</span>
                </div>
                <div className="patient-basic-info">
                  <h3 className="patient-name">{patientState.name}</h3>
                  <p className="patient-demographics">
                    {patientState.age} years old • {patientState.genderIdentity} • {patientState.nativeLanguage} speaker
                  </p>
                  <div className="language-proficiency">
                    <span className={`proficiency-badge ${patientState.englishProficiency.toLowerCase().replace(' ', '-')}`}>
                      {patientState.englishProficiency} English
                    </span>
                  </div>
                </div>
              </div>

              <div className="patient-card-content">
                <div className="complaint-section">
                  <h4>🩺 Presenting Complaint</h4>
                  <p className="main-complaint">{patientState.mainComplaint}</p>
                  {patientState.secondaryComplaint && (
                    <p className="secondary-complaint">Also: {patientState.secondaryComplaint}</p>
                  )}
                </div>

                <div className="cultural-context">
                  <h4>🌍 Cultural Context</h4>
                  <p>{patientState.culturalBackground}</p>
                  <div className="persona-tag">
                    <span>Persona: {patientState.patientPersona}</span>
                  </div>
                </div>

                <div className="patient-perspectives">
                  <h4>💭 Patient's Perspective</h4>
                  <div className="perspective-grid">
                    <div className="perspective-item">
                      <span className="perspective-label">Ideas:</span>
                      <p>{patientState.illnessPerception_Ideas}</p>
                    </div>
                    <div className="perspective-item">
                      <span className="perspective-label">Concerns:</span>
                      <p>{patientState.illnessPerception_Concerns}</p>
                    </div>
                    <div className="perspective-item">
                      <span className="perspective-label">Expectations:</span>
                      <p>{patientState.illnessPerception_Expectations}</p>
                    </div>
                  </div>
                </div>

                <div className="clinical-summary">
                  <h4>⚕️ Clinical Summary</h4>
                  <div className="clinical-grid">
                    <div className="clinical-item">
                      <span className="clinical-label">Diagnosis:</span>
                      <p>{patientState.correctDiagnosis}</p>
                    </div>
                    <div className="clinical-item">
                      <span className="clinical-label">Key History:</span>
                      <p>{patientState.relevantPastMedicalHistory}</p>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-outline" 
                    onClick={() => setShowFullPatientInfo(true)}
                  >
                    📋 View Complete Information
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="control-panel modern-controls">
          <div className="control-section">
            <label htmlFor="patient-select" className="control-label">Select Patient:</label>
            <select
              id="patient-select"
              className="patient-selector"
              onChange={handlePredefinedPatientChange}
              value={selectedPatientIndex}
              disabled={isLoading}
            >
              <option value="">Choose a patient scenario...</option>
              
              {userPatients.length > 0 && (
                <optgroup label="📁 Your Generated Patients">
                  {userPatients.map((patient) => (
                    <option key={`user-${patient.id}`} value={`user-${patient.id}`}>
                      👤 {patient.name} - {patient.mainComplaint.substring(0, 40)}...
                    </option>
                  ))}
                </optgroup>
              )}
              
              <optgroup label="📚 Predefined Scenarios">
                {predefinedPatients.map((patient, index) => (
                  <option key={index} value={index}>
                    {patient.name} - {patient.mainComplaint.substring(0, 40)}...
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="control-actions">
            <button 
              className="btn-refresh" 
              onClick={refreshUserPatients} 
              disabled={isLoading}
              title="Refresh patient list"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulationPage;
