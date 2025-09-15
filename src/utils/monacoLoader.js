// src/utils/monacoLoader.js
// SSR-safe Monaco loader configuration.
// Only runs in the browser to avoid "window is not defined" during SSR/SSG builds.

if (typeof window !== 'undefined') {
  // Defer imports to runtime so SSR never evaluates monaco or the loader.
  // No top-level await to keep bundlers happy; chain promises instead.
  import('@monaco-editor/react')
    .then(({ loader }) =>
      import('monaco-editor').then((monaco) => {
        loader.config({ monaco });
      })
    )
    .catch(() => {
      // Swallow errors silently; editor components can still lazy-load their own monaco.
    });
}
