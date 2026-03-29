import { useEffect, useMemo, useState } from 'react';

export default function useStorageAdapter(key, defaultValue, adapter) {
  const stableAdapter = useMemo(() => adapter, [adapter]);

  const [value, setValue] = useState(() => {
    if (!stableAdapter || typeof stableAdapter.get !== 'function') {
      return defaultValue;
    }
    const stored = stableAdapter.get(key);
    return stored !== null ? stored : defaultValue;
  });

  useEffect(() => {
    if (!stableAdapter || typeof stableAdapter.get !== 'function') return;
    const stored = stableAdapter.get(key);
    setValue(stored !== null ? stored : defaultValue);
  }, [stableAdapter, key, defaultValue]);

  useEffect(() => {
    if (!stableAdapter || typeof stableAdapter.subscribe !== 'function') return;
    return stableAdapter.subscribe(key, (nextValue) => {
      setValue(nextValue !== null ? nextValue : defaultValue);
    });
  }, [stableAdapter, key, defaultValue]);

  useEffect(() => {
    if (!stableAdapter) return;
    if (value === undefined || value === null) {
      stableAdapter.remove?.(key);
      return;
    }
    stableAdapter.set?.(key, value);
  }, [stableAdapter, key, value]);

  return [value, setValue];
}
