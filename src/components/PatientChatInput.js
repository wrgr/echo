import React from 'react'
import { COMMUNICATION_PHASES } from '../utils/patientConstants'

export default function PatientChatInput({
  userMessage,
  setUserMessage,
  handleSendMessage,
  currentPhase,
  handleNextPhase,
  isLoading,
  isActive
}) {
  return (
    <div className="phase-interaction-box">
      <div className="communication-tips">
        <strong>Tips:</strong> {COMMUNICATION_PHASES[currentPhase].tips}
      </div>

      <textarea
        className="message-input"
        rows="3"
        placeholder={COMMUNICATION_PHASES[currentPhase].placeholder}
        value={userMessage}
        onChange={e => setUserMessage(e.target.value)}
        disabled={!isActive || isLoading}
      />

      <div className="input-controls">
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!userMessage.trim() || isLoading}
        >
          {isLoading ? 'Sending…' : 'Send Message'}
        </button>
        {COMMUNICATION_PHASES[currentPhase].canAdvance && (
          <button
            className="next-phase-button"
            onClick={handleNextPhase}
            disabled={isLoading}
          >
            Next Phase →
          </button>
        )}
      </div>
    </div>
  )
}
