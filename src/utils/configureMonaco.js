import { loader } from '@monaco-editor/react';

let didConfigureMonaco = false;

const getMonacoModule = async () => {
  const monacoModule = await import('monaco-editor');
  return monacoModule.default ?? monacoModule;
};

const configureMonaco = async () => {
  if (didConfigureMonaco) return;
  if (typeof window === 'undefined') return;

  const monaco = await getMonacoModule();
  loader.config({ monaco });
  didConfigureMonaco = true;
};

configureMonaco().catch((error) => {
  console.warn('[inspectr-ui] Failed to configure Monaco loader.', error);
});
