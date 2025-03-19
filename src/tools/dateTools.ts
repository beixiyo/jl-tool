import { ONE_DAY } from '@/shared'
import type { TimeType } from '@/types/base'
import { getType } from './tools'
import { isFn } from '@/shared/is'


/** 今年的第几天 */
export const dayOfYear = (date = new Date()) =>
  Math.floor(
    (+date - +(new Date(date.getFullYear(), 0, 0)))
    / ONE_DAY
  )

/** 获取时分秒 */
export const timeFromDate = (date: Date) => date.toTimeString().slice(0, 8)

/** 获取季度 */
export function getQuarter(date: TimeType = new Date()) {
  const _date = new Date(date)
  const month = _date.getMonth() + 1

  if (month <= 3) {
    return 1
  }
  if (month <= 6) {
    return 2
  }
  if (month <= 9) {
    return 3
  }

  return 4
}

/** 获取日期间隔 单位(天) */
export function dayDiff(date1: TimeType, date2: TimeType) {
  const d1 = new Date(date1),
    d2 = new Date(date2)
  return Math.ceil(Math.abs(+d1 - +d2) / ONE_DAY)
}

/**
 * 日期补零 把`yyyy-MM-dd` 转成 `yyyy-MM-dd HH:mm:ss`
 * @param date 格式: `2016-06-10`，必须和它长度保持一致，否则直接返回
 * @param placeholder 后面补充的字符串 默认`00:00:00`
 * @returns 如`2016-06-10 10:00:00`
 */
export function padDate(date: string, placeholder = '00:00:00') {
  if (!date) return formatDate()
  if (date.length !== '2016-06-10'.length) return date

  return date + ' ' + placeholder
}

/**
 * 把日期转为 `Date` 对象，非法日期则抛异常
 * @param date 日期，可以是字符串或者时间戳
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
 * 返回给定日期是否小于某年`一月一日` 默认去年
 * @param curDate 当前日期
 * @param yearLen 年份长度，默认 `-1`，即去年
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
 * 描述传入日期相对于当前时间的口头说法
 * 例如：刚刚、1分钟前、1小时前、1天前、1个月前、1年前...
 * @param date 需要计算时间间隔的日期
 * @example
 * ```ts
 * console.log(timeGap()) // 刚刚
 * ```
 */
export function timeGap(date?: TimeType, opts: TimeGapOpts = {}) {
  const { afterFn, beforeFn, fallback = '--' } = opts
  let isFuture = false,
    time = Date.now() - new Date(date ?? Date.now()).getTime()

  const detailMap = [
    { desc: '年', gap: 3600 * 24 * 365 * 1e3 },
    { desc: '个月', gap: 3600 * 24 * 30 * 1e3 },
    { desc: '天', gap: 3600 * 24 * 1e3 },
    { desc: '小时', gap: 3600 * 1e3 },
    { desc: '分钟', gap: 60 * 1e3 },
    { desc: '秒', gap: 1 * 1e3 },
    { desc: '刚刚', gap: 0 }
  ]

  if (Number.isNaN(time)) return fallback
  if (Math.abs(time) < 1e3) return detailMap[detailMap.length - 1].desc // 小于1秒都返回 "刚刚"

  if (time < 0) {
    isFuture = true
    time = -time
  }

  for (let i = 0; i < detailMap.length; i++) {
    const { desc, gap } = detailMap[i]
    if (time >= gap) {
      const v = Math.floor(time / gap)
      const str = v + desc
      if (isFuture) {
        return afterFn
          ? afterFn(str)
          : str + '后'
      }
      return beforeFn
        ? beforeFn(str)
        : str + '前'
    }
  }

  // 这行实际上不会执行到，但为了类型安全保留
  return fallback
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
  opts: FormatDateOpts = {}
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
    if (isFn(formatter)) return formatter

    return (dateInfo: DateInfo) => {
      const { yyyy, MM, dd, HH, mm, ss, ms } = dateInfo

      return formatter.replace('yyyy', yyyy)
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

    // 补零
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
      throw new Error('Intl is not supported in this environment')
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
      timeZone
    })

    // 格式化日期为部分
    const formattedParts = formatter.formatToParts(newDate)

    // 将格式化后的部分组装成对象
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
  | 'yyyy-MM-dd'
  | 'yyyy-MM-dd HH'
  | 'yyyy-MM-dd HH:mm'
  | 'yyyy-MM-dd HH:mm:ss'
  | 'yyyy-MM-dd HH:mm:ss:ms'
  | 'yyyy-MM-dd 00:00'
  | 'yyyy-MM-dd 00:00:00'
  | 'yyyy-MM-dd 23:59'
  | 'yyyy-MM-dd 23:59:59'
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

export type TimeGapOpts = {
  /** 兜底替代字符串，默认 -- */
  fallback?: string
  /** 以前日期格式化 */
  beforeFn?: (dateStr: string) => string
  /** 以后日期格式化 */
  afterFn?: (dateStr: string) => string
}
