import { useState, useEffect, useRef } from 'react';

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
  const { resetOnReload = false } = options;
  const valueRef = useRef();

  const readValue = () => {
    if (typeof window === 'undefined') return defaultValue;

    const storedValue = sessionStorage.getItem(key);
    return parseValue(storedValue, defaultValue);
  };

  const [value, setValue] = useState(readValue);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!resetOnReload || typeof window === 'undefined') return undefined;

    const handleBeforeUnload = () => {
      sessionStorage.removeItem(key);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [key, resetOnReload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e) => {
      if (e.key && e.key !== key) return;
      const storedValue = sessionStorage.getItem(key);
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
  }, [key, defaultValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const serialized = serializeValue(value);
    const existing = sessionStorage.getItem(key);

    if (serialized === null) {
      if (existing === null) return;
      sessionStorage.removeItem(key);
    } else {
      if (existing === serialized) return;
      sessionStorage.setItem(key, serialized);
    }

    window.dispatchEvent(
      new CustomEvent('session-storage', {
        detail: { key, value }
      })
    );
  }, [key, value]);

  return [value, setValue];
}
