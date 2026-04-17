// src/hooks/useSessionState.js
import { useState, useEffect } from 'react';

export default function useSessionState(key, defaultValue, parse = JSON.parse, stringify = JSON.stringify) {
  const [state, setState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, stringify(state));
    } catch { /* quota exceeded — silently ignore */ }
  }, [key, state, stringify]);
  return [state, setState];
}