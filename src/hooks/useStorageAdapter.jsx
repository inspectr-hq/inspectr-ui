import { useCallback, useEffect, useRef, useState } from 'react';

export default function useStorageAdapter(key, defaultValue, adapter) {
  const writeMetaRef = useRef({
    key: null,
    hasStoredValue: false,
    explicitWrite: false
  });

  const [value, setValue] = useState(() => {
    if (!adapter || typeof adapter.get !== 'function') {
      return defaultValue;
    }
    const stored = adapter.get(key);
    writeMetaRef.current = {
      key,
      hasStoredValue: stored !== null,
      explicitWrite: false
    };
    return stored !== null ? stored : defaultValue;
  });

  useEffect(() => {
    if (!adapter || typeof adapter.get !== 'function') return;
    const stored = adapter.get(key);
    writeMetaRef.current = {
      key,
      hasStoredValue: stored !== null,
      explicitWrite: false
    };
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
      writeMetaRef.current.hasStoredValue = false;
      writeMetaRef.current.explicitWrite = false;
      return;
    }

    const shouldSkipDefaultSeed =
      writeMetaRef.current.key === key &&
      !writeMetaRef.current.hasStoredValue &&
      !writeMetaRef.current.explicitWrite &&
      Object.is(value, defaultValue);

    if (shouldSkipDefaultSeed) {
      return;
    }

    adapter.set?.(key, value);
    writeMetaRef.current.hasStoredValue = true;
    writeMetaRef.current.explicitWrite = false;
  }, [adapter, key, value]);

  const setValueWithIntent = useCallback((nextValue) => {
    writeMetaRef.current.explicitWrite = true;
    setValue(nextValue);
  }, []);

  return [value, setValueWithIntent];
}
