import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx,mjs}'],
    exclude: ['dist/**', 'node_modules/**', 'e2e/**', 'playwright.config.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        '**/*.{test,spec}.{ts,tsx,mjs}',
        'src/main.tsx',
        'src/App.tsx',
        'src/pages/**',
        'src/config/site.ts',
        'shared/siteMeta.ts',
        'e2e/**',
      ],
      reporter: ['text', 'text-summary'],
      // A couple of points below current actuals, so a small untested CLI
      // helper doesn't block CI while an untested module still does.
      thresholds: {
        statements: 92,
        branches: 84,
        functions: 94,
        lines: 95,
      },
    },
  },
})
