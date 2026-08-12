import type { DateInfo } from '@/date/formatDate.types'
import { afterAll, describe, expect, it } from 'vitest'
import { formatDate } from '@/date'

/**
 * 统一的本地时间样本：2026-03-05 09:08:07.009
 * 故意全部取个位数（月/日/时/分/秒/毫秒），方便区分「补零」与「不补零」
 */
const local = new Date(2026, 2, 5, 9, 8, 7, 9)

describe('formatDate · 定宽 token（补零）', () => {
  it('默认格式等价于 yyyy-MM-dd HH:mm:ss', () => {
    expect(formatDate(undefined, local)).toBe('2026-03-05 09:08:07')
    expect(formatDate('yyyy-MM-dd HH:mm:ss', local)).toBe('2026-03-05 09:08:07')
  })

  it('仅日期 / 仅时间', () => {
    expect(formatDate('yyyy-MM-dd', local)).toBe('2026-03-05')
    expect(formatDate('HH:mm:ss', local)).toBe('09:08:07')
  })

  it('字面量数字不被替换', () => {
    expect(formatDate('yyyy-MM-dd 00:00', local)).toBe('2026-03-05 00:00')
    expect(formatDate('yyyy-MM-dd 23:59:59', local)).toBe('2026-03-05 23:59:59')
  })
})

describe('formatDate · 变宽 token（不补零）与两位年', () => {
  it('单字符 token', () => {
    expect(formatDate('yyyy-M-d H:m:s', local)).toBe('2026-3-5 9:8:7')
    expect(formatDate('M/d', local)).toBe('3/5')
  })

  it('yy 两位年', () => {
    expect(formatDate('yy', local)).toBe('26')
    expect(formatDate('yy-MM-dd', local)).toBe('26-03-05')
  })

  it('两位年补零边界', () => {
    expect(formatDate('yy', new Date(2005, 0, 1))).toBe('05')
    expect(formatDate('yy', new Date(2000, 0, 1))).toBe('00')
  })
})

describe('formatDate · 毫秒', () => {
  it('sSS / ms 补零到 3 位，S 不补零', () => {
    expect(formatDate('SSS', local)).toBe('009')
    expect(formatDate('ms', local)).toBe('009')
    expect(formatDate('S', local)).toBe('9')
  })

  it('完整带毫秒', () => {
    expect(formatDate('yyyy-MM-dd HH:mm:ss.SSS', local)).toBe('2026-03-05 09:08:07.009')
    /** 兼容旧写法 :ms */
    expect(formatDate('yyyy-MM-dd HH:mm:ss:ms', new Date(2023, 9, 15, 12, 30, 45, 123)))
      .toBe('2023-10-15 12:30:45:123')
  })

  it('不同毫秒值的补零', () => {
    expect(formatDate('SSS', new Date(2026, 0, 1, 0, 0, 0, 50))).toBe('050')
    expect(formatDate('SSS', new Date(2026, 0, 1, 0, 0, 0, 0))).toBe('000')
  })
})

describe('formatDate · 兼容写法与大小写区分', () => {
  it('yYYY 等价于 yyyy', () => {
    expect(formatDate('YYYY-MM-dd', local)).toBe('2026-03-05')
  })

  it('m（月）与 m（分）大小写区分', () => {
    expect(formatDate('MM:mm', local)).toBe('03:08')
    expect(formatDate('M:m', local)).toBe('3:8')
  })

  it('h（24 时）与 S（毫秒）', () => {
    expect(formatDate('H:S', local)).toBe('9:9')
  })
})

describe('formatDate · 全局替换（所有匹配都替换）', () => {
  it('同一 token 出现多次', () => {
    expect(formatDate('yyyy yyyy', local)).toBe('2026 2026')
    expect(formatDate('dd-dd', local)).toBe('05-05')
    expect(formatDate('M/M/M', local)).toBe('3/3/3')
  })
})

