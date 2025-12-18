import type { TimeType } from '@/types/base'
import { ONE_DAY } from '@/shared'
import { isFn } from '@/shared/is'
import { getType } from './tools'

/**
 * 获取今年的第几天
 * @param date 日期对象，默认当前日期
 * @returns 今年的第几天（1-366）
 *
 * @example
 * ```ts
 * // 基础用法
 * dayOfYear(new Date('2024-01-01')) // 1
 * dayOfYear(new Date('2024-12-31')) // 366（2024年是闰年）
 * dayOfYear() // 当前日期是今年的第几天
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 计算生日
 * const birthday = new Date('2024-03-15')
 * const dayOfBirth = dayOfYear(birthday)
 * console.log(`生日是今年的第 ${dayOfBirth} 天`)
 * ```
 */
export function dayOfYear(date = new Date()) {
  return Math.floor(
    (+date - +(new Date(date.getFullYear(), 0, 0)))
    / ONE_DAY,
  )
}

/**
 * 获取时分秒
 * @param date 日期对象
 * @returns 时分秒字符串，格式为 'HH:mm:ss'
 *
 * @example
 * ```ts
 * // 基础用法
 * const date = new Date('2024-01-01 14:30:45')
 * timeFromDate(date) // '14:30:45'
 * timeFromDate(new Date()) // 当前时间的时分秒
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 显示时间
 * const now = new Date()
 * const timeStr = timeFromDate(now)
 * console.log(`当前时间: ${timeStr}`) // '当前时间: 14:30:45'
 * ```
 */
export const timeFromDate = (date: Date) => date.toTimeString().slice(0, 8)

/**
 * 获取季度
 * @param date 日期，默认当前日期
 * @returns 季度数（1-4）
 *
 * @example
 * ```ts
 * // 基础用法
 * getQuarter(new Date('2024-01-15')) // 1（第一季度）
 * getQuarter(new Date('2024-04-15')) // 2（第二季度）
 * getQuarter(new Date('2024-07-15')) // 3（第三季度）
 * getQuarter(new Date('2024-10-15')) // 4（第四季度）
 * getQuarter() // 当前日期的季度
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 按季度统计
 * const reportDate = new Date('2024-06-30')
 * const quarter = getQuarter(reportDate)
 * console.log(`这是第 ${quarter} 季度的报告`)
 * ```
 */
export function getQuarter(date: TimeType = new Date()) {
  const month = new Date(date).getMonth() + 1
  return Math.ceil(month / 3)
}

/**
 * 获取日期间隔
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 两个日期之间的天数间隔（绝对值）
 *
 * @example
 * ```ts
 * // 基础用法
 * dayDiff('2024-01-01', '2024-01-10') // 9
 * dayDiff('2024-01-10', '2024-01-01') // 9（绝对值）
 * dayDiff(new Date('2024-01-01'), new Date('2024-01-10')) // 9
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 计算项目周期
 * const startDate = '2024-01-01'
 * const endDate = '2024-03-31'
 * const projectDays = dayDiff(startDate, endDate)
 * console.log(`项目周期: ${projectDays} 天`)
 * ```
 */
export function dayDiff(date1: TimeType, date2: TimeType) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.ceil(Math.abs(+d1 - +d2) / ONE_DAY)
}

/**
 * 日期补零 把`yyyy-MM-dd` 转成 `yyyy-MM-dd HH:mm:ss`
 * @param date 格式: `2016-06-10`，必须和它长度保持一致，否则直接返回
 * @param placeholder 后面补充的字符串 默认`00:00:00`
 * @returns 如`2016-06-10 10:00:00`
 *
 * @example
 * ```ts
 * // 基础用法
 * padDate('2024-01-01') // '2024-01-01 00:00:00'
 * padDate('2024-12-31', '23:59:59') // '2024-12-31 23:59:59'
 * ```
 *
 * @example
 * ```ts
 * // 长度不符合时直接返回
 * padDate('2024-1-1') // '2024-1-1'（长度不符合）
 * padDate('') // 返回当前日期格式化结果
 * ```
 */
export function padDate(date: string, placeholder = '00:00:00') {
  if (!date)
    return formatDate()
  if (date.length !== '2016-06-10'.length)
    return date

  return `${date} ${placeholder}`
}

/**
 * 把日期转为 `Date` 对象，非法日期则抛异常
 * @param date 日期，可以是字符串或者时间戳
 * @returns 有效的 Date 对象
 *
 * @example
 * ```ts
 * // 基础用法
 * getValidDate('2024-01-01') // Date 对象
 * getValidDate(1704067200000) // Date 对象（时间戳）
 * getValidDate(new Date()) // Date 对象（已经是 Date 对象）
 * ```
 *
 * @example
 * ```ts
 * // 错误处理
 * try {
 *   getValidDate('invalid-date')
 * } catch (error) {
 *   console.log('日期格式错误')
 * }
 * ```
 */
export function getValidDate(date: Date | string | number) {
  if (getType(date) !== 'date') {
    date = new Date(date)
    if (String(date) === 'Invalid Date') {
      throw new Error('日期格式错误')
    }
  }

  return date
}

/**
 * 判断日期是否小于指定年份的一月一日
 * @param curDate 当前日期
 * @param yearLen 年份偏移量，默认 -1（即去年）
 * @returns 是否小于指定年份的一月一日
 *
 * @example
 * ```ts
 * // 基础用法
 * isLtYear('2023-06-15') // true（小于去年一月一日）
 * isLtYear('2024-06-15') // false（大于去年一月一日）
 * isLtYear('2022-06-15', -2) // true（小于前年一月一日）
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 检查数据是否过期
 * const dataDate = '2023-05-15'
 * const isOldData = isLtYear(dataDate)
 * if (isOldData) {
 *   console.log('数据已过期，需要更新')
 * }
 * ```
 */
