import React, { useState } from 'react';

/**
 * ECHO Help Page Component
 * 
 * This component provides an AI-powered advisory system for healthcare educators
 * and learners using the ECHO simulation platform. It offers contextual guidance
 * for clinical encounters, communication strategies, and cultural competency.
 * 
 * Key Features:
 * - AI-powered clinical consultation and advice
 * - Context-aware recommendations based on patient scenarios
 * - Cultural competency guidance for diverse patient populations
 * - Communication strategy suggestions for challenging interactions
 * - Real-time support during simulation training sessions
 * 
 * Use Cases:
 * - Educators seeking guidance on teaching moments during simulations
 * - Learners needing help with specific clinical or communication challenges
 * - Quick consultation on cultural sensitivity considerations
 * - Troubleshooting difficult patient interactions
 * - Getting suggestions for alternative approaches to patient care
 * 
 * Technical Implementation:
 * - Integrates with the same Firebase Cloud Function as other ECHO components
 * - Uses contextual information to provide targeted advice
 * - Supports both scenario-specific and general clinical guidance
 * - Maintains user privacy by not storing sensitive patient information
 */

function HelpPage() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  /**
   * Patient information context for targeted advice
   * Optional field that helps the AI provide more relevant guidance
   */
  const [patientInfo, setPatientInfo] = useState('');
  
  /**
   * User's perception of the current interaction or learning situation
   * Helps AI understand the specific challenges being faced
   */
  const [providerPerception, setProviderPerception] = useState('');
  
  /**
   * The specific question or area where guidance is needed
   * This is the main input that drives the AI response
   */
  const [question, setQuestion] = useState('');
  
  /**
   * AI-generated advice response
   * Contains the contextual guidance provided by the system
   */
  const [advice, setAdvice] = useState('');
  
  /**
   * Loading state during AI processing
   */
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Error state for handling and displaying issues
   */
  const [error, setError] = useState(null);

  /**
   * Firebase Cloud Function endpoint (shared with other ECHO components)
   */
  const functionUrl = "https://us-central1-echo-d825e.cloudfunctions.net/echoSimulator";

  // ========================================================================
  // FORM VALIDATION HELPERS
  // ========================================================================
  
  /**
   * Validate the question input before submission
   * @returns {boolean} True if valid, false otherwise
   */
  const validateInput = () => {
    if (!question.trim()) {
      setError("Please ask a question for ECHO.");
      return false;
    }
    
    if (question.trim().length < 5) {
      setError("Please provide a more specific question (at least 5 characters).");
      return false;
    }
    
    return true;
  };

  // ========================================================================
  // AI ADVICE REQUEST HANDLER
  // ========================================================================
  
  /**
   * Submit the help request to the AI advisory system
   * This function processes the user's context and question to provide targeted guidance
   */
  const handleSubmitAdvice = async () => {
    // Reset previous state
    setError(null);
    setAdvice('');
    
    // Validate user input
    if (!validateInput()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Prepare the request payload
      const requestData = {
        action: "get_help_advice", // Specific action for the advisory system
        patientInfo: patientInfo.trim(), // Optional patient context
        providerPerception: providerPerception.trim(), // User's situation assessment
        question: question.trim() // The main question needing guidance
      };

      // Send request to AI advisory service
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorBody = await response.text();
        
        // Try to extract meaningful error message
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // If can't parse JSON, use raw error if reasonably short
          if (errorBody.length < 200) {
            errorMessage = errorBody;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Process successful response
      const data = await response.json();
      
      if (data.advice) {
        setAdvice(data.advice);
        
        // Optional: Clear the form after successful submission to encourage new questions
        // setQuestion('');
        // setPatientInfo('');
        // setProviderPerception('');
      } else {
        throw new Error(data.error || 'No advice received from the system');
      }
      
    } catch (err) {
      console.error("Error getting advice:", err);
      
      // Provide user-friendly error messages
      let userMessage = "Failed to get advice. ";
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        userMessage += "Please check your internet connection and try again.";
      } else if (err.message.includes('HTTP error! status: 429')) {
        userMessage += "Too many requests. Please wait a moment and try again.";
      } else if (err.message.includes('HTTP error! status: 500')) {
        userMessage += "Server error. Please try again in a few moments.";
      } else {
        userMessage += err.message;
      }
      
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // FORM RESET HANDLER
  // ========================================================================
  
  /**
   * Clear all form fields and reset state
   */
  const handleClearForm = () => {
    setPatientInfo('');
    setProviderPerception('');
    setQuestion('');
    setAdvice('');
    setError(null);
  };

  // ========================================================================
  // KEYBOARD EVENT HANDLERS
  // ========================================================================
  
  /**
   * Handle Enter key in textarea fields for better UX
   * @param {KeyboardEvent} e - The keyboard event
   */
  const handleKeyPress = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAdvice();
    }
  };

  // ========================================================================
  // RENDER COMPONENT
  // ========================================================================

  return (
    <div className="help-container">
      
      {/* ============================================================ */}
      {/* PAGE HEADER */}
      {/* ============================================================ */}
      <div className="help-header">
        <h2 className="help-title">ECHO Advisory System</h2>
        <p className="help-subtitle">
          Get AI-powered guidance for clinical encounters, communication strategies, 
          and cultural competency considerations. The more context you provide, 
          the more targeted and helpful the advice will be.
        </p>
      </div>

      {/* ============================================================ */}
      {/* MAIN HELP REQUEST FORM */}
      {/* ============================================================ */}
      <div className="help-section">
        <h3 className="section-title">Ask ECHO for Advice</h3>
        
        {/* Patient Information Context Field */}
        <div className="form-field">
          <label className="form-label" htmlFor="patient-info">
            Patient Information <span className="optional-label">(Optional)</span>
          </label>
          <p className="field-description">
            Provide basic patient context to help ECHO give more relevant advice. 
            Include details like age, cultural background, language, main complaint, 
            or any other relevant demographics.
          </p>
          <textarea
            id="patient-info"
            className="text-area"
            value={patientInfo}
            onChange={(e) => setPatientInfo(e.target.value)}
            placeholder="e.g., '50-year-old male, Spanish speaker, limited English proficiency, presenting with chest pain, worried about heart attack, comes from traditional Mexican family...'"
            rows="3"
            onKeyDown={handleKeyPress}
          />
        </div>

        {/* Provider Perception Field */}
        <div className="form-field">
          <label className="form-label" htmlFor="provider-perception">
            Your Assessment of the Situation <span className="optional-label">(Optional)</span>
          </label>
          <p className="field-description">
            Describe how you feel the interaction is going, what challenges you're facing, 
            or what you've observed. This helps ECHO understand your perspective and 
            provide more targeted guidance.
          </p>
          <textarea
            id="provider-perception"
            className="text-area"
            value={providerPerception}
            onChange={(e) => setProviderPerception(e.target.value)}
            placeholder="e.g., 'I'm struggling to build rapport with this patient. They seem withdrawn and aren't sharing much information. I think there might be a cultural barrier or they don't trust me yet. I've tried being more direct but that seemed to make them more uncomfortable...'"
            rows="3"
            onKeyDown={handleKeyPress}
          />
        </div>

        {/* Main Question Field */}
        <div className="form-field">
          <label className="form-label" htmlFor="main-question">
            Your Question for ECHO <span className="required-label">*</span>
          </label>
          <p className="field-description">
            Ask a specific question about the clinical encounter, communication strategies, 
            cultural considerations, or any other aspect where you need guidance.
          </p>
          <textarea
            id="main-question"
            className="text-area"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., 'How can I better elicit their concerns?', 'What's a culturally sensitive way to introduce an interpreter?', 'How should I address their fear about the diagnosis?', 'What communication approach might work better with this patient?'"
            rows="3"
            onKeyDown={handleKeyPress}
            required
          />
        </div>

        {/* Form Controls */}
        <div className="form-controls">
          <button
            className="submit-button"
            onClick={handleSubmitAdvice}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? 'Getting Advice...' : 'Get Advice from ECHO'}
          </button>
          
          <button
            className="control-button secondary"
            onClick={handleClearForm}
            disabled={isLoading}
          >
            Clear Form
          </button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <p className="keyboard-hint">
          💡 Tip: Press Ctrl+Enter (or Cmd+Enter on Mac) to submit from any text field
        </p>

        {/* Error Display */}
        {error && (
          <div className="error-container">
            <h4 className="error-title">⚠️ Error</h4>
            <p className="error-message">{error}</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* AI ADVICE RESPONSE SECTION */}
      {/* ============================================================ */}
      {advice && (
        <div className="help-section">
          <h3 className="section-title">ECHO's Advice</h3>
          
          <div className="advice-container">
            {/* Advice Header */}
            <div className="advice-header">
              <span className="advice-icon">🎓</span>
              <span className="advice-label">Clinical Guidance</span>
            </div>
            
            {/* Main Advice Content */}
            <div className="advice-box">
              <div 
                className="advice-content"
                dangerouslySetInnerHTML={{__html: advice.replace(/\n/g, '<br>')}}
              />
            </div>
            
            {/* Advice Footer with Disclaimer */}
            <div className="advice-footer">
              <p className="advice-disclaimer">
                <strong>Note:</strong> This advice is generated by AI and should be considered 
                alongside your clinical judgment, institutional protocols, and evidence-based 
                practice guidelines. Always prioritize patient safety and seek additional 
                consultation when needed.
              </p>
            </div>
          </div>

          {/* Follow-up Actions */}
          <div className="follow-up-actions">
            <button
              className="control-button"
              onClick={() => {
                setQuestion('');
                setProviderPerception('');
                // Keep patient info for follow-up questions about the same patient
              }}
            >
              Ask Another Question
            </button>
            
            <button
              className="control-button secondary"
              onClick={() => {
                navigator.clipboard.writeText(advice);
                // Could add toast notification here
              }}
            >
              Copy Advice
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* USAGE TIPS AND EXAMPLES */}
      {/* ============================================================ */}
      <div className="help-section tips-section">
        <h3 className="section-title">Tips for Getting the Best Advice</h3>
        
        <div className="tips-grid">
          <div className="tip-card">
            <h4 className="tip-title">🎯 Be Specific</h4>
            <p className="tip-content">
              Instead of "How do I talk to this patient?", try "How can I address 
              their reluctance to discuss family history when I suspect genetic factors?"
            </p>
          </div>
          
          <div className="tip-card">
            <h4 className="tip-title">🌍 Include Cultural Context</h4>
            <p className="tip-content">
              Mention cultural background, language preferences, and any cultural 
              considerations you've observed. This helps provide culturally sensitive guidance.
            </p>
          </div>
          
          <div className="tip-card">
            <h4 className="tip-title">🔄 Describe What You've Tried</h4>
            <p className="tip-content">
              Explain what approaches you've already attempted and how the patient 
              responded. This helps avoid repeating unsuccessful strategies.
            </p>
          </div>
          
          <div className="tip-card">
            <h4 className="tip-title">🎭 Consider Multiple Perspectives</h4>
            <p className="tip-content">
              Think about the patient's perspective, family dynamics, and systemic 
              factors that might be influencing the interaction.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXAMPLE QUESTIONS SECTION */}
      {/* ============================================================ */}
      <div className="help-section examples-section">
        <h3 className="section-title">Example Questions</h3>
        
        <div className="examples-list">
          <div className="example-category">
            <h4 className="example-category-title">Communication Strategies</h4>
            <ul className="example-questions">
              <li>"How can I explain a complex diagnosis to a patient with limited health literacy?"</li>
              <li>"What's the best way to involve an interpreter in sensitive conversations?"</li>
              <li>"How should I respond when a patient becomes emotional or starts crying?"</li>
            </ul>
          </div>
          
          <div className="example-category">
            <h4 className="example-category-title">Cultural Competency</h4>
            <ul className="example-questions">
              <li>"How do I respectfully address traditional healing practices that conflict with medical recommendations?"</li>
              <li>"What should I know about decision-making in collectivist cultures?"</li>
              <li>"How can I build trust with patients who may have experienced healthcare discrimination?"</li>
            </ul>
          </div>
          
          <div className="example-category">
            <h4 className="example-category-title">Difficult Conversations</h4>
            <ul className="example-questions">
              <li>"How do I discuss bad news with a patient whose family wants to protect them from the diagnosis?"</li>
              <li>"What's the best approach when a patient refuses recommended treatment?"</li>
              <li>"How should I handle a patient who is angry or hostile during the encounter?"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
