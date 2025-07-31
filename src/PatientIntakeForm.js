import React, { useState, useEffect } from 'react';

// Import existing patient data files
import predefinedPatients from './patients/predefinedPatients.json';

/**
 * ECHO Patient Intake Form Component
 * 
 * This component provides a comprehensive interface for creating custom patient scenarios
 * for clinical simulation training. It offers both AI-powered field population and manual
 * form entry to generate realistic patient profiles.
 * 
 * Key Features:
 * - AI-powered automatic field population from natural language descriptions
 * - Manual form entry with comprehensive patient data fields
 * - Interactive tooltips explaining each field's purpose and usage
 * - Random patient generation capability
 * - Local storage integration for user-generated patients
 * - JSON export functionality for patient data
 * - Integration with ECHO simulation system
 * 
 * Technical Implementation:
 * - Uses Firebase Cloud Functions for AI processing and patient generation
 * - Stores generated patients in localStorage for immediate availability
 * - Follows the Patient-Centered/Biopsychosocial clinical model
 * - Implements cultural competency considerations throughout the form
 */

// ============================================================================
// FIELD DEFINITIONS WITH HELPFUL TOOLTIPS
// ============================================================================

/**
 * Comprehensive tooltip definitions for all form fields
 * Each tooltip provides context, examples, and best practices for field completion
 */
