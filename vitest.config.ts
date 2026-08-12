import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      clean: true,
      enabled: false,
      reporter: ['html'],
      reportsDirectory: './coverage',
      include: ['src/**/*'],
    },
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#': fileURLToPath(new URL('./node', import.meta.url)),
    },
  },
})
