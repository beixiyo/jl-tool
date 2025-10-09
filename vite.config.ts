import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

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
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#': fileURLToPath(new URL('./node', import.meta.url)),
    },
  },
  // index.html 入口文件
  root: fileURLToPath(new URL('./test', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),

  server: {
    host: '::',
  },
})
