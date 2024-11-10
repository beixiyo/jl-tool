import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'


export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      clean: true,
      enabled: false,
      reporter: ['html'],
      reportsDirectory: './coverage',
      include: ['../src/**/*'],
    },
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      '@deb': fileURLToPath(new URL('../dist/index.js', import.meta.url))
    },
  }
})