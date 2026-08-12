import { describe, expect, it } from 'vitest'
import { clamp, formatDuration, formatFileSize, numFixed } from '@/math/tools'

it('解决 Number.toFixed 计算错误', () => {
  /** 反面教材 */
  expect(1.335.toFixed(2)).toBe('1.33')
  expect(numFixed(1.335, 2)).toBe(1.34)
})

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

  describe('智能推荐值', () => {
    it('应该为 0 值推荐 byte 单位', () => {
      const r = formatFileSize({ value: 0 })
      expect(r.recommended.value).toBe(0)
      expect(r.recommended.unit).toBe('byte')
    })

    it('应该为小于 1 byte 的值推荐 bit 单位', () => {
      const r = formatFileSize({ value: 4, unit: 'bit' })
      expect(r.recommended.value).toBe(4)
      expect(r.recommended.unit).toBe('bit')
    })

    it('应该为 1-1023 byte 的值推荐 byte 单位', () => {
      const r1 = formatFileSize({ value: 1, unit: 'byte' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('byte')

      const r2 = formatFileSize({ value: 512, unit: 'byte' })
      expect(r2.recommended.value).toBe(512)
      expect(r2.recommended.unit).toBe('byte')

      const r3 = formatFileSize({ value: 1023, unit: 'byte' })
      expect(r3.recommended.value).toBe(1023)
      expect(r3.recommended.unit).toBe('byte')
    })

    it('应该为 1-1023 kb 的值推荐 kb 单位', () => {
      const r1 = formatFileSize({ value: 1, unit: 'kb' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('kb')

      const r2 = formatFileSize({ value: 512, unit: 'kb' })
      expect(r2.recommended.value).toBe(512)
      expect(r2.recommended.unit).toBe('kb')

      const r3 = formatFileSize({ value: 1023, unit: 'kb' })
      expect(r3.recommended.value).toBe(1023)
      expect(r3.recommended.unit).toBe('kb')
    })

    it('应该为 1-1023 mb 的值推荐 mb 单位', () => {
      const r1 = formatFileSize({ value: 1, unit: 'mb' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('mb')

      const r2 = formatFileSize({ value: 1.5, unit: 'mb' })
      expect(r2.recommended.value).toBe(1.5)
      expect(r2.recommended.unit).toBe('mb')

      const r3 = formatFileSize({ value: 512, unit: 'mb' })
      expect(r3.recommended.value).toBe(512)
      expect(r3.recommended.unit).toBe('mb')
    })

    it('应该为 1-1023 gb 的值推荐 gb 单位', () => {
      const r1 = formatFileSize({ value: 1, unit: 'gb' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('gb')

      const r2 = formatFileSize({ value: 1.5, unit: 'gb' })
      expect(r2.recommended.value).toBe(1.5)
      expect(r2.recommended.unit).toBe('gb')

      const r3 = formatFileSize({ value: 512, unit: 'gb' })
      expect(r3.recommended.value).toBe(512)
      expect(r3.recommended.unit).toBe('gb')
    })

    it('应该为大于等于 1 tb 的值推荐 tb 单位', () => {
      const r1 = formatFileSize({ value: 1, unit: 'tb' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('tb')

      const r2 = formatFileSize({ value: 2.5, unit: 'tb' })
      expect(r2.recommended.value).toBe(2.5)
      expect(r2.recommended.unit).toBe('tb')
    })

    it('应该正确转换并推荐合适的单位', () => {
      // 1024 bytes = 1 kb，应该推荐 kb
      const r1 = formatFileSize({ value: 1024, unit: 'byte' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('kb')

      // 1.5 * 1024 * 1024 bytes = 1.5 mb，应该推荐 mb
      const r2 = formatFileSize({ value: 1.5 * 1024 * 1024, unit: 'byte' })
      expect(r2.recommended.value).toBe(1.5)
      expect(r2.recommended.unit).toBe('mb')

      // 1.5 * 1024 * 1024 * 1024 bytes = 1.5 gb，应该推荐 gb
      const r3 = formatFileSize({ value: 1.5 * 1024 * 1024 * 1024, unit: 'byte' })
      expect(r3.recommended.value).toBe(1.5)
      expect(r3.recommended.unit).toBe('gb')

      // 2048 kb = 2 mb，应该推荐 mb
      const r4 = formatFileSize({ value: 2048, unit: 'kb' })
      expect(r4.recommended.value).toBe(2)
      expect(r4.recommended.unit).toBe('mb')
    })

    it('应该处理边界值', () => {
      // 正好 1 kb
      const r1 = formatFileSize({ value: 1024, unit: 'byte' })
      expect(r1.recommended.value).toBe(1)
      expect(r1.recommended.unit).toBe('kb')

      // 正好 1 mb
      const r2 = formatFileSize({ value: 1024, unit: 'kb' })
      expect(r2.recommended.value).toBe(1)
      expect(r2.recommended.unit).toBe('mb')

      // 正好 1 gb
      const r3 = formatFileSize({ value: 1024, unit: 'mb' })
      expect(r3.recommended.value).toBe(1)
      expect(r3.recommended.unit).toBe('gb')

      // 正好 1 tb
      const r4 = formatFileSize({ value: 1024, unit: 'gb' })
      expect(r4.recommended.value).toBe(1)
      expect(r4.recommended.unit).toBe('tb')
    })
  })
})

describe('formatDuration', () => {
  it('应该正确处理0值', () => {
    expect(formatDuration(0)).toBe('00:00')
  })

  it('应该正确处理小于60秒的值', () => {
    expect(formatDuration(30)).toBe('00:30')
    expect(formatDuration(5)).toBe('00:05')
    expect(formatDuration(59)).toBe('00:59')
  })

  it('应该正确处理大于60秒的值', () => {
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(125)).toBe('02:05')
    expect(formatDuration(3661)).toBe('61:01')
  })

  it('应该正确处理带小数的值', () => {
    expect(formatDuration(30.5)).toBe('00:30.5')
    expect(formatDuration(125.5)).toBe('02:05.5')
    expect(formatDuration(125.456)).toBe('02:05.46')
    expect(formatDuration(125.999)).toBe('02:06')
    expect(formatDuration(3661.123)).toBe('61:01.12')
  })

  it('应该正确处理小数四舍五入', () => {
    expect(formatDuration(30.125)).toBe('00:30.13')
    expect(formatDuration(30.124)).toBe('00:30.12')
    expect(formatDuration(30.999)).toBe('00:31')
  })

  it('应该正确处理负数', () => {
    expect(formatDuration(-5)).toBe('00:00')
    expect(formatDuration(-100)).toBe('00:00')
  })

  it('应该正确处理NaN值', () => {
    expect(formatDuration(NaN)).toBe('00:00')
  })

  it('应该确保分钟和秒数都是两位数', () => {
    expect(formatDuration(5)).toBe('00:05')
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(125)).toBe('02:05')
  })

  it('应该正确处理边界值', () => {
    expect(formatDuration(59.99)).toBe('00:59.99')
    expect(formatDuration(60)).toBe('01:00')
    expect(formatDuration(60.01)).toBe('01:00.01')
    expect(formatDuration(59.995)).toBe('01:00') // 四舍五入后变成60秒
  })
})
