import { describe, expect, it } from 'vitest'
import { genTimeFunc, timeFunc } from '@/animation/timeFunc'

describe('timeFunc', () => {
  describe('基础缓动函数', () => {
    it('linear 应该是线性函数', () => {
      expect(timeFunc.linear(0)).toBe(0)
      expect(timeFunc.linear(0.5)).toBe(0.5)
      expect(timeFunc.linear(1)).toBe(1)
    })

    it('ease 应该是平滑的缓动函数', () => {
      expect(timeFunc.ease(0)).toBe(0)
      expect(timeFunc.ease(1)).toBe(1)
      expect(timeFunc.ease(0.5)).toBeCloseTo(0.5, 3)
    })

    it('easeIn 应该是加速函数', () => {
      expect(timeFunc.easeIn(0)).toBe(0)
      expect(timeFunc.easeIn(1)).toBe(1)
      expect(timeFunc.easeIn(0.5)).toBe(0.25) // 0.5 * 0.5
    })

    it('easeOut 应该是减速函数', () => {
      expect(timeFunc.easeOut(0)).toBe(0)
      expect(timeFunc.easeOut(1)).toBe(1)
      expect(timeFunc.easeOut(0.5)).toBe(0.75) // 1 - (1-0.5)^2
    })

    it('easeInOut 应该是先加速后减速', () => {
      expect(timeFunc.easeInOut(0)).toBe(0)
      expect(timeFunc.easeInOut(1)).toBe(1)
      expect(timeFunc.easeInOut(0.5)).toBe(0.5)
    })
  })

  describe('二次缓动函数', () => {
    it('quadraticIn', () => {
      expect(timeFunc.quadraticIn(0)).toBe(0)
      expect(timeFunc.quadraticIn(0.5)).toBe(0.25)
      expect(timeFunc.quadraticIn(1)).toBe(1)
    })

    it('quadraticOut', () => {
      expect(timeFunc.quadraticOut(0)).toBe(0)
      expect(timeFunc.quadraticOut(0.5)).toBe(0.75)
      expect(timeFunc.quadraticOut(1)).toBe(1)
    })

    it('quadraticInOut', () => {
      expect(timeFunc.quadraticInOut(0)).toBe(0)
      expect(timeFunc.quadraticInOut(0.5)).toBe(0.5)
      expect(timeFunc.quadraticInOut(1)).toBe(1)
    })
  })

  describe('三次缓动函数', () => {
    it('cubicIn', () => {
      expect(timeFunc.cubicIn(0)).toBe(0)
      expect(timeFunc.cubicIn(0.5)).toBe(0.125)
      expect(timeFunc.cubicIn(1)).toBe(1)
    })

    it('cubicOut', () => {
      expect(timeFunc.cubicOut(0)).toBe(0)
      expect(timeFunc.cubicOut(0.5)).toBe(0.875)
      expect(timeFunc.cubicOut(1)).toBe(1)
    })

    it('cubicInOut', () => {
      expect(timeFunc.cubicInOut(0)).toBe(0)
      expect(timeFunc.cubicInOut(0.5)).toBe(0.5)
      expect(timeFunc.cubicInOut(1)).toBe(1)
    })
  })

  describe('特殊缓动函数', () => {
    it('bounceOut', () => {
      expect(timeFunc.bounceOut(0)).toBe(0)
      expect(timeFunc.bounceOut(1)).toBe(1)
      /** 弹跳函数在中间值应该有特定的行为 */
      const midValue = timeFunc.bounceOut(0.5)
      expect(midValue).toBeGreaterThan(0)
      expect(midValue).toBeLessThan(1)
    })

    it('elasticOut', () => {
      expect(timeFunc.elasticOut(0)).toBe(0)
      expect(timeFunc.elasticOut(1)).toBe(1)
    })
  })
})

describe('genTimeFunc', () => {
  it('应该返回默认的 linear 函数', () => {
    const fn = genTimeFunc()
    expect(fn(0.5)).toBe(0.5)
  })

  it('应该返回指定的缓动函数', () => {
    const fn = genTimeFunc('easeIn')
    expect(fn(0.5)).toBe(0.25)
  })

  it('应该直接返回自定义函数', () => {
    const customFn = (t: number) => t * 2
    const fn = genTimeFunc(customFn)
    expect(fn(0.5)).toBe(1)
  })

  it('应该处理无效的缓动函数名', () => {
    const fn = genTimeFunc('invalid' as any)
    expect(fn).toBeUndefined() // 无效的缓动函数名返回 undefined
  })
})
