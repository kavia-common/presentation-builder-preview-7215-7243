import { useCallback, useEffect, useState } from "react";

/**
 * Safe JSON parse helper.
 * @param {string|null} raw
 * @param {any} fallback
 */
function safeParseJson(raw, fallback) {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return fallback;
  }
}

/**
 * PUBLIC_INTERFACE
 */
export default function useLocalStorageState(key, defaultValue) {
  /** React state synced to localStorage (best-effort, never throws). */
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return safeParseJson(raw, defaultValue);
    } catch (_e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_e) {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(defaultValue), [defaultValue]);

  return [value, setValue, reset];
}
