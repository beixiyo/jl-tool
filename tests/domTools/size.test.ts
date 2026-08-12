import { afterEach, describe, expect, it, vi } from 'vitest'
import { getWinHeight, getWinWidth } from '@/domTools/size'

describe('viewport size', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该优先返回窗口尺寸', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1280)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(720)

    expect(getWinWidth()).toBe(1280)
    expect(getWinHeight()).toBe(720)
  })

  it('窗口尺寸为 0 时应该回退到 document 尺寸', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(0)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(0)
    Object.defineProperties(document.documentElement, {
      clientWidth: { configurable: true, value: 1024 },
      clientHeight: { configurable: true, value: 600 },
    })

    expect(getWinWidth()).toBe(1024)
    expect(getWinHeight()).toBe(600)
  })
})
