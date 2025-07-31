import React, { useState, useEffect } from 'react';

// Import existing patient data files
import predefinedPatients from './predefinedPatients.json';

// Using the same styles pattern as HelpPage.js and SimulationPage.js
const styles = {
  intakeContainer: {
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
    minHeight: "600px",
    '@media (max-width: 768px)': {
      margin: "0",
      borderRadius: "0",
      border: "none",
      width: "100%",
      maxWidth: "100%",
    },
  },
  header: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    padding: '20px',
    borderRadius: '16px 16px 0 0',
    textAlign: 'center',
    '@media (max-width: 768px)': {
      padding: '15px',
      borderRadius: '0',
    },
  },
  title: {
    fontSize: '1.8em',
    fontWeight: 'bold',
    margin: '0',
    '@media (max-width: 768px)': {
      fontSize: '1.4em',
    },
  },
  subtitle: {
    fontSize: '1em',
    margin: '5px 0 0 0',
    opacity: '0.9',
    '@media (max-width: 768px)': {
      fontSize: '0.9em',
    },
  },
  contentContainer: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      overflow: 'visible',
    },
  },
  formSection: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    gap: '20px',
    '@media (max-width: 768px)': {
      padding: '15px',
    },
  },
  resultSection: {
    width: '400px',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #dbe1e8',
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 768px)': {
      width: '100%',
      borderLeft: 'none',
      borderTop: '1px solid #dbe1e8',
      padding: '15px',
    },
  },
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #dbe1e8',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(21,48,74,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
    '@media (max-width: 768px)': {
      padding: '15px',
    },
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    marginBottom: '10px',
    borderBottom: '1px solid #eef2f7',
    paddingBottom: '10px',
    '@media (max-width: 768px)': {
      fontSize: '1.2em',
    },
  },
  label: {
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px',
    display: 'block',
  },
  textArea: {
    width: '100%',
    padding: '12px',
    fontSize: '1em',
    border: '1px solid #ccc',
    borderRadius: '8px',
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: 'var(--primary-color)',
    },
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '1em',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: 'var(--primary-color)',
    },
  },
  button: {
    padding: '12px 25px',
    fontSize: '1em',
    fontWeight: 'bold',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    '&:hover': {
      backgroundColor: '#0a7a6e',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  randomButton: {
    padding: '12px 25px',
    fontSize: '1em',
    fontWeight: 'bold',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    marginLeft: '10px',
    '&:hover': {
      backgroundColor: '#b45309',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '15px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  patientCard: {
    backgroundColor: '#eef2f7',
    border: '1px solid #dbe1e8',
    borderRadius: '12px',
    padding: '20px',
    lineHeight: '1.6',
    color: '#334155',
    fontSize: '0.95em',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    marginBottom: '15px',
    textAlign: 'center',
  },
  cardField: {
    marginBottom: '8px',
    fontSize: '0.9em',
  },
  cardLabel: {
    fontWeight: 'bold',
    color: '#475569',
    marginRight: '5px',
  },
  loadingMessage: {
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    padding: '20px',
  },
  errorMessage: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  successMessage: {
    color: '#16a34a',
    textAlign: 'center',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  downloadButton: {
    padding: '8px 16px',
    fontSize: '0.9em',
    fontWeight: 'bold',
    backgroundColor: '#374151',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
    '&:hover': {
      backgroundColor: '#4b5563',
    },
  }
};

function PatientIntakeForm() {
  const [aiDescription, setAiDescription] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [generatedPatient, setGeneratedPatient] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Patient form fields (all optional)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    genderIdentity: '',
    pronouns: '',
    mainComplaint: '',
    secondaryComplaint: '',
    hiddenConcern: '',
    nativeLanguage: '',
    englishProficiency: '',
    culturalBackground: '',
    patientPersona: '',
    illnessPerception_Ideas: '',
    illnessPerception_Concerns: '',
    illnessPerception_Expectations: '',
    relevantPastMedicalHistory: '',
    relevantMedicationsAndAllergies: '',
    relevantFamilyHistory: '',
    relevantSocialHistory: '',
    physicalExamFindings: '',
    correctDiagnosis: '',
    managementPlanOutline: '',
    redFlags_worseningConditions: '',
    familyInvolvementPreference: ''
  });

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/echoSimulator";

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAiPopulate = async () => {
    if (!aiDescription.trim()) {
      setAiError("Please enter a patient description first.");
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "ai_populate_fields",
          description: aiDescription.trim(),
          existingData: formData
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      setFormData(data.populatedFields);
    } catch (err) {
      console.error("Error populating fields:", err);
      setAiError(`Failed to populate fields: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

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

  const handleGenerateRandom = async () => {
    setIsGenerating(true);
    setAiError(null);
    setSuccessMessage('');

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "generate_patient"
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

  const savePatientLocally = (patient) => {
    try {
      const existingPatients = JSON.parse(localStorage.getItem('userGeneratedPatients') || '[]');
      const patientWithMetadata = {
        ...patient,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        source: 'user-generated'
      };
      existingPatients.unshift(patientWithMetadata); // Add to beginning
      localStorage.setItem('userGeneratedPatients', JSON.stringify(existingPatients));
    } catch (error) {
      console.error('Error saving patient locally:', error);
    }
  };

  const downloadPatientJson = () => {
    if (!generatedPatient) return;
    
    const dataStr = JSON.stringify(generatedPatient, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `patient_${generatedPatient.name?.replace(/\s/g, '_') || 'generated'}.json`);
    linkElement.click();
  };

  return (
    <div style={styles.intakeContainer}>
      <div style={styles.header}>
        <h1 style={styles.title}>Patient Intake Form</h1>
        <p style={styles.subtitle}>Create custom patients for ECHO simulation</p>
      </div>

      <div style={styles.contentContainer}>
        <div style={styles.formSection}>
          {/* AI Description Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>AI-Powered Field Population</h3>
            <p style={styles.label}>Describe your patient and let AI populate the form fields:</p>
            <textarea
              style={styles.textArea}
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="e.g., 'A 45-year-old Spanish-speaking woman with chest pain who is worried about having a heart attack like her father did. She's anxious and has limited English proficiency.'"
            />
            <button
              style={styles.button}
              onClick={handleAiPopulate}
              disabled={isAiLoading || !aiDescription.trim()}
            >
              {isAiLoading ? 'Populating Fields...' : 'Populate Fields with AI'}
            </button>
            {aiError && <p style={styles.errorMessage}>{aiError}</p>}
          </div>

          {/* Patient Information Form */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Patient Information (All fields optional)</h3>
            <div style={styles.formGrid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Name:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Patient's full name"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Age:</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Age in years"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Gender Identity:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.genderIdentity}
                  onChange={(e) => handleInputChange('genderIdentity', e.target.value)}
                  placeholder="e.g., Male, Female, Non-binary"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Pronouns:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.pronouns}
                  onChange={(e) => handleInputChange('pronouns', e.target.value)}
                  placeholder="e.g., he/him, she/her, they/them"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Main Complaint:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.mainComplaint}
                  onChange={(e) => handleInputChange('mainComplaint', e.target.value)}
                  placeholder="Primary reason for visit"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Secondary Complaint:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.secondaryComplaint}
                  onChange={(e) => handleInputChange('secondaryComplaint', e.target.value)}
                  placeholder="Additional concerns"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Native Language:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.nativeLanguage}
                  onChange={(e) => handleInputChange('nativeLanguage', e.target.value)}
                  placeholder="Patient's first language"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>English Proficiency:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.englishProficiency}
                  onChange={(e) => handleInputChange('englishProficiency', e.target.value)}
                  placeholder="e.g., Limited, Intermediate, Fluent"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Cultural Background:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.culturalBackground}
                  onChange={(e) => handleInputChange('culturalBackground', e.target.value)}
                  placeholder="Cultural or ethnic background"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Patient Persona:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.patientPersona}
                  onChange={(e) => handleInputChange('patientPersona', e.target.value)}
                  placeholder="Personality traits, communication style"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Ideas about Illness:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.illnessPerception_Ideas}
                  onChange={(e) => handleInputChange('illnessPerception_Ideas', e.target.value)}
                  placeholder="What the patient thinks is wrong"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Concerns:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.illnessPerception_Concerns}
                  onChange={(e) => handleInputChange('illnessPerception_Concerns', e.target.value)}
                  placeholder="What worries the patient most"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Expectations:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.illnessPerception_Expectations}
                  onChange={(e) => handleInputChange('illnessPerception_Expectations', e.target.value)}
                  placeholder="What the patient hopes to get from this visit"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Past Medical History:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.relevantPastMedicalHistory}
                  onChange={(e) => handleInputChange('relevantPastMedicalHistory', e.target.value)}
                  placeholder="Relevant previous medical conditions"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Medications & Allergies:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.relevantMedicationsAndAllergies}
                  onChange={(e) => handleInputChange('relevantMedicationsAndAllergies', e.target.value)}
                  placeholder="Current medications and known allergies"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Family History:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.relevantFamilyHistory}
                  onChange={(e) => handleInputChange('relevantFamilyHistory', e.target.value)}
                  placeholder="Relevant family medical history"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Social History:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.relevantSocialHistory}
                  onChange={(e) => handleInputChange('relevantSocialHistory', e.target.value)}
                  placeholder="Social factors affecting health"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Physical Exam Findings:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.physicalExamFindings}
                  onChange={(e) => handleInputChange('physicalExamFindings', e.target.value)}
                  placeholder="Expected physical examination results"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Correct Diagnosis:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.correctDiagnosis}
                  onChange={(e) => handleInputChange('correctDiagnosis', e.target.value)}
                  placeholder="The actual diagnosis"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Management Plan:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.managementPlanOutline}
                  onChange={(e) => handleInputChange('managementPlanOutline', e.target.value)}
                  placeholder="Treatment and follow-up plan"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Red Flags/Worsening Conditions:</label>
                <textarea
                  style={styles.textArea}
                  value={formData.redFlags_worseningConditions}
                  onChange={(e) => handleInputChange('redFlags_worseningConditions', e.target.value)}
                  placeholder="Warning signs to watch for"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Family Involvement Preference:</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.familyInvolvementPreference}
                  onChange={(e) => handleInputChange('familyInvolvementPreference', e.target.value)}
                  placeholder="How family should be involved in care"
                />
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button
                style={styles.button}
                onClick={handleSubmit}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating Patient...' : 'Generate Patient'}
              </button>
              <button
                style={styles.randomButton}
                onClick={handleGenerateRandom}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Random Patient'}
              </button>
            </div>

            {successMessage && <p style={styles.successMessage}>{successMessage}</p>}
          </div>
        </div>

        {/* Result Section */}
        <div style={styles.resultSection}>
          {generatedPatient ? (
            <div style={styles.patientCard}>
              <h3 style={styles.cardTitle}>Generated Patient</h3>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Name:</span>
                {generatedPatient.name}
              </div>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Age:</span>
                {generatedPatient.age}
              </div>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Gender:</span>
                {generatedPatient.genderIdentity} ({generatedPatient.pronouns})
              </div>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Main Complaint:</span>
                {generatedPatient.mainComplaint}
              </div>
              {generatedPatient.secondaryComplaint && (
                <div style={styles.cardField}>
                  <span style={styles.cardLabel}>Secondary Complaint:</span>
                  {generatedPatient.secondaryComplaint}
                </div>
              )}
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Language:</span>
                {generatedPatient.nativeLanguage} ({generatedPatient.englishProficiency} English)
              </div>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Cultural Background:</span>
                {generatedPatient.culturalBackground}
              </div>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Diagnosis:</span>
                {generatedPatient.correctDiagnosis}
              </div>
              <div style={styles.cardField}>
                <span style={styles.cardLabel}>Persona:</span>
                {generatedPatient.patientPersona}
              </div>
              
              <button 
                style={styles.downloadButton} 
                onClick={downloadPatientJson}
              >
                Download JSON
              </button>
              
              <p style={{...styles.loadingMessage, fontSize: '0.8em', marginTop: '15px'}}>
                This patient has been saved locally and will appear as "User: {generatedPatient.name}" in the simulation page dropdown.
              </p>
            </div>
          ) : (
            <div style={styles.patientCard}>
              <h3 style={styles.cardTitle}>Generated Patient Preview</h3>
              <p style={styles.loadingMessage}>
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