const FIELD_TOOLTIPS = {
  // ========== AI DESCRIPTION ==========
  aiDescription: {
    title: "AI Patient Description",
    content: "Describe your patient scenario in natural language. Be as detailed as possible - include demographics, symptoms, cultural background, personality traits, and any specific learning objectives. The AI will use this to populate all form fields automatically. Example: 'A 45-year-old Spanish-speaking woman with chest pain who is worried about having a heart attack like her father did. She's anxious, has limited English proficiency, and tends to minimize her symptoms due to cultural beliefs about not complaining.'"
  },

  // ========== BASIC DEMOGRAPHICS ==========
  name: {
    title: "Patient Name",
    content: "A realistic but fictional name that matches the patient's cultural background. This name will be used throughout the simulation. Consider cultural authenticity - use names that reflect the patient's heritage and help create an immersive learning experience."
  },
  
  age: {
    title: "Patient Age",
    content: "Age significantly affects communication patterns, health concerns, decision-making capacity, and clinical approach. Consider how age influences the patient's health literacy, technology comfort, family dynamics, and typical presenting concerns for their life stage."
  },
  
  genderIdentity: {
    title: "Gender Identity",
    content: "How the patient identifies their gender, which may differ from sex assigned at birth. This affects communication style, comfort levels with certain topics, healthcare preferences, and potential health considerations. Options include Male, Female, Non-binary, Transgender male, Transgender female, etc."
  },
  
  pronouns: {
    title: "Preferred Pronouns",
    content: "The pronouns the patient uses (he/him, she/her, they/them, etc.). Using correct pronouns demonstrates respect, builds trust, and creates a safe environment. This is crucial for establishing rapport and ensuring the patient feels comfortable discussing sensitive health topics."
  },

  // ========== PRESENTING COMPLAINTS ==========
  mainComplaint: {
    title: "Chief Complaint",
    content: "The primary reason the patient is seeking medical care, stated in their own words. This should be realistic and specific - what would a real patient say when asked 'What brings you in today?' Keep it conversational and authentic to the patient's communication style and educational level."
  },
  
  secondaryComplaint: {
    title: "Secondary Concerns",
    content: "Additional health concerns the patient has that might emerge during the conversation. Many patients have multiple concerns but may not mention them initially. These could be related or unrelated to the main complaint and often surface with prompts like 'Is there anything else worrying you?'"
  },

  // ========== CULTURAL & COMMUNICATION ==========
  nativeLanguage: {
    title: "Native/First Language",
    content: "The patient's first language, which affects communication patterns, comfort level, health literacy, and interpretation needs. Even patients who speak English may prefer their native language for complex medical discussions, especially when stressed or in pain."
  },
  
  englishProficiency: {
    title: "English Language Proficiency",
    content: "The patient's English speaking and comprehension level. Options: Limited (basic words only), Intermediate (conversational but struggles with medical terms), Fluent (comfortable with complex discussions), or Native speaker. This determines communication strategies and interpretation needs."
  },
  
  culturalBackground: {
    title: "Cultural/Ethnic Background",
    content: "The patient's cultural, ethnic, or religious identity that influences health beliefs, family dynamics, decision-making processes, and healthcare preferences. Consider how cultural factors might affect pain expression, family involvement, treatment acceptance, and health practices."
  },
  
  patientPersona: {
    title: "Patient Personality & Communication Style",
    content: "Describe how the patient typically communicates and behaves in healthcare settings. Are they anxious, stoic, talkative, suspicious of medical authority, overly compliant, detail-oriented, or dismissive? Do they ask lots of questions or prefer to listen? This affects the entire interaction dynamic and learning objectives."
  },

  // ========== ILLNESS PERCEPTION (ICE MODEL) ==========
  illnessPerception_Ideas: {
    title: "Patient's Ideas About Their Condition",
    content: "What the patient thinks is causing their symptoms - their personal theory about what's wrong. This could be medically accurate, completely incorrect, or based on past experiences, cultural beliefs, or internet research. Understanding patient ideas helps address misconceptions and build on correct understanding."
  },
  
  illnessPerception_Concerns: {
    title: "Patient's Concerns and Worries",
    content: "What the patient is most worried about regarding their symptoms. This might include fears about serious illness (cancer, heart attack), impact on family/work, financial concerns, or specific anxieties based on past experiences. These concerns often drive healthcare-seeking behavior more than symptoms themselves."
  },
  
  illnessPerception_Expectations: {
    title: "Patient's Expectations for This Visit",
    content: "What the patient hopes to achieve from this medical encounter. This could include specific treatments, diagnostic tests, referrals, work notes, reassurance, or simply understanding what's wrong. Unmet expectations often lead to dissatisfaction even when medical care is appropriate."
  },

  // ========== MEDICAL HISTORY ==========
  relevantPastMedicalHistory: {
    title: "Past Medical History",
    content: "Previous illnesses, surgeries, hospitalizations, or chronic conditions relevant to the current complaint or overall health assessment. Include dates when important for the clinical scenario. Focus on conditions that might influence current symptoms, treatment options, or prognosis."
  },
  
  relevantMedicationsAndAllergies: {
    title: "Current Medications & Known Allergies",
    content: "List current prescription medications, over-the-counter drugs, supplements, and herbal remedies. Include known drug allergies and specific reactions (rash, anaphylaxis, nausea, etc.). Don't forget to consider medication adherence issues, cost concerns, or cultural preferences for traditional remedies."
  },
  
  relevantFamilyHistory: {
    title: "Family Medical History",
    content: "Significant medical conditions in blood relatives that might be relevant to the current complaint, risk assessment, or health maintenance. Include relationships (mother, father, sibling) and age of onset when relevant. Consider how family history might influence patient fears or health behaviors."
  },
  
  relevantSocialHistory: {
    title: "Social History & Lifestyle Factors",
    content: "Lifestyle factors affecting health: tobacco/alcohol/substance use, occupation, living situation, support systems, exercise habits, diet, sexual history when relevant. Include social determinants of health like housing stability, food security, transportation, and social support that affect health outcomes and treatment adherence."
  },

  // ========== CLINICAL INFORMATION ==========
  physicalExamFindings: {
    title: "Physical Examination Findings",
    content: "What a healthcare provider would find on physical examination. Include vital signs, general appearance, and specific system findings relevant to the complaint. Be realistic and consistent with the intended diagnosis. Consider normal variants and incidental findings that might be present."
  },
  
  correctDiagnosis: {
    title: "Intended/Correct Diagnosis",
    content: "The actual medical diagnosis that explains the patient's symptoms. This is what a competent clinician should arrive at through proper history-taking, examination, and appropriate testing. Consider differential diagnoses and complexity level appropriate for your learners."
  },
  
  managementPlanOutline: {
    title: "Appropriate Management Plan",
    content: "The correct treatment approach including medications, lifestyle modifications, follow-up plans, referrals, or additional testing. Consider patient preferences, contraindications, cost factors, and shared decision-making elements. Include patient education topics and safety netting advice."
  },
  
  redFlags_worseningConditions: {
    title: "Warning Signs & Red Flags",
    content: "Symptoms or situations that would indicate the condition is worsening or becoming dangerous. What should prompt the patient to seek immediate medical attention? Include specific symptoms, timeframes, and clear instructions for when to call or return to the emergency department."
  },

  // ========== FAMILY & SOCIAL DYNAMICS ==========
  familyInvolvementPreference: {
    title: "Family Involvement in Healthcare Decisions",
    content: "How much the patient wants family members involved in their care decisions and health discussions. Consider cultural factors (collective vs. individual decision-making), age-related factors, nature of the medical condition, and family dynamics. Some patients prefer private discussions while others expect family involvement."
  }
};

