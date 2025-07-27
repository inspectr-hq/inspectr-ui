import { useState, useEffect } from 'react';

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e) => {
      if (e.key && e.key !== key) return;
      const newValue = localStorage.getItem(key);
      setValue(newValue !== null ? newValue : defaultValue);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('local-storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('local-storage', handleStorage);
    };
  }, [key, defaultValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
    window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value } }));
  }, [key, value]);

  return [value, setValue];
}
