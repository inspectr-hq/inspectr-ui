import { useEffect } from 'react';
import useInspectrStorage from './useInspectrStorage.jsx';

export default function useFeaturePreview(slug, defaultEnabled = false, removeWhenFalse = true) {
  const [value, setValue] = useInspectrStorage(
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
