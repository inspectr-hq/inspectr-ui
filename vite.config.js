// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const monacoSource = String(env.VITE_MONACO_SOURCE || 'local').trim().toLowerCase();
    const monacoConfigEntry = monacoSource === 'cdn'
        ? path.resolve(__dirname, 'src/utils/configureMonaco.cdn.js')
        : path.resolve(__dirname, 'src/utils/configureMonaco.local.js');

    return {
    plugins: [react()],
    resolve: {
        alias: {
            '@monaco-config': monacoConfigEntry
        }
    },
    build: {
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
            // Externalize peer dependencies to prevent bundling them in your library.
            // Consumers must install these.
            external: ['react', 'react-dom'],
            output: {
                exports: 'named',
                globals: {
                    // Provide global variable names for UMD builds.
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
    };
});
