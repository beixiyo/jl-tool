import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAnimation } from '@/animation/applyAnimation'

describe('applyAnimation', () => {
  let mockRequestAnimationFrame: any
  let mockCancelAnimationFrame: any
  let animationFrameId = 0

  beforeEach(() => {
    animationFrameId = 0
    mockRequestAnimationFrame = vi.fn((callback) => {
      animationFrameId++
      /** 模拟下一帧调用 */
      setTimeout(() => callback(performance.now()), 16)
      return animationFrameId
    })
    mockCancelAnimationFrame = vi.fn()

    // Mock requestAnimationFrame 和 cancelAnimationFrame
    globalThis.requestAnimationFrame = mockRequestAnimationFrame
    globalThis.cancelAnimationFrame = mockCancelAnimationFrame
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该执行动画函数直到返回 stop', async () => {
    let callCount = 0
    const fn = vi.fn(() => {
      callCount++
      return callCount >= 3
        ? 'stop'
        : undefined
    })

    const stop = applyAnimation(fn)

    /** 等待动画完成 */
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(fn).toHaveBeenCalledTimes(3)
    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(animationFrameId)
  })

  it('应该返回停止函数', () => {
    const fn = vi.fn(() => undefined)
    const stop = applyAnimation(fn)

    expect(typeof stop).toBe('function')
  })

  it('停止函数应该取消动画', async () => {
    const fn = vi.fn(() => undefined)
    const stop = applyAnimation(fn)

    /** 等待一帧 */
    await new Promise(resolve => setTimeout(resolve, 20))

    stop()

    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(animationFrameId)
  })

  it('应该持续执行直到手动停止', async () => {
    const fn = vi.fn(() => undefined)
    const stop = applyAnimation(fn)

    /** 等待几帧 */
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fn).toHaveBeenCalled()
    expect(fn.mock.calls.length).toBeGreaterThan(1)

    stop()
  })

  it('立即返回 stop 时应该只调用一次', async () => {
    const fn = vi.fn(() => 'stop' as const)
    const stop = applyAnimation(fn)

    await new Promise(resolve => setTimeout(resolve, 20))

    expect(fn).toHaveBeenCalledTimes(1)
    expect(mockCancelAnimationFrame).toHaveBeenCalled()
  })
})
