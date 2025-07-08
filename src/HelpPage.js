import React, { useState } from 'react';
import styled from '@emotion/styled';
// Removed the 'css' import as it's no longer directly used in this file for styling.

// --- Media Query Constants ---
const mobileBreakpoint = '768px';

// --- Styled Components ---

const HelpContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f8fafc;
  gap: 20px;
  font-family: 'Roboto', sans-serif; /* Ensure font consistency */

  @media (max-width: ${mobileBreakpoint}) {
    padding: 15px;
  }
`;

const Section = styled.div`
  background-color: #ffffff;
  border: 1px solid #dbe1e8;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(21, 48, 74, 0.05);
  display: flex;
  flex-direction: column;
  gap: 15px;

  @media (max-width: ${mobileBreakpoint}) {
    padding: 15px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.4em;
  font-weight: bold;
  color: #15304a;
  margin-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 10px;
  margin-top: 0; /* Remove default h3 top margin */

  @media (max-width: ${mobileBreakpoint}) {
    font-size: 1.2em;
  }
`;

const Label = styled.p`
  font-weight: bold;
  color: #334155;
  margin-bottom: 5px;
  display: block;
  margin-top: 0; /* Remove default p top margin */
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 8px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box; /* Include padding and border in the element's total width and height */

  &:focus {
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2); /* Add focus shadow */
  }
`;

// Input is not used in the current JSX, so it's removed as a styled component.
// const Input = styled.input`
//   width: 100%;
//   padding: 10px;
//   font-size: 1em;
//   border: 1px solid #ccc;
//   border-radius: 8px;
//   font-family: inherit;
//   outline: none;
//   transition: border-color 0.2s;
//   box-sizing: border-box;

//   &:focus {
//     border-color: #0d9488;
//     box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);
//   }
// `;

const Button = styled.button`
  padding: 12px 25px;
  font-size: 1em;
  font-weight: bold;
  background-color: #0d9488;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  align-self: flex-start; /* Align button to the start of the flex container */
  min-width: 180px; /* Ensure button doesn't shrink too much */

  &:hover:not(:disabled) {
    background-color: #0a7a6e;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    opacity: 0.7; /* Slightly reduce opacity when disabled */
  }

  @media (max-width: ${mobileBreakpoint}) {
    width: 100%; /* Make button full width on mobile */
    align-self: center; /* Center button on mobile if needed */
  }
`;

const AdviceBox = styled.div`
  background-color: #eef2f7;
  border: 1px solid #dbe1e8;
  border-radius: 12px;
  padding: 20px;
  margin-top: 0; /* Adjusted margin as it's part of Section gap */
  line-height: 1.6;
  white-space: pre-wrap;
  color: #334155;
  font-size: 1em;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
`;

// LoadingMessage is not used in the current JSX, so it's removed as a styled component.
// const LoadingMessage = styled.p`
//   font-style: italic;
//   color: #64748b;
//   text-align: center;
//   padding: 20px;
//   margin: 0;
// `;

const ErrorMessage = styled.p`
  color: #dc2626;
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
  margin-bottom: 0; /* Remove default p margin */
`;

function HelpPage() {
  const [patientInfo, setPatientInfo] = useState('');
  const [providerPerception, setProviderPerception] = useState('');
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const functionUrl = "https://us-central1-clinical-lep-simulator.cloudfunctions.net/susanSimulator"; // Same function URL

  const handleSubmitAdvice = async () => {
    setError(null);
    setAdvice('');
    setIsLoading(true);

    if (!question.trim()) {
      setError("Please ask a question for SUSAN.");
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
    <HelpContainer>
      <Section>
        <SectionTitle>Ask SUSAN for Advice</SectionTitle>
        <Label>Patient Information (e.g., "50-year-old male, Spanish speaker, main complaint chest pain"):</Label>
        <TextArea
          value={patientInfo}
          onChange={(e) => setPatientInfo(e.target.value)}
          placeholder="Describe the patient (age, language, cultural background, main complaint)..."
        ></TextArea>

        <Label>Your Perception of the Interaction So Far (e.g., "I'm struggling to build rapport", "I think I missed something important"):</Label>
        <TextArea
          value={providerPerception}
          onChange={(e) => setProviderPerception(e.target.value)}
          placeholder="How do you feel the interaction is going? What are your challenges?"
        ></TextArea>

        <Label>Your Question for SUSAN (e.g., "How can I better elicit their concerns?", "What's a good way to introduce an interpreter?"):</Label>
        <TextArea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What specific advice do you need?"
        ></TextArea>

        <Button
          onClick={handleSubmitAdvice}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? 'Getting Advice...' : 'Get Advice from SUSAN'}
        </Button>
        {/* The original 'LoadingMessage' component was meant for a different context (like SimulationPage).
            Here, we use a conditional ternary for the button text, which covers the loading state.
            If a separate loading message needs to be displayed, it would go here. */}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Section>

      {advice && (
        <Section>
          <SectionTitle>SUSAN's Advice</SectionTitle>
          <AdviceBox>
            <p style={{margin: 0}}>{advice}</p> {/* Set margin 0 for the inner <p> to remove default spacing */}
          </AdviceBox>
        </Section>
      )}
    </HelpContainer>
  );
}

export default HelpPage;