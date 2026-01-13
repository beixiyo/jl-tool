import type { DateInfo, DateFormat } from './formatDate.types'
import { isFn } from '@/shared/is'

/**
 * 规范化格式化函数
 * @param formatter 格式化字符串或函数
 * @returns 格式化函数
 */
export function normalizeFormatter(formatter: DateFormat): (dateInfo: DateInfo) => string {
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
 * 补零函数
 * @param str 字符串
 * @param num 目标长度
 * @returns 补零后的字符串
 */
export function pad(str: string, num = 2): string {
  return str.toString().padStart(num, '0')
}

/**
 * 获取当前时区的日期信息
 * @param date 日期对象
 * @returns 日期信息对象
 */
export function getDateInfo(date: Date): DateInfo {
  const pad = (str: string, num = 2) => str.toString().padStart(num, '0')

  const dateInfo: DateInfo = {
    yyyy: String(date.getFullYear()),
    MM: String(date.getMonth() + 1),
    dd: String(date.getDate()),
    HH: String(date.getHours()),
    mm: String(date.getMinutes()),
    ss: String(date.getSeconds()),
    ms: String(date.getMilliseconds()),
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
 * @param date 日期对象
 * @param locales 语言环境
 * @param timeZone 时区
 * @returns 日期信息对象
 */
export function getLocaleDateInfo(
  date: Date,
  locales: Intl.LocalesArgument,
  timeZone: string,
): DateInfo {
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
  const formattedParts = formatter.formatToParts(date)

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
