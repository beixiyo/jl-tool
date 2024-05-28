import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'


const src = fileURLToPath(new URL('../src', import.meta.url))

export default defineConfig({
    test: {
        alias: {
            '@': src,
        },
        coverage: {
            provider: 'v8',
            clean: true,
            enabled: true,
            reporter: ['html'],
            reportsDirectory: './coverage',
            include: ['../src/**/*'],
        },
        environment: 'jsdom'
    },
    resolve: {
        alias: {
            '@deb': src,
            '@': src,
        },
    }
})