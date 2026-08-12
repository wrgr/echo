import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getSettings, saveSettings, isProviderReady } from './llm';

/**
 * Reactive wrapper around the localStorage-backed LLM settings, so header
 * status, the setup banner, and the Settings form all update immediately when
 * the user changes provider or key. The actual provider calls read fresh
 * localStorage on every use (see getProvider), so this context is purely for UI.
 */
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getSettings());

  const update = useCallback((patch) => {
    setSettings(saveSettings(patch));
  }, []);

  const value = useMemo(
    () => ({ settings, update, ready: isProviderReady(settings) }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
