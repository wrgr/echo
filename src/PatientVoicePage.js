// PatientVoicePage.js - Patient Communication Training Module
// Based on existing ECHO SimulationPage.js architecture

import React, { useState, useEffect, useRef } from 'react';
import { usePatientSimulation } from './hooks/usePatientSimulation';
import { PATIENT_SPECIALTIES, PATIENT_SCENARIOS, COMMUNICATION_PHASES } from './utils/patientConstants';
import './PatientVoicePage.css';

const PatientVoicePage = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('preparation');
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    conversation,
    currentScore,
    feedback,
    isActive,
    startSimulation,
    sendMessage,
    endSimulation,
    resetSimulation
  } = usePatientSimulation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSpecialtySelect = (specialty) => {
    setSelectedSpecialty(specialty);
    setCurrentScenario(null);
  };

  const handleScenarioSelect = (scenario) => {
    setCurrentScenario(scenario);
    startSimulation(scenario, selectedSpecialty);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    await sendMessage(userMessage, currentPhase);
    setUserMessage('');
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNextPhase = () => {
    const phases = Object.keys(COMMUNICATION_PHASES);
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
    }
  };

  const renderSpecialtySelection = () => (
    <div className="patient-specialty-selection">
      <div className="patient-header">
        <h1>PatientVoice Training</h1>
        <p className="patient-subtitle">
          Learn effective healthcare communication skills and understand your role in shared decision-making
        </p>
      </div>
      
      <div className="specialty-grid">
        {PATIENT_SPECIALTIES.map(specialty => (
          <div
            key={specialty.id}
            className="specialty-card"
            onClick={() => handleSpecialtySelect(specialty)}
          >
            <div className="specialty-icon">{specialty.icon}</div>
            <h3>{specialty.name}</h3>
            <p>{specialty.description}</p>
            <div className="specialty-scenarios">
              {specialty.scenarioCount} scenarios available
            </div>
          </div>
        ))}
      </div>
      
      <div className="patient-info-panel">
        <h3>What You'll Learn</h3>
        <ul>
          <li>How to prepare effective questions for healthcare visits</li>
          <li>Understanding your role in shared decision-making</li>
          <li>Professional boundaries and appropriate expectations</li>
          <li>When and how to advocate for yourself</li>
          <li>Medicine as a profession vs. customer service</li>
        </ul>
      </div>
    </div>
  );

  const renderScenarioSelection = () => (
    <div className="patient-scenario-selection">
      <div className="specialty-header">
        <button 
          className="back-button"
          onClick={() => setSelectedSpecialty(null)}
        >
          ← Back to Specialties
        </button>
        <h2>{selectedSpecialty.name} Scenarios</h2>
      </div>
      
      <div className="scenario-grid">
        {PATIENT_SCENARIOS[selectedSpecialty.id]?.map(scenario => (
          <div
            key={scenario.id}
            className="scenario-card"
            onClick={() => handleScenarioSelect(scenario)}
          >
            <div className="scenario-difficulty">
              {scenario.difficulty}
            </div>
            <h3>{scenario.title}</h3>
            <p>{scenario.description}</p>
            <div className="scenario-objectives">
              <strong>Learning Objectives:</strong>
              <ul>
                {scenario.objectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            </div>
            <div className="scenario-duration">
              Estimated time: {scenario.estimatedTime}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSimulation = () => (
    <div className="patient-simulation-container">
      {/* Header with scenario info and progress */}
      <div className="simulation-header">
        <div className="scenario-info">
          <h2>{currentScenario.title}</h2>
          <p>{currentScenario.context}</p>
        </div>
        
        <div className="phase-indicator">
          <div className="current-phase">
            Phase: {COMMUNICATION_PHASES[currentPhase].label}
          </div>
          <div className="communication-score">
            Communication Score: {currentScore}/100
          </div>
        </div>
        
        <button 
          className="end-simulation-btn"
          onClick={endSimulation}
        >
          End Session
        </button>
      </div>

      {/* Communication Guidelines Panel */}
      <div className="guidelines-panel">
        <h3>Current Phase: {COMMUNICATION_PHASES[currentPhase].label}</h3>
        <div className="phase-objectives">
          {COMMUNICATION_PHASES[currentPhase].patientObjectives.map((obj, index) => (
            <div key={index} className="objective-item">
              ✓ {obj}
            </div>
          ))}
        </div>
        
        {currentPhase === 'asking_questions' && (
          <div className="ask-me-3-plus">
            <h4>Enhanced "Ask Me 3+" Framework</h4>
            <div className="question-prompts">
              <div className="prompt-item">1. What is my main problem/diagnosis?</div>
              <div className="prompt-item">2. What are my treatment options?</div>
              <div className="prompt-item">3. What should I realistically expect?</div>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Area */}
      <div className="conversation-container">
        <div className="messages-area">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'patient' ? 'patient-message' : 'provider-message'}`}
            >
              <div className="message-header">
                <span className="role-label">
                  {message.role === 'patient' ? 'You' : 'Healthcare Provider'}
                </span>
                <span className="timestamp">{message.timestamp}</span>
              </div>
              <div className="message-content">{message.content}</div>
              
              {message.feedback && (
                <div className="message-feedback">
                  <div className={`feedback-score ${message.feedback.category}`}>
                    {message.feedback.score}/10
                  </div>
                  <div className="feedback-text">{message.feedback.comment}</div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="communication-tips">
            <strong>Tips for this phase:</strong> {COMMUNICATION_PHASES[currentPhase].tips}
          </div>
          
          <div className="message-input-section">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={COMMUNICATION_PHASES[currentPhase].placeholder}
              disabled={isLoading || !isActive}
              className="message-input"
              rows="3"
            />
            
            <div className="input-controls">
              <button
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || isLoading}
                className="send-button"
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
              
              {COMMUNICATION_PHASES[currentPhase].canAdvance && (
                <button
                  onClick={handleNextPhase}
                  className="next-phase-button"
                >
                  Next Phase →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Feedback Panel */}
      {showFeedback && feedback && (
        <div className="feedback-panel">
          <div className="feedback-header">
            <h3>Communication Feedback</h3>
            <button onClick={() => setShowFeedback(false)}>×</button>
          </div>
          
          <div className="rubric-scores">
            {Object.entries(feedback.rubricScores || {}).map(([category, score]) => (
              <div key={category} className="rubric-item">
                <span className="rubric-category">{category}</span>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${(score/10) * 100}%` }}
                  ></div>
                </div>
                <span className="score-value">{score}/10</span>
              </div>
            ))}
          </div>
          
          <div className="improvement-suggestions">
            <h4>Suggestions for Improvement:</h4>
            <ul>
              {feedback.suggestions?.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompletionSummary = () => (
    <div className="completion-summary">
      <div className="summary-header">
        <h2>Training Session Complete!</h2>
        <div className="final-score">
          Final Communication Score: {currentScore}/100
        </div>
      </div>
      
      <div className="performance-breakdown">
        <h3>Performance Breakdown</h3>
        {feedback?.rubricScores && Object.entries(feedback.rubricScores).map(([category, score]) => (
          <div key={category} className="performance-item">
            <span>{category}</span>
            <span>{score}/10</span>
          </div>
        ))}
      </div>
      
      <div className="key-learnings">
        <h3>Key Learnings</h3>
        <ul>
          {feedback?.keyLearnings?.map((learning, index) => (
            <li key={index}>{learning}</li>
          ))}
        </ul>
      </div>
      
      <div className="action-buttons">
        <button onClick={resetSimulation} className="try-again-button">
          Try Another Scenario
        </button>
        <button onClick={() => setSelectedSpecialty(null)} className="change-specialty-button">
          Change Specialty
        </button>
      </div>
    </div>
  );

  // Main render logic
  if (!selectedSpecialty) {
    return renderSpecialtySelection();
  }
  
  if (!currentScenario) {
    return renderScenarioSelection();
  }
  
  if (!isActive && conversation.length > 0) {
    return renderCompletionSummary();
  }
  
  return renderSimulation();
};

export default PatientVoicePage;