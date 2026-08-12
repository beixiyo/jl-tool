import { describe, expect, it } from 'vitest'
import { mapRange } from '@/math/mapRange'

describe('mapRange', () => {
  it('应该正确映射值范围', () => {
    expect(mapRange(0, { input: [0, 100], output: [0, 1] })).toBe(0)
    expect(mapRange(50, { input: [0, 100], output: [0, 1] })).toBe(1) // 默认四舍五入
    expect(mapRange(100, { input: [0, 100], output: [0, 1] })).toBe(1)
  })

  it('应该支持不同的输入和输出范围', () => {
    expect(mapRange(10, { input: [10, 20], output: [100, 200] })).toBe(100)
    expect(mapRange(15, { input: [10, 20], output: [100, 200] })).toBe(150)
    expect(mapRange(20, { input: [10, 20], output: [100, 200] })).toBe(200)
  })

  it('应该支持负值范围', () => {
    expect(mapRange(-10, { input: [-10, 10], output: [-1, 1] })).toBe(-1)
    expect(mapRange(0, { input: [-10, 10], output: [-1, 1] })).toBe(0)
    expect(mapRange(10, { input: [-10, 10], output: [-1, 1] })).toBe(1)
  })

  it('应该处理超出范围的值', () => {
    expect(mapRange(-10, { input: [0, 100], output: [0, 1] })).toBe(0) // 小于起始值
    expect(mapRange(150, { input: [0, 100], output: [0, 1] })).toBe(1) // 大于结束值
  })

  it('应该处理相同的起始和结束值', () => {
    expect(() => mapRange(50, { input: [50, 50], output: [0, 1] })).toThrow('Input range cannot be zero')
  })

  it('应该处理浮点数', () => {
    expect(mapRange(33.333, { input: [0, 100], output: [0, 1] })).toBe(0) // 默认四舍五入
    expect(mapRange(66.666, { input: [0, 100], output: [0, 1] })).toBe(1) // 默认四舍五入
  })

  it('应该处理反向映射', () => {
    expect(mapRange(0, { input: [0, 1], output: [100, 0] })).toBe(100) // 反向映射
    expect(mapRange(0.5, { input: [0, 1], output: [100, 0] })).toBe(50)
    expect(mapRange(1, { input: [0, 1], output: [100, 0] })).toBe(0)
  })

  it('应该处理零范围输出', () => {
    expect(mapRange(50, { input: [0, 100], output: [10, 10] })).toBe(10) // 输出范围为零
  })

  it('应该支持精度选项', () => {
    expect(mapRange(33.333, { input: [0, 100], output: [0, 1] }, { precise: true, decimals: 3 })).toBeCloseTo(0.333, 3)
  })

  it('应该支持不限制范围', () => {
    expect(mapRange(150, { input: [0, 100], output: [0, 1] }, { clamp: false })).toBe(2) // 默认四舍五入
  })
})
