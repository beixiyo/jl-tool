import { timeGap, formatDate, getQuarter, padDate, getValidDate, isLtYear } from '@/tools/dateTools'
import { describe, expect, test, it } from 'vitest'


const timeStr = '2020-10-02 10:02:55'

describe('语义化时间测试', () => {
  test('刚刚', () => {
    expect(timeGap()).toBe('刚刚')
  })
  test('多久前', () => {
    expect(timeGap(Date.now() - 1001)).toBe('1秒前')
    expect(timeGap(Date.now() - 1000 * 60.1)).toBe('1分钟前')
    expect(timeGap(Date.now() - 1000 * 60.1 * 60)).toBe('1小时前')
    expect(timeGap(Date.now() - 1000 * 60.1 * 60 * 24)).toBe('1天前')
    expect(timeGap(Date.now() - 1000 * 60.1 * 60 * 24 * 365)).toBe('1年前')
  })
})


describe('formatDate', () => {

  test('格式化时间测试', () => {
    expect(formatDate('yyyy-MM-dd', new Date(timeStr)))
      .toBe(timeStr.slice(0, 10))

    expect(formatDate(undefined, new Date(timeStr)))
      .toBe(timeStr)

    expect(formatDate('yyyy-MM-dd 00:00', new Date(timeStr)))
      .toBe(timeStr.slice(0, 10) + ' 00:00')

    expect(formatDate('yyyy-MM-dd 23:59:59', new Date(timeStr)))
      .toBe(timeStr.slice(0, 10) + ' 23:59:59')

    expect(formatDate((dateInfo) => `今年是${dateInfo.yyyy}年`))
      .toBe(`今年是${new Date().getFullYear()}年`)
  })

  it('默认格式化当前时间', () => {
    const result = formatDate('yyyy-MM-dd HH:mm:ss')
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
    expect(result).toMatch(regex)
  })

  it('自定义日期格式化', () => {
    const date = new Date(2023, 9, 15, 12, 30, 45) // 2023-10-15 12:30:45
    const result = formatDate('yyyy-MM-dd HH:mm:ss', date)
    expect(result).toBe('2023-10-15 12:30:45')
  })

  it('仅格式化日期部分', () => {
    const date = new Date(2023, 9, 15, 12, 30, 45)
    const result = formatDate('yyyy-MM-dd', date)
    expect(result).toBe('2023-10-15')
  })

  it('格式化时间部分', () => {
    const date = new Date(2023, 9, 15, 12, 30, 45)
    const result = formatDate('HH:mm:ss', date)
    expect(result).toBe('12:30:45')
  })

  it('格式化毫秒部分', () => {
    const date = new Date(2023, 9, 15, 12, 30, 45, 123)
    const result = formatDate('yyyy-MM-dd HH:mm:ss:ms', date)
    expect(result).toBe('2023-10-15 12:30:45:123')
  })

  it('使用自定义格式化函数', () => {
    const date = new Date(2023, 9, 15)
    const result = formatDate((dateInfo) => `今年是${dateInfo.yyyy}年`, date)
    expect(result).toBe('今年是2023年')
  })

  it('处理时区格式化', () => {
    const date = new Date(Date.UTC(2023, 9, 15, 12, 30, 45))
    const result = formatDate('yyyy-MM-dd HH:mm:ss', date, {
      locales: 'en-US',
      timeZone: 'UTC',
    })
    expect(result).toBe('2023-10-15 12:30:45')
  })

  it('处理时区格式化（非UTC）', () => {
    const date = new Date(Date.UTC(2023, 9, 15, 12, 30, 45))
    const result = formatDate('yyyy-MM-dd HH:mm:ss', date, {
      locales: 'en-US',
      timeZone: 'America/New_York',
    })
    expect(result).toBe('2023-10-15 08:30:45') // UTC-4
  })

  it('处理不支持 Intl 的环境', () => {
    const originalIntl = global.Intl
    // @ts-ignore
    global.Intl = undefined

    const date = new Date(2023, 9, 15, 12, 30, 45)
    expect(() => formatDate(
      'yyyy-MM-dd HH:mm:ss',
      date,
      {
        locales: 'en-US',
        timeZone: 'UTC',
      }
    ))
      .toThrowError(new Error('Intl is not supported in this environment'))

    global.Intl = originalIntl // 恢复 Intl
  })
})


describe('其他时间测试', () => {
  test('获取季度', () => {
    expect(getQuarter(new Date(timeStr))).toBe(4)
  })

  const dateStr = '2010-10-02'
  test('日期填补测试', () => {
    expect(padDate(dateStr)).toBe(dateStr + ' 00:00:00')
    expect(padDate(dateStr, '23:59:59')).toBe(dateStr + ' 23:59:59')
  })

  test('异常测试', () => {
    expect(() => getValidDate('xixi')).toThrowError('日期格式错误')
  })

  test('是否小于去年一月一日', () => {
    expect(isLtYear(new Date(dateStr))).toBeTruthy()
    expect(isLtYear(new Date())).toBeFalsy()
  })

})
