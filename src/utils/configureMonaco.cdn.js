import { loader } from '@monaco-editor/react';

let didConfigureMonaco = false;
const DEFAULT_CDN_VS_PATH = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

const configureMonaco = () => {
  if (didConfigureMonaco) return;
  if (typeof window === 'undefined') return;

  loader.config({
    paths: {
      vs: import.meta.env.VITE_MONACO_CDN_VS_PATH || DEFAULT_CDN_VS_PATH
    }
  });

  didConfigureMonaco = true;
};

Promise.resolve()
  .then(configureMonaco)
  .catch((error) => {
    console.warn('[inspectr-ui] Failed to configure Monaco loader.', error);
  });
