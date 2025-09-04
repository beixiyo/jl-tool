import { vi } from 'vitest'

// Mock requestAnimationFrame and cancelAnimationFrame for Node.js environment
globalThis.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(performance.now()), 16) as any
})

globalThis.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id)
})
