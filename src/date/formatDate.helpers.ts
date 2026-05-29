import type { DateFormat, DateInfo } from './formatDate.types'
import { isFn } from '@/shared/is'

/** 单引号字符码，用于识别转义字面量 */
const QUOTE = 39

/**
 * 各格式化 token 的解析函数。
 * 注意大小写有含义（遵循 Unicode LDML）：
 * - `M` 月 / `m` 分；`H` 时(0-23) / `S`(`ms`) 毫秒
 * - 同一字段有定宽（补零）与变宽（不补零）两种写法
 */
const TOKEN_RESOLVERS: Record<string, (info: DateInfo) => string> = {
  /** 年 */
  yyyy: info => pad(info.year, 4),
  YYYY: info => pad(info.year, 4), // 兼容写法，等价于 yyyy（非严格 LDML）
  yy: info => pad(info.year % 100, 2),

  /** 月（1-12） */
  MM: info => pad(info.month, 2),
  M: info => String(info.month),

  /** 日 */
  dd: info => pad(info.day, 2),
  d: info => String(info.day),

  /** 时（0-23） */
  HH: info => pad(info.hour, 2),
  H: info => String(info.hour),

  /** 分 */
  mm: info => pad(info.minute, 2),
  m: info => String(info.minute),

  /** 秒 */
  ss: info => pad(info.second, 2),
  s: info => String(info.second),

  /** 毫秒 */
  SSS: info => pad(info.millisecond, 3),
  ms: info => pad(info.millisecond, 3), // 兼容写法，等价于 SSS
  S: info => String(info.millisecond),
}

/**
 * 匹配「转义字面量」或「token」的正则。
 * - 转义字面量：单引号包裹的内容会原样输出，`''` 表示一个单引号
 * - token：按长度降序排列，保证 `yyyy` 优先于 `yy`、`MM` 优先于 `M`
 */
const TOKEN_REGEX = new RegExp(
  `'(?:[^']|'')*'|${Object.keys(TOKEN_RESOLVERS)
    .sort((a, b) => b.length - a.length)
    .join('|')}`,
  'g',
)

/**
 * 规范化格式化函数
 * @param formatter 格式化字符串或函数
 * @returns 格式化函数
 */
export function normalizeFormatter(formatter: DateFormat): (info: DateInfo) => string {
  if (isFn(formatter))
    return formatter

  return (info: DateInfo) =>
    formatter.replace(TOKEN_REGEX, (match) => {
      /** 转义字面量 */
      if (match.charCodeAt(0) === QUOTE) {
        if (match === '\'\'')
          return '\''
        return match.slice(1, -1).replace(/''/g, '\'')
      }

      return TOKEN_RESOLVERS[match]?.(info) ?? match
    })
}

/**
 * 补零函数
 * @param value 数字或字符串
 * @param length 目标长度，默认 `2`
 * @returns 补零后的字符串
 */
export function pad(value: number | string, length = 2): string {
  return String(value).padStart(length, '0')
}

/**
 * 获取当前时区的日期信息
 * @param date 日期对象
 * @returns 日期信息对象（各字段均为原始数值）
 */
export function getDateInfo(date: Date): DateInfo {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
  }
}

/**
 * 获取指定时区的日期信息
 * @param date 日期对象
 * @param locales 语言环境
 * @param timeZone 时区
 * @returns 日期信息对象（各字段均为原始数值）
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
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3, // 毫秒
    hourCycle: 'h23',
    timeZone,
  })

  /** 格式化日期为部分 */
  const formattedParts = formatter.formatToParts(date)

  /** 将格式化后的部分组装成对象，统一转为数值由 token 解析时再补零 */
  const dateInfo = {} as DateInfo
  for (const part of formattedParts) {
    switch (part.type) {
      case 'year': dateInfo.year = Number(part.value); break
      case 'month': dateInfo.month = Number(part.value); break
      case 'day': dateInfo.day = Number(part.value); break
      case 'hour': dateInfo.hour = Number(part.value); break
      case 'minute': dateInfo.minute = Number(part.value); break
      case 'second': dateInfo.second = Number(part.value); break
      case 'fractionalSecond': dateInfo.millisecond = Number(part.value); break
    }
  }

  return dateInfo
}
