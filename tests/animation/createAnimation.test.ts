import { describe, expect, it } from 'vitest'
import { createAnimation } from '@/animation/createAnimation'

describe('createAnimation', () => {
  it('应该创建基本的动画函数', () => {
    const animationFn = createAnimation(0, 100, 0, 1)

    expect(typeof animationFn).toBe('function')
  })

  it('应该正确映射值范围', () => {
    const animationFn = createAnimation(0, 100, 0, 1)

    expect(animationFn(0)).toBe(0)
    expect(animationFn(50)).toBe(0.5)
    expect(animationFn(100)).toBe(1)
  })

  it('应该处理超出范围的值', () => {
    const animationFn = createAnimation(0, 100, 0, 1)

    expect(animationFn(-10)).toBe(0) // 小于起始值
    expect(animationFn(150)).toBe(1) // 大于结束值
  })

  it('应该支持不同的输入和输出范围', () => {
    const animationFn = createAnimation(10, 20, 100, 200)

    expect(animationFn(10)).toBe(100)
    expect(animationFn(15)).toBe(150)
    expect(animationFn(20)).toBe(200)
  })

  it('应该支持负值范围', () => {
    const animationFn = createAnimation(-10, 10, -1, 1)

    expect(animationFn(-10)).toBe(-1)
    expect(animationFn(0)).toBe(0)
    expect(animationFn(10)).toBe(1)
  })

  it('应该支持自定义缓动函数', () => {
    const easeIn = (t: number) => t * t
    const animationFn = createAnimation(0, 100, 0, 1, easeIn)

    expect(animationFn(50)).toBe(0.25) // 0.5 * 0.5 = 0.25
  })

  it('应该处理相同的起始和结束值', () => {
    const animationFn = createAnimation(50, 50, 0, 1)

    /** 当起始和结束值相同时，会导致除零错误，返回 NaN */
    expect(animationFn(50)).toBeNaN()
    expect(animationFn(0)).toBe(0) // 小于起始值，返回起始输出值
    expect(animationFn(100)).toBe(1) // 大于结束值，返回结束输出值
  })

  it('应该处理相同的输出起始和结束值', () => {
    const animationFn = createAnimation(0, 100, 50, 50)

    /** 当输出起始和结束值相同时，应该返回该值 */
    expect(animationFn(0)).toBe(50)
    expect(animationFn(50)).toBe(50)
    expect(animationFn(100)).toBe(50)
  })

  it('应该处理浮点数精度', () => {
    const animationFn = createAnimation(0, 100, 0, 1)

    const result = animationFn(33.333)
    expect(result).toBeCloseTo(0.333, 3)
  })
})