describe('formatDate · 字面量转义（单引号）', () => {
  it('单引号包裹的内容原样输出', () => {
    expect(formatDate('yyyy \'MM\' dd', local)).toBe('2026 MM 05')
    expect(formatDate('\'day\' d', local)).toBe('day 5')
    expect(formatDate('\'month\' M', local)).toBe('month 3')
  })

  it('\'\' 表示一个单引号', () => {
    expect(formatDate('\'\'', local)).toBe('\'')
    expect(formatDate('\'it\'\'s\' yyyy', local)).toBe('it\'s 2026')
    expect(formatDate('hh\'\'o', local)).toBe('hh\'o') // h 不是 token，原样保留
  })

  it('iSO 风格的 T 分隔符', () => {
    // T 本身不是 token，加不加引号结果一致
    expect(formatDate('yyyy-MM-dd\'T\'HH:mm:ss', local)).toBe('2026-03-05T09:08:07')
    expect(formatDate('yyyy-MM-ddTHH:mm:ss', local)).toBe('2026-03-05T09:08:07')
  })

  it('不转义时字母会被当作 token（说明为何需要转义）', () => {
    // 'd' -> 日，'a'/'y' 原样；故 day -> 5ay
    expect(formatDate('day', local)).toBe('5ay')
    // 'm' -> 分
    expect(formatDate('month', local)).toBe('8onth')
  })
})

describe('formatDate · 自定义格式化函数（DateInfo 为原始数值）', () => {
  it('回调拿到的是数值', () => {
    const result = formatDate((info) => {
      const checks: DateInfo = {
        year: 2026,
        month: 3,
        day: 5,
        hour: 9,
        minute: 8,
        second: 7,
        millisecond: 9,
      }
      expect(info).toEqual(checks)
      return `${info.year}/${info.month}/${info.day}`
    }, local)

    expect(result).toBe('2026/3/5')
  })

  it('字段均为 number 类型', () => {
    formatDate((info) => {
      for (const key in info) {
        expect(typeof info[key as keyof DateInfo]).toBe('number')
      }
      return ''
    }, local)
  })
})

describe('formatDate · 指定时区（locales + timeZone）', () => {
  const utcDate = new Date(Date.UTC(2026, 2, 5, 9, 8, 7, 9)) // 2026-03-05T09:08:07.009Z

  it('uTC 下定宽与变宽', () => {
    expect(formatDate('yyyy-MM-dd HH:mm:ss', utcDate, { locales: 'en-US', timeZone: 'UTC' }))
      .toBe('2026-03-05 09:08:07')

    expect(formatDate('yy/M/d H:m:s', utcDate, { locales: 'en-US', timeZone: 'UTC' }))
      .toBe('26/3/5 9:8:7')

    expect(formatDate('SSS', utcDate, { locales: 'en-US', timeZone: 'UTC' }))
      .toBe('009')
  })

  it('非 UTC 时区（America/New_York，3 月 5 日为 EST，UTC-5）', () => {
    expect(formatDate('yyyy-MM-dd HH:mm:ss', utcDate, {
      locales: 'en-US',
      timeZone: 'America/New_York',
    }))
      .toBe('2026-03-05 04:08:07')
  })

  it('午夜小时为 00 / 0（hourCycle h23，不会出现 24）', () => {
    const midnight = new Date(Date.UTC(2026, 2, 5, 0, 0, 0, 0))
    expect(formatDate('HH', midnight, { locales: 'en-US', timeZone: 'UTC' })).toBe('00')
    expect(formatDate('H', midnight, { locales: 'en-US', timeZone: 'UTC' })).toBe('0')
  })

  it('不支持 Intl 时抛错', () => {
    const originalIntl = globalThis.Intl
    // @ts-ignore
    globalThis.Intl = undefined

    expect(() => formatDate('yyyy-MM-dd', utcDate, { locales: 'en-US', timeZone: 'UTC' }))
      .toThrowError(new Error('Intl is not supported in this environment'))

    globalThis.Intl = originalIntl
  })
})

describe('formatDate · 挂载到 Date.prototype 使用', () => {
  afterAll(() => {
    // @ts-ignore
    delete (Date.prototype as any).formatDate
  })

  it('作为方法调用时使用 this 指向的日期', () => {
    // @ts-ignore
    (Date.prototype as any).formatDate = formatDate

    // @ts-ignore
    expect(local.formatDate('yyyy-M-d')).toBe('2026-3-5')
  })
})
