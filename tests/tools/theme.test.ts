import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCurTheme, onChangeTheme } from '@/tools/theme'

describe('theme tools', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('不支持 matchMedia 时应该返回默认主题并提供空清理函数', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(getCurTheme('dark')).toBe('dark')
    expect(() => onChangeTheme()).not.toThrow()
  })

  it('应该读取当前主题并在清理后停止监听', () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | undefined
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
        changeHandler = handler
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))
    const onDark = vi.fn()
    const onLight = vi.fn()

    expect(getCurTheme()).toBe('dark')
    const cleanup = onChangeTheme(onLight, onDark)
    changeHandler?.({ matches: false } as MediaQueryListEvent)
    expect(onLight).toHaveBeenCalledTimes(1)
    expect(onDark).not.toHaveBeenCalled()

    cleanup()
    expect(mediaQuery.removeEventListener).toHaveBeenCalledTimes(1)
  })
})
