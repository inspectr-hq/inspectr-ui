import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage.jsx';

export default function useFeaturePreview(slug, defaultEnabled = false, removeWhenFalse = true) {
  const [value, setValue] = useLocalStorage(
    `feature_preview_${slug}`,
    defaultEnabled ? 'true' : undefined
  );

  useEffect(() => {
    if (removeWhenFalse && value === 'false') {
      setValue(undefined);
    }
  }, [removeWhenFalse, value, setValue]);

  const enabled = value === 'true';
  const setEnabled = (v) => {
    if (v) {
      setValue('true');
    } else {
      setValue(removeWhenFalse ? undefined : 'false');
    }
  };

  return [enabled, setEnabled];
}
