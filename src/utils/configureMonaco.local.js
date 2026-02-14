import { loader } from '@monaco-editor/react';

let didConfigureMonaco = false;

const configureMonaco = async () => {
  if (didConfigureMonaco) return;
  if (typeof window === 'undefined') return;

  const monacoModule = await import('monaco-editor');
  const monaco = monacoModule.default ?? monacoModule;
  loader.config({ monaco });
  didConfigureMonaco = true;
};

configureMonaco().catch((error) => {
  console.warn('[inspectr-ui] Failed to configure Monaco loader.', error);
});
