// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dtsPlugin from 'vite-plugin-dts'

export default defineConfig({
    plugins: [react(), dtsPlugin({ include: ["src"], insertTypesEntry: true })],
    // resolve: {
    //     alias: {
    //         Optional: Create convenient aliases for your folders
            // '@assets': path.resolve(__dirname, 'src/assets'),
            // '@components': path.resolve(__dirname, 'src/components'),
            // '@utils': path.resolve(__dirname, 'src/utils'),
            // '@style': path.resolve(__dirname, 'style')
        // }
    // },
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
})
