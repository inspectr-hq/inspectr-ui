import { loader } from '@monaco-editor/react';

let didConfigureMonaco = false;

const ensureVscodeFileRoot = () => {
  if (typeof globalThis._VSCODE_FILE_ROOT === 'string' && globalThis._VSCODE_FILE_ROOT.length) {
    return;
  }

  // Monaco's ESM runtime uses this global when it cannot resolve AMD toUrl().
  globalThis._VSCODE_FILE_ROOT = new URL('./', import.meta.url).toString();
};

const configureMonaco = async () => {
  if (didConfigureMonaco) return;
  if (typeof window === 'undefined') return;

  ensureVscodeFileRoot();

  const monacoModule = await import('monaco-editor');
  const monaco = monacoModule.default ?? monacoModule;
  loader.config({ monaco });
  didConfigureMonaco = true;
};

configureMonaco().catch((error) => {
  console.warn('[inspectr-ui] Failed to configure Monaco loader.', error);
});
