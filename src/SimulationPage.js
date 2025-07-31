import React, { useEffect, useRef } from "react";
import predefinedPatients from "./patients/predefinedPatients.json";
import { ENCOUNTER_PHASES_CLIENT, PHASE_RUBRIC_DEFINITIONS } from "./utils/constants";
import { useSimulation } from "./hooks/useSimulation";

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


// ===========================================================================
// MAIN COMPONENT
// ===========================================================================

function SimulationPage() {
  // ========================================================================
  // HOOKS
  // ========================================================================

  const {
    messages,
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
    handlePredefinedPatientChange,
    handleSendMessage,
    handleCoachTipRequest,
    handleInjectProviderResponse,
    handleMoveToNextPhase,
    getProgressPercentage,
    getScoreClass,
    downloadTranscript,
  } = useSimulation();

  /**
   * Reference to chat window for auto-scrolling to latest message
   */
  const chatWindowRef = useRef(null);

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
                  <span className={`score-number ${getScoreClass(totalScore, maxPossibleScore)}`}>
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
                  style={{ '--progress-width': `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Score Display */}
            <div className="score-display-header">
              <div className="score-card-mini">
                <div className="score-main">
                  <span className={getScoreClass(totalScore, maxPossibleScore)}>
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
                      <div className={`score-value ${getScoreClass(totalScore, maxPossibleScore)}`}>
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
