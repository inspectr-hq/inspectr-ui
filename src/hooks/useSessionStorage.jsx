import { useState, useEffect, useMemo, useRef } from 'react';

function parseValue(storedValue, defaultValue) {
  if (storedValue === null) return defaultValue;
  try {
    return JSON.parse(storedValue);
  } catch (error) {
    return storedValue;
  }
}

function serializeValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

export default function useSessionStorage(key, defaultValue, options = {}) {
  const { resetOnReload = false, keyPrefix = '' } = options;
  const valueRef = useRef();
  const resolvedKey = useMemo(() => `${keyPrefix}${key}`, [keyPrefix, key]);

  const readValue = () => {
    if (typeof window === 'undefined') return defaultValue;

    const storedValue = sessionStorage.getItem(resolvedKey);
    return parseValue(storedValue, defaultValue);
  };

  const [value, setValue] = useState(readValue);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!resetOnReload || typeof window === 'undefined') return undefined;

    const handleBeforeUnload = () => {
      sessionStorage.removeItem(resolvedKey);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [resolvedKey, resetOnReload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e) => {
      const eventKey = e?.key ?? e?.detail?.key;
      if (eventKey && eventKey !== resolvedKey) return;
      const storedValue = sessionStorage.getItem(resolvedKey);
      const newValue = parseValue(storedValue, defaultValue);
      const currentSerialized = serializeValue(valueRef.current);

      if (storedValue === currentSerialized) return;

      setValue(newValue);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('session-storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('session-storage', handleStorage);
    };
  }, [resolvedKey, defaultValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const serialized = serializeValue(value);
    const existing = sessionStorage.getItem(resolvedKey);

    if (serialized === null) {
      if (existing === null) return;
      sessionStorage.removeItem(resolvedKey);
    } else {
      if (existing === serialized) return;
      sessionStorage.setItem(resolvedKey, serialized);
    }

    window.dispatchEvent(
      new CustomEvent('session-storage', {
        detail: { key: resolvedKey, value }
      })
    );
  }, [resolvedKey, value]);

  return [value, setValue];
}