export function isLtYear(curDate: Date | string | number, yearLen = -1) {
  curDate = getValidDate(curDate)

  const date = new Date()
  date.setFullYear(date.getFullYear() + yearLen)
  date.setMonth(0)
  date.setDate(0)

  return curDate < date
}

/**
 * 格式化时间，你也可以放在 Date.prototype 上，然后 new Date().formatDate()
 *
 * @example
 * ```ts
 * console.log(formatDate('yyyy-MM-dd 00:00'))
 * console.log(formatDate('yyyy-MM-dd', new Date(66600), false))
 * console.log(formatDate('yyyy-MM-dd HH:mm:ss:ms'))
 * console.log(formatDate((dateInfo) => {
 *     return `今年是${dateInfo.yyyy}年`
 * }))
 * ```
 *
 * @param formatter 格式化函数或者字符串，默认 `yyyy-MM-dd HH:mm:ss`。可选值: yyyy, MM, dd, HH, mm, ss, ms
 * @param date 日期，默认当前时间
 */
export function formatDate(
  formatter: DateFormat = 'yyyy-MM-dd HH:mm:ss',
  date?: Date,
  opts: FormatDateOpts = {},
) {
  const { locales, timeZone } = opts
  const formatterFn = _formatNormalize()
  const pad = (str: string, num = 2) => str.toString().padStart(num, '0')

  let newDate: Date
  if (!date) {
    newDate = typeof (Date.prototype as any).formatDate === 'function'
      // @ts-ignore
      ? this
      : new Date()
  }
  else {
    newDate = date
  }

  const dateInfo = !locales || !timeZone
    ? _getDateInfo()
    : _getLocaleDateInfo(locales, timeZone)

  return formatterFn(dateInfo)

  /***************************************************
   *                    Function
   ***************************************************/

  function _formatNormalize() {
    if (isFn(formatter))
      return formatter

    return (dateInfo: DateInfo) => {
      const { yyyy, MM, dd, HH, mm, ss, ms } = dateInfo

      return formatter
        .replace('yyyy', yyyy)
        .replace('YYYY', yyyy)
        .replace('MM', MM)
        .replace('dd', dd)
        .replace('HH', HH)
        .replace('mm', mm)
        .replace('ss', ss)
        .replace('ms', ms)
    }
  }

  /**
   * 获取当前时区的日期信息
   */
  function _getDateInfo() {
    const dateInfo: DateInfo = {
      yyyy: String(newDate.getFullYear()),
      MM: String(newDate.getMonth() + 1),
      dd: String(newDate.getDate()),
      HH: String(newDate.getHours()),
      mm: String(newDate.getMinutes()),
      ss: String(newDate.getSeconds()),
      ms: String(newDate.getMilliseconds()),
    }

    /** 补零 */
    for (const key in dateInfo) {
      const k = key as keyof DateInfo
      const item = dateInfo[k]
      dateInfo[k] = pad(item, key.length)
    }

    return dateInfo
  }

  /**
   * 获取指定时区的日期信息
   */
  function _getLocaleDateInfo(locales: Intl.LocalesArgument, timeZone: string) {
    if (typeof Intl === 'undefined') {
      throw new TypeError('Intl is not supported in this environment')
    }

    // @ts-ignore
    const formatter = new Intl.DateTimeFormat(locales, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3, // 如果需要显示毫秒数
      hour12: false,
      timeZone,
    })

    /** 格式化日期为部分 */
    const formattedParts = formatter.formatToParts(newDate)

    /** 将格式化后的部分组装成对象 */
    const dateInfo = {} as DateInfo
    for (const part of formattedParts) {
      switch (part.type) {
        case 'year': dateInfo.yyyy = part.value; break
        case 'month': dateInfo.MM = part.value; break
        case 'day': dateInfo.dd = part.value; break
        case 'hour': dateInfo.HH = part.value; break
        case 'minute': dateInfo.mm = part.value; break
        case 'second': dateInfo.ss = part.value; break
        case 'fractionalSecond': dateInfo.ms = part.value.padStart(3, '0'); break
      }
    }

    return dateInfo
  }
}

export type FormatDateOpts = {
  /**
   * 需要和 timeZone 配合使用，指定时区的日期格式化
   * @example 'zh-CN'
   */
  locales?: Intl.LocalesArgument
  /**
   * 指定时区，默认本地时区
   * @example 'Asia/Shanghai'
   */
  timeZone?: string
}

export type DateFormat =
  | ((dateInfo: DateInfo) => string)
  // yyyy
  | 'yyyy-MM-dd'
  | 'yyyy-MM-dd HH'
  | 'yyyy-MM-dd HH:mm'
  | 'yyyy-MM-dd HH:mm:ss'
  | 'yyyy-MM-dd HH:mm:ss:ms'
  | 'yyyy-MM-dd 00:00'
  | 'yyyy-MM-dd 00:00:00'
  | 'yyyy-MM-dd 23:59'
  | 'yyyy-MM-dd 23:59:59'
  // YYYY
  | 'YYYY-MM-dd'
  | 'YYYY-MM-dd HH'
  | 'YYYY-MM-dd HH:mm'
  | 'YYYY-MM-dd HH:mm:ss'
  | 'YYYY-MM-dd HH:mm:ss:ms'
  | 'YYYY-MM-dd 00:00'
  | 'YYYY-MM-dd 00:00:00'
  | 'YYYY-MM-dd 23:59'
  | 'YYYY-MM-dd 23:59:59'
  | (string & {})

export interface DateInfo {
  yyyy: string
  MM: string
  dd: string
  HH: string
  mm: string
  ss: string
  ms: string
}
