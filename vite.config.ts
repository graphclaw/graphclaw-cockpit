/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/app/v1': 'http://localhost:8000',
      // Proxy auth API endpoints but NOT /auth/callback — that route belongs to the
      // React Router SPA. Proxying it would send the OTC redirect to the backend
      // which expects provider+state params and returns a validation error.
      '/auth/login': 'http://localhost:8000',
      '/auth/exchange': 'http://localhost:8000',
      '/auth/refresh': 'http://localhost:8000',
      '/auth/logout': 'http://localhost:8000',
      '/auth/me': 'http://localhost:8000',
      '/auth/dev-token': 'http://localhost:8000',
      '/openapi.json': 'http://localhost:8000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    testTimeout: 15000,
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'e2e/**',
        'src/test/**',
        'src/main.tsx',
        'src/lib/api-types.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      // Coverage is reported (and uploaded as a CI artifact) but not gated:
      // the Vitest job's pass/fail is determined by the test suite itself.
      // Coverage gate removed 2026-06-12 — see PR #17 / coverage policy decision.
    },
  },
});
