import { loader } from '@monaco-editor/react';

let didConfigureMonaco = false;
const DEFAULT_CDN_VS_PATH = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

const getVscodeFileRoot = () => {
  const baseUrl = typeof import.meta.env.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/';

  // Prefer the app base when Vite exposes one; otherwise fall back to the site root.
  // Using the current page URL is fragile because client-side navigation can move
  // Monaco's inferred root to a nested route.
  if (baseUrl && baseUrl !== './') {
    return new URL(baseUrl, window.location.origin).toString();
  }

  return new URL('/', window.location.origin).toString();
};

const ensureVscodeFileRoot = () => {
  if (typeof globalThis._VSCODE_FILE_ROOT === 'string' && globalThis._VSCODE_FILE_ROOT.length) {
    return;
  }

  // Keep Monaco ESM module resolution stable if AMD loader context is unavailable.
  globalThis._VSCODE_FILE_ROOT = getVscodeFileRoot();
};

const configureMonaco = () => {
  if (didConfigureMonaco) return;
  if (typeof window === 'undefined') return;

  ensureVscodeFileRoot();

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
