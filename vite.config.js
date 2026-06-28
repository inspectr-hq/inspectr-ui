// vite.config.js
import { defineConfig, loadEnv, esmExternalRequirePlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const monacoSource = String(env.VITE_MONACO_SOURCE || 'local').trim().toLowerCase();
  const monacoConfigEntry =
    monacoSource === 'cdn'
      ? path.resolve(__dirname, 'src/utils/configureMonaco.cdn.js')
      : path.resolve(__dirname, 'src/utils/configureMonaco.local.js');

  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@monaco-config': monacoConfigEntry
      }
    },
    build: {
      cssMinify: 'esbuild',
      lib: {
        // Entry point of your library (should export all components/utilities)
        entry: path.resolve(__dirname, 'src/index.jsx'),
        // The exposed global name (for UMD builds)
        name: 'InspectrUI',
        // File name pattern for different module formats
        fileName: (format) => `inspectr-ui.${format}.js`,
        // Formats to output (ES module and UMD are common)
        formats: ['es', 'umd'],
        // minify: false,
        // sourcemap: true,
      },
      rollupOptions: {
        // Externalize peer dependencies (react, react-dom) so consumers provide them.
        //
        // Vite 8 uses Rolldown, which by default preserves `require('react')` calls
        // made by bundled CJS deps (use-sync-external-store, react-is, ...). Those
        // become a `__require` runtime shim that throws in the browser. The builtin
        // esmExternalRequirePlugin rewrites those external `require()` calls into ESM
        // imports AND handles externalizing the listed modules — so we must NOT also
        // list them in the top-level `external`, or Rolldown externalizes them via its
        // shim path before the plugin can convert them.
        plugins: [esmExternalRequirePlugin({ external: ['react', 'react-dom'] })],
        output: {
          exports: 'named',
          globals: {
            // Provide global variable names for UMD builds.
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }
    },
  };
});
