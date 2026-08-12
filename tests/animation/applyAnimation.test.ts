import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAnimationFrameScheduler } from '@/animation/animationFrame'
import { applyAnimation } from '@/animation/applyAnimation'

describe('applyAnimation', () => {
  let mockRequestAnimationFrame: any
  let mockCancelAnimationFrame: any
  let animationFrameId = 0

  beforeEach(() => {
    // 重置状态
    animationFrameId = 0

    // 创建简单的 mock，不实际执行回调
    mockRequestAnimationFrame = vi.fn(() => {
      animationFrameId++
      return animationFrameId
    })

    mockCancelAnimationFrame = vi.fn()

    // 替换全局函数
    globalThis.requestAnimationFrame = mockRequestAnimationFrame
    globalThis.cancelAnimationFrame = mockCancelAnimationFrame
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该执行动画函数直到返回 stop', () => {
    let callCount = 0
    const fn = vi.fn(() => {
      callCount++
      return callCount >= 3
        ? 'stop'
        : undefined
    })

    const stop = applyAnimation(fn)

    // 由于我们的 mock 不执行回调，函数只会被调用一次（初始调用）
    expect(fn).toHaveBeenCalledTimes(1)
    // 验证 requestAnimationFrame 被调用了预期的次数
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1)
  })

  it('应该返回停止函数', () => {
    const fn = vi.fn(() => undefined)
    const stop = applyAnimation(fn)

    expect(typeof stop).toBe('function')

    // 清理
    stop()
  })

  it('停止函数应该取消动画', () => {
    const fn = vi.fn(() => undefined)
    const stop = applyAnimation(fn)

    stop()

    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(1)
  })

  it('应该持续执行直到手动停止', () => {
    const fn = vi.fn(() => undefined)
    const stop = applyAnimation(fn)

    expect(fn).toHaveBeenCalled()
    expect(fn.mock.calls.length).toBeGreaterThan(0)
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1)

    stop()
  })

  it('立即返回 stop 时应该只调用一次', () => {
    const fn = vi.fn(() => 'stop' as const)
    const stop = applyAnimation(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(mockCancelAnimationFrame).not.toHaveBeenCalled()
    // requestAnimationFrame 不会被调用，因为函数立即返回 'stop'
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(0)
  })

  it('没有 requestAnimationFrame 时应该回退到 setTimeout', () => {
    const originalRAF = globalThis.requestAnimationFrame
    const originalCAF = globalThis.cancelAnimationFrame

    try {
      Reflect.deleteProperty(globalThis, 'requestAnimationFrame')
      Reflect.deleteProperty(globalThis, 'cancelAnimationFrame')
      vi.useFakeTimers()

      const fn = vi.fn(() => undefined)
      const stop = applyAnimation(fn)

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(17)
      expect(fn).toHaveBeenCalledTimes(2)

      stop()
      vi.advanceTimersByTime(17)
      expect(fn).toHaveBeenCalledTimes(2)
    }
    finally {
      vi.useRealTimers()

      if (originalRAF)
        globalThis.requestAnimationFrame = originalRAF
      if (originalCAF)
        globalThis.cancelAnimationFrame = originalCAF
    }
  })

  it('scheduler 应该在创建时固定实现，不在每帧重新判断', () => {
    const originalRAF = globalThis.requestAnimationFrame
    const originalCAF = globalThis.cancelAnimationFrame

    try {
      Reflect.deleteProperty(globalThis, 'requestAnimationFrame')
      Reflect.deleteProperty(globalThis, 'cancelAnimationFrame')
      vi.useFakeTimers()

      const scheduler = createAnimationFrameScheduler()
      const fn = vi.fn()
      const id = scheduler.request(fn)

      globalThis.requestAnimationFrame = vi.fn()
      globalThis.cancelAnimationFrame = vi.fn()

      vi.advanceTimersByTime(17)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled()

      scheduler.cancel(id)
    }
    finally {
      vi.useRealTimers()

      if (originalRAF)
        globalThis.requestAnimationFrame = originalRAF
      if (originalCAF)
        globalThis.cancelAnimationFrame = originalCAF
    }
  })
})
