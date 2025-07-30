import React, { useState, useEffect, useRef, useCallback } from "react";
import predefinedPatients from "./predefinedPatients.json";

// --- Media Query Constants ---
const mobileBreakpoint = "(max-width: 768px)";

// --- Styling ---
const styles = {
  // **FIX:** Added appContainer style for the main wrapper div
  appContainer: {
    fontFamily: "'Roboto', sans-serif",
    maxWidth: "1200px",
    width: "98%",
    margin: "30px auto",
    padding: "0",
    border: "1px solid #dbe1e8",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(21,48,74,0.08)",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    height: "98vh", // This is crucial for vertical flex layout
    overflow: "hidden", // Prevents scrollbars on the main container itself
    minHeight: "600px",
    "@media (max-width: 768px)": {
      margin: "0",
      height: "auto",
      minHeight: "100vh",
      borderRadius: "0",
      border: "none",
      flexDirection: "column",
      width: "100%",
      maxWidth: "100%",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    },
  },
  mainContentWrapper: {
    display: "flex",
    flexGrow: 1,
    overflow: "hidden",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      flexGrow: 0,
      height: "auto",
      overflowY: "visible",
    },
  },
  chatAndInputContainer: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "85%", // Allocate more width for chat window on desktop (was 80%)
    "@media (max-width: 768px)": {
      width: "100%",
      flexGrow: 0,
      height: "auto",
      minHeight: "40vh",
      overflowY: "auto",
    },
  },
  patientInfoPanel: {
    width: "15%", // Allocate less width for info panel on desktop (was 20%)
    backgroundColor: "#f0f4f8",
    borderLeft: "1px solid #dbe1e8",
    padding: "20px",
    overflowY: "auto",
    flexShrink: 0,
    "@media (max-width: 768px)": {
      display: "none", // Hide the sidebar patient info panel on mobile
    },
  },
  patientInfoTitle: {
    fontSize: "1.2em",
    fontWeight: "bold",
    color: "#15304a",
    marginBottom: "10px",
  },
  patientInfoDetail: {
    fontSize: "0.9em",
    marginBottom: "5px",
    color: "#334155",
    lineHeight: "1.4",
  },
  patientInfoDetailLabel: {
    fontWeight: "bold",
    marginRight: "5px",
    color: "#475569",
  },
  chatWindow: {
    padding: "20px",
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    "@media (max-width: 768px)": {
      padding: "10px",
    },
  },

  message: {
    padding: "12px 18px", borderRadius: "20px", maxWidth: "75%", lineHeight: "1.5", wordBreak: "break-word",
    fontSize: "16px",
    "@media (max-width: 768px)": {
      maxWidth: "90%",
      fontSize: "14px",
    },
  },
  patientMessage: {backgroundColor: "#eef2f7", color: "#334155", alignSelf: "flex-start", borderBottomLeftRadius: "5px", },
  providerMessage: {backgroundColor: "#0d9488", color: "white", alignSelf: "flex-end", borderBottomRightRadius: "5px", },
  coachMessage: {
    backgroundColor: "#fffbeb", color: "#b45309", alignSelf: "center",
    border: "1px solid #fde68a", width: "90%", textAlign: "center", fontStyle: "italic",
    "@media (max-width: 768px)": {
      width: "95%",
      padding: "8px 12px",
      fontSize: "13px",
    },
  },
  inputContainer: {
    display: "flex",
    padding: "15px 20px", // Slightly reduced top/bottom padding (was 20px)
    borderTop: "1px solid #dbe1e8",
    backgroundColor: "#f7f9fc",
    flexShrink: 0,
    "@media (max-width: 768px)": {
      padding: "10px",
      flexDirection: "column",
    },
  },
  inputBox: {
    flexGrow: 1, padding: "12px 15px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "25px", outline: "none", transition: "border-color 0.2s",
    "@media (max-width: 768px)": {
      width: "100%",
      marginBottom: "10px",
    },
  },
  sendButton: {
    padding: "10px 20px", fontSize: "16px", border: "none", backgroundColor: "#0d9488", color: "white", cursor: "pointer", borderRadius: "25px", marginLeft: "10px", transition: "background-color 0.2s",
    "@media (max-width: 768px)": {
      width: "100%",
      marginLeft: "0",
    },
  },
  compactScoreSummary: { // New style for compact score display
    textAlign: "center",
    padding: "10px 20px",
    backgroundColor: "#f7f9fc",
    borderTop: "1px solid #dbe1e8",
    fontSize: "1.1em",
    fontWeight: "bold",
    color: "#15304a",
    flexShrink: 0,
    display: "flex", // Make it a flex container
    flexWrap: "wrap", // Allow items to wrap
    justifyContent: "center", // Center items
    gap: "15px", // Space between score items
    "@media (max-width: 768px)": {
      padding: "8px 10px",
      fontSize: "0.9em",
      gap: "10px",
    },
  },
  compactScoreCategory: { // Style for individual category in compact summary
    fontSize: "0.9em",
    color: "#334155",
    whiteSpace: "nowrap", // Prevent wrapping within a category score
  },
  scoreCard: { // This style is now for the modal content
    padding: "20px",
    backgroundColor: "#f7f9fc",
    borderTop: "1px solid #dbe1e8", // This border will be within the modal now
    flexShrink: 0,
    "@media (max-width: 768px)": {
      padding: "10px 10px",
      fontSize: "12px",
    },
  },
  scoreCardTitle: {
    color: "#15304a",
    textAlign: "left",
    fontSize: "16px",
    margin: "0 0 8px 0",
    fontWeight: "700",
    "@media (max-width: 768px)": {
      fontSize: "14px",
      margin: "0 0 5px 0",
    },
  },
  scoreCategoryRow: {
    display: "flex",
    justifyContent: "space-between",
    margin: "2px 0",
    fontSize: "14px",
    "@media (max-width: 768px)": {
      fontSize: "12px",
    },
  },
  justificationText: {
    fontSize: "0.85em",
    color: "#64748b",
    fontStyle: "italic",
    marginTop: "2px",
    marginLeft: "15px",
    flexBasis: "100%",
    display: "block",
    whiteSpace: "pre-wrap",
  },
  finalScoreContainer: {
    textAlign: "center",
    padding: "40px 20px",
    flexShrink: 0,
    "@media (max-width: 768px)": {
      padding: "20px 10px",
    },
  },
  finalScoreValue: {fontSize: "52px", fontWeight: "bold", color: "#0d9488", margin: "20px 0",
    "@media (max-width: 768px)": {
      fontSize: "40px",
    },
  },
  loadingMessage: {fontStyle: "italic", color: "#64748b", textAlign: "center", padding: "20px",
    "@media (max-width: 768px)": {
      fontSize: "14px",
      padding: "10px",
    },
  },
  controlsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    padding: "10px 20px",
    backgroundColor: "#f7f9fc",
    borderTop: "1px solid #eef2f7",
    flexShrink: 0,
    flexWrap: "wrap",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      gap: "8px",
      padding: "10px",
    },
  },
  controlButton: {
    padding: "8px 16px", fontSize: "14px", border: "1px solid #9ca3af",
    backgroundColor: "#f9fafb", color: "#374151", cursor: "pointer",
    borderRadius: "20px", transition: "background-color 0.2s",
    whiteSpace: "nowrap",
    "@media (max-width: 768px)": {
      width: "100%",
      padding: "12px",
    },
  },
  dropdown: {
    padding: "8px 16px", fontSize: "14px", border: "1px solid #9ca3af",
    backgroundColor: "#f9fafb", color: "#374151", borderRadius: "20px",
    cursor: "pointer", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "16px",
    paddingRight: "30px",
    "@media (max-width: 768px)": {
      width: "100%",
      padding: "12px",
    },
  },
  phaseIndicator: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#0d9488",
    marginBottom: "10px",
    fontSize: "1.1em",
    "@media (max-width: 768px)": {
      fontSize: "0.9em",
    },
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "16px",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    position: "relative",
    "@media (max-width: 768px)": {
      width: "95%",
      padding: "20px",
      margin: "10px",
      borderRadius: "8px",
    },
  },
  modalCloseButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "1.5em",
    cursor: "pointer",
    color: "#64748b",
    padding: "5px",
  },
  modalTitle: {
    color: "#15304a",
    fontSize: "24px",
    fontWeight: "700",
    marginTop: "0",
    marginBottom: "15px",
    textAlign: "center",
  },
  modalText: {
    color: "#334155",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "10px",
  },
  modalTextBold: {
    fontWeight: "bold",
  },
  modalList: {
    listStyleType: "disc",
    marginLeft: "20px",
    marginBottom: "10px",
  },
  modalListItem: {
    marginBottom: "5px",
  },
  overallFeedbackBox: { // Style for the new overall feedback
    backgroundColor: "#eef2f7",
    border: "1px solid #dbe1e8",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "20px",
    marginBottom: "20px",
    textAlign: "left",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap", // Preserve formatting from Gemini
    color: "#334155",
    fontSize: "0.95em",
  },
};

