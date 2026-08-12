import React, { useState } from 'react';
import { PROVIDERS, getProvider } from './llm';
import { useSettings } from './SettingsContext';

/**
 * BYOK / provider Settings.
 *
 * Lets the user pick an AI provider and (for the direct providers) supply their
 * own API key and model. Everything is stored locally in the browser.
 */
function SettingsPage() {
  const { settings, update } = useSettings();
  const [testState, setTestState] = useState({ status: 'idle', message: '' });

  const selected = PROVIDERS[settings.provider] || PROVIDERS.demo;

  const runTest = async () => {
    setTestState({ status: 'running', message: 'Contacting provider…' });
    try {
      const advice = await getProvider(settings).helpAdvice({
        patientInfo: '',
        providerPerception: '',
        question: 'Reply with the single word: OK.',
      });
      setTestState({
        status: 'ok',
        message: `Success — provider responded (${String(advice).slice(0, 60)}…)`,
      });
    } catch (err) {
      setTestState({ status: 'error', message: err.message });
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>AI Provider Settings</h2>
      <p style={styles.lead}>
        ECHO runs on the AI provider you choose below. Bring your own Anthropic (Claude) or
        Google Gemini key to run everything privately from your browser, use the shared backend,
        or try the offline demo — no key required.
      </p>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Provider</legend>
        {Object.values(PROVIDERS).map((p) => (
          <label key={p.id} style={{
            ...styles.providerCard,
            ...(settings.provider === p.id ? styles.providerCardActive : {}),
          }}>
            <input
              type="radio"
              name="provider"
              value={p.id}
              checked={settings.provider === p.id}
              onChange={() => { update({ provider: p.id }); setTestState({ status: 'idle', message: '' }); }}
              style={{ marginTop: 4 }}
            />
            <span>
              <strong>{p.label}</strong>
              {p.needsKey && <span style={styles.byokTag}>BYOK</span>}
              <br />
              <span style={styles.blurb}>{p.blurb}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {selected.needsKey && (
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>{selected.label} credentials</legend>

          <label style={styles.label}>API key</label>
          <input
            type="password"
            autoComplete="off"
            placeholder="Paste your API key"
            value={settings[selected.keyField] || ''}
            onChange={(e) => update({ [selected.keyField]: e.target.value })}
            style={styles.input}
          />
          <p style={styles.hint}>{selected.keyHint}</p>

          <label style={styles.label}>Model</label>
          <select
            value={settings[selected.modelField] || selected.defaultModel}
            onChange={(e) => update({ [selected.modelField]: e.target.value })}
            style={styles.input}
          >
            {selected.models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={runTest} disabled={testState.status === 'running'} style={styles.btn}>
              {testState.status === 'running' ? 'Testing…' : 'Test connection'}
            </button>
            <button
              type="button"
              onClick={() => update({ [selected.keyField]: '' })}
              style={{ ...styles.btn, ...styles.btnGhost }}
            >
              Clear key
            </button>
          </div>
          {testState.status !== 'idle' && testState.status !== 'running' && (
            <p style={{ ...styles.testMsg, color: testState.status === 'ok' ? '#2f855a' : '#c53030' }}>
              {testState.message}
            </p>
          )}

          <div style={styles.securityNote}>
            <strong>Security:</strong> your key is stored only in this browser (localStorage) and sent
            only to {selected.label}. Because calls go directly from the browser, the key is visible to
            client-side code — use a key scoped/limited on the provider side, and clear it on shared
            devices. Prefer the shared backend or demo if you can't expose a key.
          </div>
        </fieldset>
      )}

      {settings.provider === 'backend' && (
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Shared backend (advanced)</legend>
          <label style={styles.label}>Custom backend URL (optional)</label>
          <input
            type="text"
            placeholder="Leave blank to use the default hosted endpoint"
            value={settings.backendUrl || ''}
            onChange={(e) => update({ backendUrl: e.target.value })}
            style={styles.input}
          />
          <p style={styles.hint}>Point this at your own deployment of the ECHO Cloud Function if you host one.</p>
        </fieldset>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem 3rem' },
  h2: { marginBottom: 8 },
  lead: { color: '#4a5568', marginBottom: 20, lineHeight: 1.5 },
  fieldset: { border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 },
  legend: { fontWeight: 600, padding: '0 8px' },
  providerCard: { display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 10, cursor: 'pointer' },
  providerCardActive: { borderColor: '#3182ce', background: '#ebf8ff' },
  blurb: { color: '#4a5568', fontSize: '0.9em' },
  byokTag: { marginLeft: 8, fontSize: '0.7em', fontWeight: 700, color: '#2b6cb0', background: '#bee3f8', borderRadius: 4, padding: '1px 6px', verticalAlign: 'middle' },
  label: { display: 'block', fontWeight: 600, marginTop: 10, marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0', boxSizing: 'border-box' },
  hint: { color: '#718096', fontSize: '0.85em', marginTop: 4 },
  btn: { padding: '8px 14px', borderRadius: 6, border: 'none', background: '#3182ce', color: 'white', fontWeight: 600, cursor: 'pointer', marginRight: 8 },
  btnGhost: { background: 'transparent', color: '#4a5568', border: '1px solid #cbd5e0' },
  testMsg: { marginTop: 10, fontWeight: 600 },
  securityNote: { marginTop: 14, background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8, padding: 12, fontSize: '0.88em', color: '#744210', lineHeight: 1.5 },
};

export default SettingsPage;
