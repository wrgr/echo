import React, { useState } from 'react';

const styles = {
  helpContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    gap: '20px',
    '@media (max-width: 768px)': {
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
  adviceBox: {
    backgroundColor: '#eef2f7',
    border: '1px solid #dbe1e8',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    color: '#334155',
    fontSize: '1em',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
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
  }
};

function HelpPage() {
  const [patientInfo, setPatientInfo] = useState('');
  const [providerPerception, setProviderPerception] = useState('');
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/echoSimulator"; // Updated function URL

  const handleSubmitAdvice = async () => {
    setError(null);
    setAdvice('');
    setIsLoading(true);

    if (!question.trim()) {
      setError("Please ask a question for ECHO.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "get_help_advice", // New action type for help requests
          patientInfo: patientInfo.trim(),
          providerPerception: providerPerception.trim(),
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      setAdvice(data.advice); // Assuming server returns { advice: "..." }
    } catch (err) {
      console.error("Error getting advice:", err);
      setError(`Failed to get advice: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.helpContainer}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Ask ECHO for Advice</h3>
        <p style={styles.label}>Patient Information (e.g., "50-year-old male, Spanish speaker, main complaint chest pain"):</p>
        <textarea
          style={styles.textArea}
          value={patientInfo}
          onChange={(e) => setPatientInfo(e.target.value)}
          placeholder="Describe the patient (age, language, cultural background, main complaint)..."
        ></textarea>

        <p style={styles.label}>Your Perception of the Interaction So Far (e.g., "I'm struggling to build rapport", "I think I missed something important"):</p>
        <textarea
          style={styles.textArea}
          value={providerPerception}
          onChange={(e) => setProviderPerception(e.target.value)}
          placeholder="How do you feel the interaction is going? What are your challenges?"
        ></textarea>

        <p style={styles.label}>Your Question for ECHO (e.g., "How can I better elicit their concerns?", "What's a good way to introduce an interpreter?"):</p>
        <textarea
          style={styles.textArea}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What specific advice do you need?"
        ></textarea>

        <button
          style={styles.button}
          onClick={handleSubmitAdvice}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? 'Getting Advice...' : 'Get Advice from ECHO'}
        </button>
        {error && <p style={styles.errorMessage}>{error}</p>}
      </div>

      {advice && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>ECHO's Advice</h3>
          <div style={styles.adviceBox}>
            <p>{advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpPage;