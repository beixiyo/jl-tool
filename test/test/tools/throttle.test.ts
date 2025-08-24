import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, throttle } from '@/tools/timer'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该限制函数调用频率', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    /** 连续调用 */
    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledTimes(1)

    /** 前进时间 */
    vi.advanceTimersByTime(100)
    throttled()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('应该传递参数给原函数', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('test', 123)

    expect(fn).toHaveBeenCalledWith('test', 123)
  })

  it('应该返回原函数的返回值', () => {
    const fn = vi.fn(() => 'result')
    const throttled = throttle(fn, 100)

    const result = throttled()

    expect(result).toBe('result')
  })

  it('应该处理 makeSureNotToMissTask 选项', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100, { makeSureNotToMissTask: true })

    /** 第一次调用 */
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    /** 在延迟期间多次调用 */
    throttled()
    throttled()
    throttled()

    /** 前进时间，应该执行最后一次调用 */
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('应该处理上下文', () => {
    const context = { value: 42 }
    const fn = vi.fn(function (this: any) {
      expect(this).toBe(context)
    })
    const throttled = throttle(fn, 100)

    throttled.call(context)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该延迟函数执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该重置延迟时间', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50) // 还没到时间
    debounced() // 重置延迟
    vi.advanceTimersByTime(50) // 还没到时间
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50) // 现在应该执行
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该传递参数给原函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('test', 123)
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('test', 123)
  })

  it('应该返回原函数的返回值', () => {
    const fn = vi.fn(() => 'result')
    const debounced = debounce(fn, 100)

    const result = debounced()
    vi.advanceTimersByTime(100)

    expect(result).toBeUndefined()
  })

  it('应该处理上下文', () => {
    const context = { value: 42 }
    const fn = vi.fn(function (this: any) {
      expect(this).toBe(context)
    })
    const debounced = debounce(fn, 100)

    debounced.call(context)
    vi.advanceTimersByTime(100)
  })

  it('应该处理多次调用', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
