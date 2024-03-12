import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            input: 'dist/assets/index-DTCCDpOj.js',
            output: {
                entryFileNames: 'index.js',
            },
        },
    },
    plugins: [react()],
});
