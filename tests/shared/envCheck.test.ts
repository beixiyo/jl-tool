import { describe, expect, it, vi } from 'vitest'
import { checkIsBrowser, checkIsNode } from '@/shared/envCheck'

describe('环境能力检测', () => {
  it('jsdom 同时具备 DOM 和 Node.js 能力', () => {
    expect(checkIsBrowser()).toBe(true)
    expect(checkIsNode()).toBe(true)
  })

  it('能力检查通过时不应误发警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    checkIsBrowser(true)
    checkIsNode(true)

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
