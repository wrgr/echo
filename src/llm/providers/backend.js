/**
 * Shared-backend provider — the original Firebase Cloud Function.
 *
 * This preserves the pre-modernization behavior as one selectable option: no
 * key required, server-side Gemini + server-side orchestration. The wire format
 * is exactly what the function already expects, so nothing changes server-side.
 */

// Self-hosters can override the shared endpoint at build time via
// VITE_ECHO_BACKEND_URL; the in-app Settings field overrides it at runtime.
const DEFAULT_BACKEND_URL =
  (import.meta.env && import.meta.env.VITE_ECHO_BACKEND_URL) ||
  'https://us-central1-echo-d825e.cloudfunctions.net/echoSimulator';

async function post(url, payload) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(`Could not reach the shared backend: ${err.message}`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Backend error (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export function createBackendProvider({ backendUrl } = {}) {
  const url = backendUrl || DEFAULT_BACKEND_URL;

  return {
    interact({ actionType, latestInput, patientState, conversationHistory, encounterState }) {
      return post(url, {
        action: 'interact_conversation',
        actionType,
        latestInput,
        patientState,
        conversationHistory,
        encounterState,
      });
    },

    async helpAdvice({ patientInfo, providerPerception, question }) {
      const data = await post(url, { action: 'get_help_advice', patientInfo, providerPerception, question });
      return data.advice;
    },

    async generatePatient() {
      const data = await post(url, { action: 'generate_patient' });
      return data.patient;
    },

    async generatePatientFromForm(formData) {
      const data = await post(url, { action: 'generate_patient_from_form', formData });
      return data.patient;
    },

    async populateFields({ description, existingData }) {
      const data = await post(url, { action: 'ai_populate_fields', description, existingData });
      return data.populatedFields;
    },
  };
}