// Client-side mirroring of phases for display purposes (maxScore is still used here)
const ENCOUNTER_PHASES_CLIENT = {
  0: { name: "Introduction & Initial Presentation", maxScore: 0, coachIntro: (patient) => `Welcome to ECHO! You're about to meet ${patient.name}, a ${patient.age}-year-old. Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter with cultural humility and shared understanding. Phase 1: Initiation and Building the Relationship: What is your first step?"` },
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
  const [error, setError] = useState(null); // Added setError here

  const [encounterState, setEncounterState] = useState({
    currentPhase: 0,
    providerTurnCount: 0,
    phaseScores: {}, // This will be an object where keys are phase names and values are score objects
    currentCumulativeScore: 0,
    totalPossibleScore: 0,
  });

  const chatWindowRef = useRef(null);

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/echoSimulator"; // Updated function URL

  // --- API Interaction Functions (moved to top and wrapped in useCallback) ---

  const resetSimulation = useCallback(() => {
    setIsLoading(false);
    setMessages([]);
    setConversationHistoryForAPI([]);
    setPatientState(null);
    setSelectedPatientIndex("");
    setShowFullPatientInfo(false);
    setShowScoringModal(false);
    setOverallFeedback(null);
    setError(null); // Reset error state on simulation reset
    setEncounterState({
      currentPhase: 0,
      providerTurnCount: 0,
      phaseScores: {},
      currentCumulativeScore: 0,
      totalPossibleScore: 0,
    });
  }, []); // No dependencies for resetSimulation

  const loadPatient = useCallback((patientProfile, initialCoachMessage, initialEncounterState) => {
    setPatientState(patientProfile);
    setMessages([{ text: initialCoachMessage, from: "coach" }]);
    setConversationHistoryForAPI([]); // Start fresh for API
    setEncounterState(initialEncounterState);
  }, []); // No dependencies for loadPatient as it receives all data

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
  }, [resetSimulation, loadPatient, functionUrl, setError, setMessages]); // Added setMessages, setError to dependencies

  // **FIX:** Moved handlePredefinedPatientChange to be defined early
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
        currentPhase: 0, // Server is still at phase 0 initially
        providerTurnCount: 0,
        phaseScores: {},
        currentCumulativeScore: 0,
        totalPossibleScore: 0,
      });
    }
  }, [resetSimulation, setPatientState, setSelectedPatientIndex, setMessages, setConversationHistoryForAPI, setEncounterState]);


  // Generic function to send interaction data to the Firebase Function
  const sendInteractionToServer = useCallback(async (actionType, input) => {
    if (!patientState || isLoading) return; // check isLoading and patientState before setting isLoading to true to avoid double calls
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interact_conversation", // Main action for Firebase Function
          actionType: actionType, // Specific action type for backend logic
          latestInput: input, // User's message or 'good'/'poor' for injected
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

      setPatientState(data.patientState || patientState); // Update patientState if server sends it back
      setEncounterState(data.encounterState); // Crucial: Update entire encounter state from server
      setOverallFeedback(data.overallFeedback); // Set overall feedback if provided

      // Handle displaying messages based on what the server returned
      if (data.injectedProviderResponse) { // For 'inject_provider_response'
        setMessages((prev) => [...prev, { text: data.injectedProviderResponse, from: "provider" }]);
        setConversationHistoryForAPI((prev) => [...prev, { role: "provider", parts: [{ text: data.injectedProviderResponse }] }]);
      }

      setMessages((prev) => [...prev, { text: data.simulatorResponse, from: data.from }]);
      setConversationHistoryForAPI((prev) => [...prev, { role: data.from, parts: [{ text: data.simulatorResponse }] }]);

      // If a nextCoachMessage is explicitly sent by the server, display it
      // This is often for phase transitions or special coach interventions
      if (data.nextCoachMessage && data.nextCoachMessage !== data.simulatorResponse) {
          setMessages((prev) => [...prev, { text: data.nextCoachMessage, from: "coach" }]);
          setConversationHistoryForAPI((prev) => [...prev, { role: "coach", parts: [{ text: data.nextCoachMessage }] }]);
      }

    } catch (err) { // Changed 'error' to 'err' for consistency
      console.error("Failed to communicate with cloud function:", err);
      setError(`Failed to communicate with the AI backend: ${err.message}. Please try again.`); // Set specific error message
      setMessages((prev) => [...prev, { text: `Sorry, an error occurred with the AI backend. Check console for details.`, from: "coach" }]);
      // If error, revert last provider message from API history (if it was a regular send)
      if (actionType === "regular_interaction") {
          setConversationHistoryForAPI((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [patientState, isLoading, conversationHistoryForAPI, encounterState, functionUrl, setError, setMessages, setConversationHistoryForAPI, setEncounterState, setOverallFeedback]); // Dependencies for sendInteractionToServer


  // --- Event Handlers (using the API Interaction Functions) ---

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
    setInputValue(""); // Clear input immediately

    // Send this regular interaction to the server
    await sendInteractionToServer("regular_interaction", providerMessageText);
  };

  const handleCoachTipRequest = async () => {
    await sendInteractionToServer("get_coach_tip", ""); // No specific input needed for a general tip
  };

  const handleInjectProviderResponse = async (type) => {
    await sendInteractionToServer("inject_provider_response", type); // 'good' or 'poor'
  };

  const handleMoveToNextPhase = async () => {
    // Special handling for initial phase 0 transition (client-side only for intro)
    if (encounterState.currentPhase === 0) {
        setEncounterState(prev => ({ ...prev, currentPhase: 1 }));
        setMessages((prev) => [...prev, {text: `COACH: You've started Phase 1: ${ENCOUNTER_PHASES_CLIENT[1].name}. ${ENCOUNTER_PHASES_CLIENT[1].coachPrompt || ''}`, from: "coach"}]);
        return;
    }
    // For all other phases, let the server handle the phase transition
    await sendInteractionToServer("move_to_next_phase", ""); // No specific input needed
  };


  // --- Effects ---

  // Effect for auto-scrolling chat window
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect to load a default patient on initial mount
  useEffect(() => {
    if (!patientState) { // Only load if no patient is currently set
      handleNewPatientClick(); // This now safely calls the useCallback version
    }
  }, [patientState, handleNewPatientClick]); // Dependencies are correct


  // --- Calculated Values for Rendering ---
  const totalScore = encounterState.currentCumulativeScore;
  const maxPossibleScore = encounterState.totalPossibleScore;
  const isFinished = encounterState.currentPhase === Object.keys(ENCOUNTER_PHASES_CLIENT).length - 1;


  // Function to download transcript
  const downloadTranscript = () => {
    const transcriptContent = messages.map((msg) => {
      const cleanText = msg.text.replace(/\*\*(.*?)\*\*/g, "$1"); // Clean markdown bolding
      return `[${msg.from.toUpperCase()}] ${cleanText}`;
    }).join("\n\n");

    let scoreSummary = "\n\n--- ENCOUNTER SUMMARY ---\n";
    scoreSummary += `Total Score: ${totalScore} / ${maxPossibleScore}\n\n`;

    // Ensure phaseScores is an object before iterating
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
    const dateString = today.toISOString().slice(0, 10); //YYYY-MM-DD
    const fileName = `ECHO_Encounter_Transcript_${patientState?.name?.replace(/\s/g, "_") || "unknown_patient"}_${dateString}.txt`; // Updated filename
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    // **FIX:** Using styles.appContainer for the main wrapper div
    <div style={styles.appContainer}>
      {showInstructions && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.modalCloseButton} onClick={() => setShowInstructions(false)}>X</button>
            <h2 style={styles.modalTitle}>Welcome to ECHO: Your Clinical Communication Simulator!</h2>
            <p style={styles.modalText}>
              ECHO (Empowering Conversations for better Healthcare Outcomes) is designed to help you practice and refine your patient communication and clinical reasoning skills, especially with patients who may have Limited English Proficiency (LEP) or diverse cultural backgrounds.
            </p>
            <h3 style={styles.modalTextBold}>How to Use the Simulator:</h3>
            <ul style={styles.modalList}>
              <li style={styles.modalListItem}>
                <span style={styles.modalTextBold}>Start a Scenario:</span> Click "Generate New Patient" to get a dynamically created patient profile, or select from the "Load Predefined Patient" dropdown. (A default patient is loaded automatically when you start the app.)
              </li>
              <li style={styles.modalListItem}>
                <span style={styles.modalTextBold}>Engage in Conversation:</span> Read the coach's introduction message in the chat window. Type your responses in the input box and press Enter or click "Send". Messages will be clearly labeled: <span style={styles.modalTextBold}>Coach</span> (guidance), <span style={styles.modalTextBold}>Provider</span> (your messages), and <span style={styles.modalTextBold}>Patient</span> (the standardized patient's responses).
              </li>
              <li style={styles.modalListItem}>
                <span style={styles.modalTextBold}>Navigate Encounter Phases:</span> The clinical encounter is broken down into 5 phases, mirroring the Patient-Centered / Biopsychosocial Model:
                <ul style={styles.modalList}>
                  {Object.values(ENCOUNTER_PHASES_CLIENT).slice(1, 6).map((phase) => ( // Skip phase 0 and 6
                    <li key={phase.name} style={styles.modalListItem}>{phase.name}</li>
                  ))}
                </ul>
                The coach will introduce each new phase and provide its goals.
              </li>
              <li style={styles.modalListItem}>
                <span style={styles.modalTextBold}>Receive Feedback & Scoring:</span> After each meaningful interaction, the simulator will assess your performance. The <span style={styles.modalTextBold}>Rubric Scorecard</span> (at the bottom) will show points for: Communication, Trust & Rapport, Accuracy, Cultural Humility, and Shared Understanding. Each category is worth 1 point per phase. Justifications will explain the scoring. When a phase is completed (either automatically or manually), you'll receive a summary score for that phase.
              </li>
              <li style={styles.modalListItem}>
                <span style={styles.modalTextBold}>Use Helper Buttons:</span>
                <ul style={styles.modalList}>
                  <li style={styles.modalListItem}>
                    <span style={styles.modalTextBold}>Coach Tip:</span> Get a coach's tip based on your actions so far, providing context and guidance for the current phase.
                  </li>
                  <li style={styles.modalListItem}>
                    <span style={styles.modalTextBold}>Inject Good Response / Inject Poor Response:</span> These buttons will inject an AI-generated provider response into the chat, simulating an ideal or less-than-ideal action, and show its impact.
                  </li>
                  <li style={styles.modalListItem}>
                    <span style={styles.modalTextBold}>Move to Next Phase:</span> If you feel you've completed the current phase, or are stuck, click this button to manually advance the scenario. A score for the completed phase will be provided.
                  </li>
                  <li style={styles.modalListItem}>
                    <span style={styles.modalTextBold}>Download Transcript:</span> At the end of the encounter, download the full conversation history and score summary.
                  </li>
                </ul>
              </li>
              <li style={styles.modalListItem}>
                <span style={styles.modalTextBold}>Complete the Encounter:</span> The encounter ends after the Closure phase. Your final total score and overall feedback will be displayed.
              </li>
            </ul>
            <p style={{...styles.modalText, textAlign: "center", marginTop: "20px"}}>
              <span style={styles.modalTextBold}>Remember:</span> Focus on clear communication, active listening, and integrating the patient's unique background into your approach. Good luck!
            </p>
          </div>
        </div>
      )}

      {showFullPatientInfo && patientState && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.modalCloseButton} onClick={() => setShowFullPatientInfo(false)}>X</button>
            <h2 style={styles.modalTitle}>Full Patient Information Cheatsheet</h2>
            <p style={styles.modalText}>This information is available to guide your interaction. Not all details may be immediately apparent in the conversation.</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Name:</span> {patientState.name}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Age:</span> {patientState.age}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Gender:</span> {patientState.genderIdentity} ({patientState.pronouns})</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Main Complaint:</span> {patientState.mainComplaint}</p>
            {patientState.secondaryComplaint && <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Secondary Complaint:</span> {patientState.secondaryComplaint}</p>}
            {/* Hidden Concern is for AI to know, not for provider to see unless revealed */}
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Native Language:</span> {patientState.nativeLanguage}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>English Proficiency:</span> {patientState.englishProficiency}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Cultural Background:</span> {patientState.culturalBackground}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Patient Persona:</span> {patientState.patientPersona}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Ideas about Illness:</span> {patientState.illnessPerception_Ideas}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Concerns:</span> {patientState.illnessPerception_Concerns}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Expectations:</span> {patientState.illnessPerception_Expectations}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Past Medical History:</span> {patientState.relevantPastMedicalHistory}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Medications & Allergies:</span> {patientState.relevantMedicationsAndAllergies}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Family History:</span> {patientState.relevantFamilyHistory}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Social History:</span> {patientState.relevantSocialHistory}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Physical Exam Findings:</span> {patientState.physicalExamFindings}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Correct Diagnosis:</span> {patientState.correctDiagnosis}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Management Plan Outline:</span> {patientState.managementPlanOutline}</p>
            {patientState.redFlags_worseningConditions && <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Red Flags/Worsening Conditions:</span> {patientState.redFlags_worseningConditions}</p>}
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Family Involvement Preference:</span> {patientState.familyInvolvementPreference}</p>
          </div>
        </div>
      )}

      {showScoringModal && ( // New Scoring Modal JSX
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.modalCloseButton} onClick={() => setShowScoringModal(false)}>X</button>
            <h2 style={styles.modalTitle}>Rubric & Phase Scores</h2>
            <h3 style={styles.scoreCardTitle}>Rubric Definitions:</h3>
            {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => (
              <p style={{...styles.scoreCategoryRow, flexDirection: "column"}} key={`rubric-def-modal-${key}`}>
                <span style={{display: "flex", justifyContent: "space-between", width: "100%"}}>
                  <span style={styles.modalTextBold}>{def.label}:</span>
                </span>
                <span style={styles.justificationText}>{def.desc}</span>
              </p>
            ))}
            {Object.values(encounterState.phaseScores).some((score) => score !== null) && (
              <>
                <hr style={{borderTop: "1px solid #eee", margin: "15px 0"}} />
                <h3 style={styles.scoreCardTitle}>Phase Scores:</h3>
              </>
            )}
            {/* Iterate through phases 1-5 for scoring display */}
            {Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).map((phaseKey) => {
              const phaseName = ENCOUNTER_PHASES_CLIENT[phaseKey].name;
              const phaseMaxScore = ENCOUNTER_PHASES_CLIENT[phaseKey].maxScore;
              const phaseCategoryScores = encounterState.phaseScores[phaseName];

              return (
                <React.Fragment key={phaseName}>
                  {phaseCategoryScores && ( // Only show if phase has been scored
                    <>
                      <p style={{...styles.scoreCategoryRow, fontWeight: "bold", marginTop: "10px"}}>
                        <span>{phaseName}:</span>
                        <span>{Object.values(phaseCategoryScores).reduce((sum, score) => sum + (score?.points || 0), 0)} / {phaseMaxScore}</span>
                      </p>
                      {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([categoryKey, categoryDef]) => {
                        const scoreDetails = phaseCategoryScores[categoryKey];
                        return (
                          <p style={{...styles.scoreCategoryRow, flexDirection: "column"}} key={`${phaseName}-${categoryKey}`}>
                            <span style={{display: "flex", justifyContent: "space-between", width: "100%"}}>
                              <span style={{textTransform: "capitalize"}}>{categoryDef.label}:</span>
                              <strong>{scoreDetails?.points !== undefined ? `${scoreDetails.points}/${categoryDef.max}` : "Pending"}</strong>
                            </span>
                            {scoreDetails?.justification && (
                              <span style={styles.justificationText}>Justification: {scoreDetails.justification}</span>
                            )}
                          </p>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
            <p style={{...styles.scoreCategoryRow, fontWeight: "bold", borderTop: "1px solid #dbe1e8", paddingTop: "10px", marginTop: "10px"}}>
              <span>TOTAL SCORE:</span>
              <span>{totalScore} / {maxPossibleScore}</span>
            </p>
          </div>
        </div>
      )}

      <div style={styles.mainContentWrapper}> {/* Main content area: chat+input and info panel */}
        <div style={styles.chatAndInputContainer}> {/* Left side: Chat window and Input */}
          {patientState && encounterState.currentPhase > 0 && !isFinished && (
            <p style={styles.phaseIndicator}>
              Current Phase: {ENCOUNTER_PHASES_CLIENT[encounterState.currentPhase]?.name || 'Unknown Phase'}
            </p>
          )}

          <div style={styles.chatWindow} ref={chatWindowRef}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                ...styles.message,
                ...(msg.from === "patient" ? styles.patientMessage : (msg.from === "coach" ? styles.coachMessage : styles.providerMessage)),
              }}>
                <p style={{margin: 0, whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: msg.text}}></p> {/* Allow bolding */}
              </div>
            ))}
            {isLoading && <p style={styles.loadingMessage}>ECHO is thinking...</p>}
            {!patientState && !isLoading && (
              <p style={styles.loadingMessage}>
                Click "Generate New Patient" to begin, or select a patient from the list below.
              </p>
            )}
            {error && <p style={{...styles.loadingMessage, color: '#dc2626'}}>{error}</p>} {/* Display error message */}
          </div>

          {!isFinished ? (
            <div style={styles.inputContainer}>
              <input type="text" style={styles.inputBox} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Type your response..." disabled={isLoading || !patientState} />
              <button style={styles.sendButton} onClick={handleSendMessage} disabled={isLoading || !patientState}>Send</button>
            </div>
          ) : (
              <div style={styles.finalScoreContainer}>
                <h2>Encounter Complete!</h2>
                <p>Your Final Score:</p>
                <div style={styles.finalScoreValue}>{totalScore} / {maxPossibleScore}</div>
                {overallFeedback && (
                    <div style={styles.overallFeedbackBox}>
                        <h3>Overall Feedback:</h3>
                        <p dangerouslySetInnerHTML={{__html: overallFeedback}}></p>
                    </div>
                )}
                {totalScore > 0 && (
                    <button style={{...styles.controlButton, marginTop: "20px"}} onClick={downloadTranscript}>Download Transcript</button>
                )}
              </div>
          )}
        </div>

        {/* Patient Information Panel */}
        {patientState && (
          <div style={styles.patientInfoPanel}>
            <h3 style={styles.patientInfoTitle}>Patient Information</h3>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Name:</span> {patientState.name}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Age:</span> {patientState.age}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Gender:</span> {patientState.genderIdentity} ({patientState.pronouns})</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Main Complaint:</span> {patientState.mainComplaint}</p>
            {patientState.secondaryComplaint && <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Secondary Complaint:</span> {patientState.secondaryComplaint}</p>}
            {/* Hidden Concern is for AI to know, not for provider to see unless revealed */}
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Native Language:</span> {patientState.nativeLanguage}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>English Proficiency:</span> {patientState.englishProficiency}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Cultural Background:</span> {patientState.culturalBackground}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Patient Persona:</span> {patientState.patientPersona}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Ideas about Illness:</span> {patientState.illnessPerception_Ideas}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Concerns:</span> {patientState.illnessPerception_Concerns}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Expectations:</span> {patientState.illnessPerception_Expectations}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Past Medical History:</span> {patientState.relevantPastMedicalHistory}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Medications & Allergies:</span> {patientState.relevantMedicationsAndAllergies}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Family History:</span> {patientState.relevantFamilyHistory}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Relevant Social History:</span> {patientState.relevantSocialHistory}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Physical Exam Findings:</span> {patientState.physicalExamFindings}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Correct Diagnosis:</span> {patientState.correctDiagnosis}</p>
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Management Plan Outline:</span> {patientState.managementPlanOutline}</p>
            {patientState.redFlags_worseningConditions && <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Red Flags/Worsening Conditions:</span> {patientState.redFlags_worseningConditions}</p>}
            <p style={styles.patientInfoDetail}><span style={styles.patientInfoDetailLabel}>Family Involvement Preference:</span> {patientState.familyInvolvementPreference}</p>
          </div>
        )}
      </div>

      <div style={styles.controlsContainer}>
        <button style={styles.controlButton} onClick={handleNewPatientClick} disabled={isLoading}>Generate New Patient</button>
        <select
          style={styles.dropdown}
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
        <button style={styles.controlButton} onClick={() => setShowInstructions(true)} disabled={isLoading}>Instructions</button>
        <button style={styles.controlButton} onClick={() => setShowFullPatientInfo(true)} disabled={isLoading || !patientState}>Full Patient Info</button> {/* New button */}
        <button style={styles.controlButton} onClick={handleCoachTipRequest} disabled={isLoading || !patientState || isFinished}>Coach Tip</button>
        <button style={styles.controlButton} onClick={() => handleInjectProviderResponse("good")} disabled={isLoading || !patientState || isFinished}>Inject Good Response</button>
        <button style={styles.controlButton} onClick={() => handleInjectProviderResponse("poor")} disabled={isLoading || !patientState || isFinished}>Inject Poor Response</button>
        <button
          style={styles.controlButton}
          onClick={handleMoveToNextPhase}
          disabled={isLoading || !patientState || isFinished} // Allow move to next from intro phase 0
        >
          Move to Next Phase
        </button>
      </div>

      {/* Compact Score Summary below chat window */}
      {patientState && (
        <div style={styles.compactScoreSummary}>
          <span>Total Score: {totalScore} / {maxPossibleScore}</span>
          {Object.entries(PHASE_RUBRIC_DEFINITIONS).map(([key, def]) => {
            const categoryMaxTotal = Object.keys(ENCOUNTER_PHASES_CLIENT).slice(1, 6).length * def.max; // 5 phases * 1 point
            // Sum points from the actual phaseScores stored in encounterState
            const categoryAchievedTotal = Object.values(encounterState.phaseScores).reduce((sum, phaseScoreObj) => {
              return sum + (phaseScoreObj ? (phaseScoreObj[key]?.points || 0) : 0);
            }, 0);
            return (
              <span key={key} style={styles.compactScoreCategory}>
                {def.label}: {categoryAchievedTotal}/{categoryMaxTotal}
              </span>
            );
          })}
          <button style={{...styles.controlButton, marginLeft: "15px"}} onClick={() => setShowScoringModal(true)} disabled={isLoading}>View Full Scoring</button>
        </div>
      )}
    </div>
  );
}
export default SimulationPage;