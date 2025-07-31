import React, { useState } from 'react';

function HelpPage() {
  const [patientInfo, setPatientInfo] = useState('');
  const [providerPerception, setProviderPerception] = useState('');
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/echoSimulator";

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
          action: "get_help_advice",
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
      setAdvice(data.advice);
    } catch (err) {
      console.error("Error getting advice:", err);
      setError(`Failed to get advice: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="help-container">
      <div className="help-section">
        <h3 className="section-title">Ask ECHO for Advice</h3>
        <label className="form-label">Patient Information (e.g., "50-year-old male, Spanish speaker, main complaint chest pain"):</label>
        <textarea
          className="text-area"
          value={patientInfo}
          onChange={(e) => setPatientInfo(e.target.value)}
          placeholder="Describe the patient (age, language, cultural background, main complaint)..."
        ></textarea>

        <label className="form-label">Your Perception of the Interaction So Far (e.g., "I'm struggling to build rapport", "I think I missed something important"):</label>
        <textarea
          className="text-area"
          value={providerPerception}
          onChange={(e) => setProviderPerception(e.target.value)}
          placeholder="How do you feel the interaction is going? What are your challenges?"
        ></textarea>

        <label className="form-label">Your Question for ECHO (e.g., "How can I better elicit their concerns?", "What's a good way to introduce an interpreter?"):</label>
        <textarea
          className="text-area"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What specific advice do you need?"
        ></textarea>

        <button
          className="submit-button"
          onClick={handleSubmitAdvice}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? 'Getting Advice...' : 'Get Advice from ECHO'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>

      {advice && (
        <div className="help-section">
          <h3 className="section-title">ECHO's Advice</h3>
          <div className="advice-box">
            <p>{advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpPage;