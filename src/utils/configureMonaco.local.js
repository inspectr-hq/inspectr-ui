import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

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

  // Vite worker wiring for Monaco when inspectr-ui is consumed from source in another app.
  window.MonacoEnvironment = {
    getWorker(_moduleId, label) {
      if (label === 'json') return new jsonWorker();
      if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
      if (label === 'typescript' || label === 'javascript') return new tsWorker();
      return new editorWorker();
    }
  };

  ensureVscodeFileRoot();

  const monacoModule = await import('monaco-editor');
  const monaco = monacoModule.default ?? monacoModule;
  loader.config({ monaco });
  didConfigureMonaco = true;
};

configureMonaco().catch((error) => {
  console.warn('[inspectr-ui] Failed to configure Monaco loader.', error);
});
