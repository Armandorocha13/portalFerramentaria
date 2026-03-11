import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/testes/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            exclude: ['src/main.tsx', 'src/App.tsx', 'src/env.d.ts', '**/*.d.ts']
        },
    },
});