/**
 * Main PatientIntakeForm Component
 */
function PatientIntakeForm() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  /**
   * AI-powered field population state
   */
  const [aiDescription, setAiDescription] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  /**
   * Patient generation and form submission state
   */
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPatient, setGeneratedPatient] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  /**
   * Tooltip system state
   */
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  /**
   * Main form data state - contains all patient information fields
   * All fields are optional to allow for flexible patient creation workflows
   */
  const [formData, setFormData] = useState({
    // Basic Demographics
    name: '',
    age: '',
    genderIdentity: '',
    pronouns: '',
    
    // Presenting Complaints
    mainComplaint: '',
    secondaryComplaint: '',
    hiddenConcern: '', // Concerns patient might not initially disclose
    
    // Cultural & Communication Factors
    nativeLanguage: '',
    englishProficiency: '',
    culturalBackground: '',
    patientPersona: '',
    
    // Illness Perception (ICE Model: Ideas, Concerns, Expectations)
    illnessPerception_Ideas: '',
    illnessPerception_Concerns: '',
    illnessPerception_Expectations: '',
    
    // Medical History
    relevantPastMedicalHistory: '',
    relevantMedicationsAndAllergies: '',
    relevantFamilyHistory: '',
    relevantSocialHistory: '',
    
    // Clinical Information
    physicalExamFindings: '',
    correctDiagnosis: '',
    managementPlanOutline: '',
    redFlags_worseningConditions: '',
    
    // Social & Family Dynamics
    familyInvolvementPreference: ''
  });

  /**
   * Firebase Cloud Function endpoint for all backend operations
   */
  const functionUrl = "https://us-central1-echo-d825e.cloudfunctions.net/echoSimulator";

  // ========================================================================
  // FORM HANDLING FUNCTIONS
  // ========================================================================

  /**
   * Handle changes to individual form fields
   * @param {string} field - The name of the field being updated
   * @param {string} value - The new value for the field
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear success message when user starts editing after successful AI population
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // ========================================================================
  // TOOLTIP SYSTEM FUNCTIONS
  // ========================================================================

  /**
   * Show tooltip for a specific field
   * @param {string} fieldName - The field to show tooltip for
   * @param {Event} event - Mouse event to get position
   */
  const showTooltip = (fieldName, event) => {
    if (FIELD_TOOLTIPS[fieldName]) {
      setActiveTooltip(fieldName);
      
      // Calculate tooltip position relative to the clicked element
      const rect = event.target.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 10, // Position to the right of the help icon
        y: rect.top
      });
    }
  };

  /**
   * Hide the currently active tooltip
   */
  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  /**
   * Toggle tooltip visibility (for click events)
   * @param {string} fieldName - The field to toggle tooltip for
   * @param {Event} event - Click event
   */
  const toggleTooltip = (fieldName, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (activeTooltip === fieldName) {
      hideTooltip();
    } else {
      showTooltip(fieldName, event);
    }
  };

  // ========================================================================
  // AI-POWERED FIELD POPULATION
  // ========================================================================

  /**
   * Use AI to populate form fields based on natural language description
   * This function sends the user's description to the backend AI service
   * which analyzes the text and fills in appropriate form fields
   */
  const handleAiPopulate = async () => {
    // Input validation
    if (!aiDescription.trim()) {
      setAiError("Please enter a patient description first.");
      return;
    }

    if (aiDescription.trim().length < 10) {
      setAiError("Please provide a more detailed patient description (at least 10 characters).");
      return;
    }

    // Reset state for new AI request
    setIsAiLoading(true);
    setAiError(null);
    setSuccessMessage('');

    try {
      // Send description to AI service for processing
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "ai_populate_fields", // Specific action for field population
          description: aiDescription.trim(),
          existingData: formData // Include existing form data in case user wants to augment
        }),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to extract more meaningful error message
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // If can't parse as JSON, use raw error if it's reasonably short
          if (errorBody.length < 200) {
            errorMessage = errorBody;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Process successful response
      const data = await response.json();
      
      if (data.success && data.populatedFields) {
        // Update form with AI-populated fields
        setFormData(data.populatedFields);
        setSuccessMessage('Fields populated successfully! Review and adjust as needed.');
        
        // Optionally clear the description field after successful population
        // setAiDescription(''); // Commented out to allow iterative refinement
      } else {
        throw new Error(data.error || 'Unexpected response format from server');
      }
      
    } catch (err) {
      console.error("Error populating fields:", err);
      
      // Provide user-friendly error messages based on error type
      let userMessage = "Failed to populate fields. ";
      if (err.message.includes('Failed to parse AI response')) {
        userMessage += "The AI had trouble understanding your description. Please try rephrasing it more clearly.";
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        userMessage += "Network error. Please check your connection and try again.";
      } else if (err.message.includes('HTTP error! status: 500')) {
        userMessage += "Server error. Please try again in a moment.";
      } else {
        userMessage += err.message;
      }
      
      setAiError(userMessage);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ========================================================================
  // PATIENT GENERATION FUNCTIONS
  // ========================================================================

  /**
   * Generate a complete patient scenario from the current form data
   * This processes the form inputs and creates a full patient profile
   * suitable for use in the ECHO simulation system
   */
  const handleSubmit = async () => {
    setIsGenerating(true);
    setAiError(null);
    setSuccessMessage('');

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "generate_patient_from_form",
          formData: formData
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      setGeneratedPatient(data.patient);
      savePatientLocally(data.patient);
      setSuccessMessage('Patient generated successfully!');
      
    } catch (err) {
      console.error("Error generating patient:", err);
      setAiError(`Failed to generate patient: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate a completely random patient scenario
   * This creates a patient without any user input, useful for quick testing
   * or when users want inspiration for patient scenarios
   */
  const handleGenerateRandom = async () => {
    setIsGenerating(true);
    setAiError(null);
    setSuccessMessage('');

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "generate_patient" // No additional data needed for random generation
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      setGeneratedPatient(data.patient);
      savePatientLocally(data.patient);
      setSuccessMessage('Random patient generated successfully!');
      
    } catch (err) {
      console.error("Error generating random patient:", err);
      setAiError(`Failed to generate random patient: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // ========================================================================
  // PATIENT STORAGE AND EXPORT FUNCTIONS
  // ========================================================================

  /**
   * Save the generated patient to local storage for immediate use
   * This makes the patient available in the simulation page dropdown
   * @param {Object} patient - The complete patient data object
   */
  const savePatientLocally = (patient) => {
    try {
      const existingPatients = JSON.parse(localStorage.getItem('userGeneratedPatients') || '[]');
      const patientWithMetadata = {
        ...patient,
        id: Date.now(), // Unique identifier for the patient
        createdAt: new Date().toISOString(), // Creation timestamp
        source: 'user-generated' // Mark as user-created vs predefined
      };
      
      // Add new patient to the beginning of the list (most recent first)
      existingPatients.unshift(patientWithMetadata);
      localStorage.setItem('userGeneratedPatients', JSON.stringify(existingPatients));
      
    } catch (error) {
      console.error('Error saving patient locally:', error);
      // Could show user notification here, but not critical for core functionality
    }
  };

  /**
   * Download the generated patient data as a JSON file
   * This allows users to export patient scenarios for sharing or backup
   */
  const downloadPatientJson = () => {
    if (!generatedPatient) return;
    
    // Create formatted JSON string
    const dataStr = JSON.stringify(generatedPatient, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create and trigger download
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `patient_${generatedPatient.name?.replace(/\s/g, '_') || 'generated'}.json`);
    linkElement.click();
  };

  // ========================================================================
  // COMPONENT HELPER FUNCTIONS
  // ========================================================================

  /**
   * Render a form field with label, input, and help icon with tooltip
   * @param {string} fieldName - The field identifier
   * @param {string} label - Display label for the field
   * @param {string} type - Input type (input, textarea, select)
   * @param {string} placeholder - Placeholder text
   * @param {number} rows - For textarea, number of rows
   */
  const renderFieldWithTooltip = (fieldName, label, type = 'input', placeholder = '', rows = 3) => {
    const tooltip = FIELD_TOOLTIPS[fieldName];
    
    return (
      <div key={fieldName} className="form-field-container">
        <div className="field-label-container">
          <label className="form-label" htmlFor={fieldName}>
            {label}:
          </label>
          {tooltip && (
            <button
              type="button"
              className="tooltip-trigger"
              onClick={(e) => toggleTooltip(fieldName, e)}
              onMouseEnter={(e) => showTooltip(fieldName, e)}
              onMouseLeave={hideTooltip}
              aria-label={`Help for ${label}`}
            >
              ?
            </button>
          )}
        </div>
        
        {type === 'textarea' ? (
          <textarea
            id={fieldName}
            className="text-area"
            value={formData[fieldName]}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            rows={rows}
          />
        ) : (
          <input
            id={fieldName}
            className="input-box"
            type={type === 'number' ? 'number' : 'text'}
            value={formData[fieldName]}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  // ========================================================================
  // CLICK OUTSIDE HANDLER FOR TOOLTIPS
  // ========================================================================
  
  /**
   * Handle clicks outside of tooltips to close them
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeTooltip && !event.target.closest('.tooltip-trigger') && !event.target.closest('.tooltip-popup')) {
        hideTooltip();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeTooltip]);

  // ========================================================================
  // RENDER COMPONENT
  // ========================================================================

  return (
    <div className="app-container">
      {/* Page Header */}
      <div className="header">
        <h1 className="title">Patient Intake Form</h1>
        <p className="subtitle">Create custom patients for ECHO simulation</p>
      </div>

      {/* Tooltip Popup (renders when activeTooltip is set) */}
      {activeTooltip && FIELD_TOOLTIPS[activeTooltip] && (
        <div 
          className="tooltip-popup"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 1000
          }}
        >
          <h4 className="tooltip-title">{FIELD_TOOLTIPS[activeTooltip].title}</h4>
          <p className="tooltip-content">{FIELD_TOOLTIPS[activeTooltip].content}</p>
          <button 
            className="tooltip-close"
            onClick={hideTooltip}
            aria-label="Close tooltip"
          >
            ×
          </button>
        </div>
      )}

      <div className="help-container">
        <div className="help-section" style={{flex: '1'}}>
          
          {/* ============================================================ */}
          {/* AI-POWERED FIELD POPULATION SECTION */}
          {/* ============================================================ */}
          <div className="help-section">
            <h3 className="section-title">AI-Powered Field Population</h3>
            <div className="field-label-container">
              <p className="form-label">Describe your patient and let AI populate the form fields:</p>
              {FIELD_TOOLTIPS.aiDescription && (
                <button
                  type="button"
                  className="tooltip-trigger"
                  onClick={(e) => toggleTooltip('aiDescription', e)}
                  onMouseEnter={(e) => showTooltip('aiDescription', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Help for AI Description"
                >
                  ?
                </button>
              )}
            </div>
            
            <textarea
              className="text-area"
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="e.g., 'A 45-year-old Spanish-speaking woman with chest pain who is worried about having a heart attack like her father did. She's anxious and has limited English proficiency.' Be as detailed as possible for better results."
              rows="4"
            />
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button
                className="submit-button"
                onClick={handleAiPopulate}
                disabled={isAiLoading || !aiDescription.trim()}
              >
                {isAiLoading ? 'Populating Fields...' : 'Populate Fields with AI'}
              </button>
              
              {successMessage && (
                <p className="loading-message" style={{color: 'var(--success-color)', margin: '0'}}>
                  {successMessage}
                </p>
              )}
              
              {aiError && (
                <p className="error-message" style={{margin: '0'}}>
                  {aiError}
                </p>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* MANUAL PATIENT INFORMATION FORM */}
          {/* ============================================================ */}
          <div className="help-section">
            <h3 className="section-title">Patient Information (All fields optional)</h3>
            
            {/* Form Grid Layout */}
            <div className="intake-form-grid">
              
              {/* ========== BASIC DEMOGRAPHICS ========== */}
              <h4 className="form-section-header">Basic Demographics</h4>
              
              {renderFieldWithTooltip('name', 'Name', 'input', 'Patient\'s full name')}
              {renderFieldWithTooltip('age', 'Age', 'number', 'Age in years')}
              {renderFieldWithTooltip('genderIdentity', 'Gender Identity', 'input', 'e.g., Male, Female, Non-binary')}
              {renderFieldWithTooltip('pronouns', 'Pronouns', 'input', 'e.g., he/him, she/her, they/them')}

              {/* ========== PRESENTING COMPLAINTS ========== */}
              <h4 className="form-section-header">Presenting Complaints</h4>
              
              {renderFieldWithTooltip('mainComplaint', 'Main Complaint', 'input', 'Primary reason for visit')}
              {renderFieldWithTooltip('secondaryComplaint', 'Secondary Complaint', 'input', 'Additional concerns')}

              {/* ========== CULTURAL & COMMUNICATION ========== */}
              <h4 className="form-section-header">Cultural & Communication Factors</h4>
              
              {renderFieldWithTooltip('nativeLanguage', 'Native Language', 'input', 'Patient\'s first language')}
              {renderFieldWithTooltip('englishProficiency', 'English Proficiency', 'input', 'e.g., Limited, Intermediate, Fluent')}
              {renderFieldWithTooltip('culturalBackground', 'Cultural Background', 'input', 'Cultural or ethnic background')}
              {renderFieldWithTooltip('patientPersona', 'Patient Persona', 'textarea', 'Personality traits, communication style')}

              {/* ========== ILLNESS PERCEPTION (ICE MODEL) ========== */}
              <h4 className="form-section-header">Patient's Illness Perception (ICE Model)</h4>
              
              {renderFieldWithTooltip('illnessPerception_Ideas', 'Ideas about Illness', 'textarea', 'What the patient thinks is wrong')}
              {renderFieldWithTooltip('illnessPerception_Concerns', 'Concerns', 'textarea', 'What worries the patient most')}
              {renderFieldWithTooltip('illnessPerception_Expectations', 'Expectations', 'textarea', 'What the patient hopes to get from this visit')}

              {/* ========== MEDICAL HISTORY ========== */}
              <h4 className="form-section-header">Medical History</h4>
              
              {renderFieldWithTooltip('relevantPastMedicalHistory', 'Past Medical History', 'textarea', 'Relevant previous medical conditions')}
              {renderFieldWithTooltip('relevantMedicationsAndAllergies', 'Medications & Allergies', 'textarea', 'Current medications and known allergies')}
              {renderFieldWithTooltip('relevantFamilyHistory', 'Family History', 'textarea', 'Relevant family medical history')}
              {renderFieldWithTooltip('relevantSocialHistory', 'Social History', 'textarea', 'Social factors affecting health')}

              {/* ========== CLINICAL INFORMATION ========== */}
              <h4 className="form-section-header">Clinical Information</h4>
              
              {renderFieldWithTooltip('physicalExamFindings', 'Physical Exam Findings', 'textarea', 'Expected physical examination results')}
              {renderFieldWithTooltip('correctDiagnosis', 'Correct Diagnosis', 'input', 'The actual diagnosis')}
              {renderFieldWithTooltip('managementPlanOutline', 'Management Plan', 'textarea', 'Treatment and follow-up plan')}
              {renderFieldWithTooltip('redFlags_worseningConditions', 'Red Flags/Worsening Conditions', 'textarea', 'Warning signs to watch for')}

              {/* ========== FAMILY & SOCIAL DYNAMICS ========== */}
              <h4 className="form-section-header">Family & Social Dynamics</h4>
              
              {renderFieldWithTooltip('familyInvolvementPreference', 'Family Involvement Preference', 'input', 'How family should be involved in care')}
            </div>

            {/* ============================================================ */}
            {/* FORM SUBMISSION CONTROLS */}
            {/* ============================================================ */}
            <div className="controls-container">
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating Patient...' : 'Generate Patient'}
              </button>
              
              <button
                className="control-button"
                onClick={handleGenerateRandom}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Random Patient'}
              </button>
            </div>

            {/* Success message display */}
            {successMessage && (
              <p className="loading-message" style={{color: 'var(--success-color)'}}>
                {successMessage}
              </p>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* GENERATED PATIENT PREVIEW PANEL */}
        {/* ============================================================ */}
        <div className="patient-info-panel" style={{width: '400px'}}>
          {generatedPatient ? (
            <div>
              <h3 className="patient-info-title">Generated Patient</h3>
              
              {/* Patient Summary Display */}
              <div className="patient-info-detail">
                <span className="patient-info-label">Name:</span>
                {generatedPatient.name}
              </div>
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Age:</span>
                {generatedPatient.age}
              </div>
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Gender:</span>
                {generatedPatient.genderIdentity} ({generatedPatient.pronouns})
              </div>
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Main Complaint:</span>
                {generatedPatient.mainComplaint}
              </div>
              
              {generatedPatient.secondaryComplaint && (
                <div className="patient-info-detail">
                  <span className="patient-info-label">Secondary Complaint:</span>
                  {generatedPatient.secondaryComplaint}
                </div>
              )}
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Language:</span>
                {generatedPatient.nativeLanguage} ({generatedPatient.englishProficiency} English)
              </div>
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Cultural Background:</span>
                {generatedPatient.culturalBackground}
              </div>
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Diagnosis:</span>
                {generatedPatient.correctDiagnosis}
              </div>
              
              <div className="patient-info-detail">
                <span className="patient-info-label">Persona:</span>
                {generatedPatient.patientPersona}
              </div>
              
              {/* Export button */}
              <button 
                className="control-button" 
                onClick={downloadPatientJson}
                style={{marginTop: '10px'}}
              >
                Download JSON
              </button>
              
              {/* Usage instructions */}
              <p className="loading-message" style={{fontSize: '0.8em', marginTop: '15px'}}>
                This patient has been saved locally and will appear as "User: {generatedPatient.name}" in the simulation page dropdown.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="patient-info-title">Generated Patient Preview</h3>
              <p className="loading-message">
                Fill out the form and click "Generate Patient" to create a custom patient for simulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientIntakeForm;
