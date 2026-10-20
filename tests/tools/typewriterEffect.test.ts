import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { typewriterEffect } from '@/tools/typewriterEffect'

describe('typewriterEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T10:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('固定文本按 speed 逐字打出，打完 promise 完成', async () => {
    const frames: string[] = []
    const { promise } = typewriterEffect({ content: 'abc', speed: 10, onUpdate: (t) => frames.push(t) })

    vi.advanceTimersByTime(40)
    await promise

    expect(frames).toEqual(['', 'a', 'ab', 'abc'])
  })

  it('已无字可打（continueFromIndex 到末尾 / 空文本）时不抛错并立即完成', async () => {
    const done = typewriterEffect({ content: 'abc', continueFromIndex: 3 })
    const empty = typewriterEffect({ content: '' })

    await expect(done.promise).resolves.toBeUndefined()
    await expect(empty.promise).resolves.toBeUndefined()
  })

  describe('流式模式', () => {
    it('追上已收到的文本不结束，update 追加后接着打，end 后打完才完成', async () => {
      const frames: string[] = []
      const t = typewriterEffect({ content: '', streaming: true, speed: 10, onUpdate: (x) => frames.push(x) })
      let resolved = false
      t.promise.then(() => resolved = true)

      t.update('ab')
      vi.advanceTimersByTime(100)
      expect(frames.at(-1)).toBe('ab')
      expect(resolved).toBe(false)

      /** 空闲了很久再来新文本，也应该逐字出而不是一次蹦出 */
      t.update('abcd')
      expect(frames.at(-1)).toBe('ab')
      vi.advanceTimersByTime(10)
      expect(frames.at(-1)).toBe('abc')

      t.end()
      await vi.advanceTimersByTimeAsync(10)
      expect(frames.at(-1)).toBe('abcd')
      expect(resolved).toBe(true)
    })

    it('end 之前文本已全部打完，end 后立即完成', async () => {
      const t = typewriterEffect({ content: 'ab', streaming: true, speed: 10 })
      vi.advanceTimersByTime(100)

      t.end()

      await expect(t.promise).resolves.toBeUndefined()
    })

    it('新文本不是旧文本的延续时回退到相同前缀', () => {
      const frames: string[] = []
      const t = typewriterEffect({ content: 'hello', streaming: true, speed: 10, onUpdate: (x) => frames.push(x) })
      vi.advanceTimersByTime(30)
      expect(frames.at(-1)).toBe('hel')

      t.update('help me')

      expect(frames.at(-1)).toBe('hel')
      vi.advanceTimersByTime(10)
      expect(frames.at(-1)).toBe('help')
      t.stop()
    })

    it('到达速度远超打字速度时，落后超过 maxLag 自动跳过，之后继续匀速打', () => {
      const frames: string[] = []
      const text = 'x'.repeat(1000)
      const t = typewriterEffect({ content: '', streaming: true, speed: 10, maxLag: 100, onUpdate: (x) => frames.push(x) })

      t.update(text)

      expect(frames.at(-1)).toHaveLength(900)
      vi.advanceTimersByTime(30)
      expect(frames.at(-1)).toHaveLength(903)
      t.stop()
    })

    it('maxLag 为 Infinity 时不跳过；固定文本不受 maxLag 影响', () => {
      const frames: string[] = []
      const t = typewriterEffect({ content: '', streaming: true, speed: 10, maxLag: Infinity, onUpdate: (x) => frames.push(x) })
      t.update('x'.repeat(1000))
      expect(frames.at(-1)).toHaveLength(0)
      t.stop()

      const fixed: string[] = []
      const f = typewriterEffect({ content: 'y'.repeat(1000), speed: 10, onUpdate: (x) => fixed.push(x) })
      vi.advanceTimersByTime(30)
      expect(fixed.at(-1)).toHaveLength(3)
      f.stop()
    })

    it('flush 立即显示已收到的全部文本并完成', async () => {
      const frames: string[] = []
      const t = typewriterEffect({ content: '', streaming: true, speed: 100, onUpdate: (x) => frames.push(x) })
      t.update('一段很长的回答')

      t.flush()

      expect(frames.at(-1)).toBe('一段很长的回答')
      await expect(t.promise).resolves.toBeUndefined()
    })

    it('stop 之后 update / end / flush 不再回调', () => {
      const onUpdate = vi.fn()
      const t = typewriterEffect({ content: '', streaming: true, onUpdate })
      t.stop()
      onUpdate.mockClear()

      t.update('abc')
      t.end()
      t.flush()
      vi.advanceTimersByTime(100)

      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  it('进度没变化的 tick 不回调 onUpdate', () => {
    const onUpdate = vi.fn()
    const t = typewriterEffect({ content: 'a', streaming: true, speed: 10, onUpdate })

    vi.advanceTimersByTime(100)

    /** 首帧空串 + 打出 'a' 共两次 */
    expect(onUpdate).toHaveBeenCalledTimes(2)
    t.stop()
  })
})
