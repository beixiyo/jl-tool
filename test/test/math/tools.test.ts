import { clamp } from '@/math/tools'
import { describe, it, expect } from 'vitest'

describe('clamp', () => {
  it('应该将值限制在最小值和最大值之间', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('应该正确处理最小值大于最大值的情况', () => {
    expect(clamp(5, 10, 0)).toBe(5)
    expect(clamp(-1, 10, 0)).toBe(0)
    expect(clamp(11, 10, 0)).toBe(10)
  })

  it('应该处理等于边界值的情况', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('应该处理浮点数', () => {
    expect(clamp(3.14, 0, 5)).toBe(3.14)
    expect(clamp(-0.5, 0, 5)).toBe(0)
    expect(clamp(5.5, 0, 5)).toBe(5)
  })

  it('应该处理相同的min和max值', () => {
    expect(clamp(5, 10, 10)).toBe(10)
    expect(clamp(15, 10, 10)).toBe(10)
    expect(clamp(5, 10, 10)).toBe(10)
  })
})