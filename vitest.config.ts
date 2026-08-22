import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['dist/**', 'node_modules/**', 'e2e/**', 'playwright.config.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        '**/*.{test,spec}.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/pages/**',
        'src/components/**',
        'src/config/site.ts',
        'shared/siteMeta.ts',
        'scripts/**',
        'e2e/**',
      ],
      reporter: ['text', 'text-summary'],
      thresholds: {
        statements: 94,
        branches: 85,
        functions: 98,
        lines: 97,
      },
    },
  },
})
