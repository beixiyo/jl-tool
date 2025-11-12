import { describe, expect, it } from 'vitest'
import { clamp, formatFileSize } from '@/math/tools'

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

describe('formatFileSize', () => {
  it('应该支持默认单位为 byte', () => {
    const r = formatFileSize({ value: 0 })
    expect(r.byte).toBe(0)
    expect(r.bit).toBe(0)
    expect(r.kb).toBe(0)
  })

  it('应该在 byte 与其他单位之间正确换算', () => {
    const r1 = formatFileSize({ value: 1, unit: 'byte' })
    expect(r1.byte).toBe(1)
    expect(r1.bit).toBe(8)
    expect(r1.kb).toBeCloseTo(1 / 1024)
    expect(r1.mb).toBeCloseTo(1 / Math.pow(1024, 2))

    const r2 = formatFileSize({ value: 1024, unit: 'byte' })
    expect(r2.kb).toBe(1)
    expect(r2.mb).toBeCloseTo(1 / 1024)
  })

  it('应该在 bit 与 byte 之间正确换算', () => {
    const r = formatFileSize({ value: 8, unit: 'bit' })
    expect(r.byte).toBe(1)
    expect(r.bit).toBe(8)
    expect(r.kb).toBeCloseTo(1 / 1024)
  })

  it('应该在 kb / mb / gb / tb 之间正确换算', () => {
    const rkb = formatFileSize({ value: 1, unit: 'kb' })
    expect(rkb.byte).toBe(1024)
    expect(rkb.kb).toBe(1)
    expect(rkb.mb).toBeCloseTo(1 / 1024)

    const rmb = formatFileSize({ value: 1, unit: 'mb' })
    expect(rmb.byte).toBe(1024 * 1024)
    expect(rmb.mb).toBe(1)
    expect(rmb.gb).toBeCloseTo(1 / 1024)

    const rgb = formatFileSize({ value: 2.5, unit: 'gb' })
    expect(rgb.gb).toBe(2.5)
    expect(rgb.mb).toBeCloseTo(2.5 * 1024)
    expect(rgb.tb).toBeCloseTo(2.5 / 1024)

    const rtb = formatFileSize({ value: 1, unit: 'tb' })
    expect(rtb.gb).toBe(1024)
    expect(rtb.mb).toBe(1024 * 1024)
    expect(rtb.byte).toBe(1024 * 1024 * 1024 * 1024)
  })

  it('应该正确处理浮点数输入', () => {
    const r = formatFileSize({ value: 1536.5, unit: 'byte' })
    expect(r.kb).toBeCloseTo(1536.5 / 1024)
  })
})
