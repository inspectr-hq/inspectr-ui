import { useEffect, useState } from 'react';

export default function useStorageAdapter(key, defaultValue, adapter) {
  const [value, setValue] = useState(() => {
    if (!adapter || typeof adapter.get !== 'function') {
      return defaultValue;
    }
    const stored = adapter.get(key);
    return stored !== null ? stored : defaultValue;
  });

  useEffect(() => {
    if (!adapter || typeof adapter.get !== 'function') return;
    const stored = adapter.get(key);
    setValue(stored !== null ? stored : defaultValue);
  }, [adapter, key, defaultValue]);

  useEffect(() => {
    if (!adapter || typeof adapter.subscribe !== 'function') return;
    return adapter.subscribe(key, (nextValue) => {
      setValue(nextValue !== null ? nextValue : defaultValue);
    });
  }, [adapter, key, defaultValue]);

  useEffect(() => {
    if (!adapter) return;
    if (value === undefined || value === null) {
      adapter.remove?.(key);
      return;
    }
    adapter.set?.(key, value);
  }, [adapter, key, value]);

  return [value, setValue];
}
