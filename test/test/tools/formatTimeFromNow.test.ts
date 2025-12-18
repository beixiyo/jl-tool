import { describe, expect, it } from 'vitest'
import { formatTimeFromNow, timeGap } from '@/tools/formatTimeFromNow'

describe('语义化时间测试', () => {
  it('刚刚', () => {
    expect(formatTimeFromNow()).toBe('刚刚')
  })

  it('多久前（中文）', () => {
    expect(formatTimeFromNow(Date.now() + 100)).toBe('刚刚')

    expect(formatTimeFromNow(Date.now() - 1001)).toBe('1秒前')
    expect(formatTimeFromNow(Date.now() - 1000 * 60.1)).toBe('1分钟前')
    expect(formatTimeFromNow(Date.now() - 1000 * 60.1 * 60)).toBe('1小时前')
    expect(formatTimeFromNow(Date.now() - 1000 * 60.1 * 60 * 24)).toBe('1天前')
    expect(formatTimeFromNow(Date.now() - 1000 * 60.1 * 60 * 24 * 365)).toBe('1年前')
  })

  it('未来时间（中文）', () => {
    expect(formatTimeFromNow(Date.now() + 1000 * 60.1)).toBe('1分钟后')
  })

  it('多语言（英文）', () => {
    expect(formatTimeFromNow(Date.now() - 1000 * 60.1, { language: 'en-US' })).toBe('1minute ago')
    expect(formatTimeFromNow(Date.now() + 1000 * 60.1, { language: 'en-US' })).toBe('in 1minute')
  })

  it('非法时间与 fallback', () => {
    expect(formatTimeFromNow('invalid' as any)).toBe('--')
    expect(formatTimeFromNow('invalid' as any, { fallback: 'N/A' })).toBe('N/A')
  })

  it('shouldFormat 控制是否格式化', () => {
    const date = Date.now() - 10 * 24 * 60 * 60 * 1000
    const raw = new Date(date).getTime()

    expect(formatTimeFromNow(raw, {
      shouldFormat: () => false,
    })).toBe(raw)

    expect(formatTimeFromNow(raw, {
      shouldFormat: () => true,
    })).toBe('10天前')

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const within7Days = Date.now() - sevenDaysMs
    const within7DaysRaw = new Date(within7Days).getTime()
    const over7Days = Date.now() - (sevenDaysMs + 1)
    const over7DaysRaw = new Date(over7Days).getTime()

    // 小于等于 7 天：继续格式化
    expect(formatTimeFromNow(within7DaysRaw, {
      shouldFormat: diff => diff <= sevenDaysMs,
    })).toBe('7天前')

    // 大于 7 天：返回原始值
    expect(formatTimeFromNow(over7DaysRaw, {
      shouldFormat: diff => diff <= sevenDaysMs,
    })).toBe(over7DaysRaw)
  })

  it('自定义 beforeFn / afterFn', () => {
    const before = formatTimeFromNow(Date.now() - 1000 * 60.1, {
      beforeFn: str => `${str} 之前`,
    })
    const after = formatTimeFromNow(Date.now() + 1000 * 60.1, {
      afterFn: str => `${str} 之后`,
    })

    expect(before).toBe('1分钟 之前')
    expect(after).toBe('1分钟 之后')
  })

  it('timeGap 别名与 formatTimeFromNow 等价', () => {
    expect(timeGap).toBe(formatTimeFromNow)
  })
})
