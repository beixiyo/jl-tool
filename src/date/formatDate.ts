import type { DateFormat, FormatDateOpts } from './formatDate.types'
import { getDateInfo, getLocaleDateInfo, normalizeFormatter } from './formatDate.helpers'

/**
 * 格式化时间，你也可以放在 Date.prototype 上，然后 new Date().formatDate()
 *
 * @example
 * ```ts
 * console.log(formatDate('yyyy-MM-dd 00:00'))
 * console.log(formatDate('yy/M/d', new Date()))
 * console.log(formatDate('yyyy-MM-dd HH:mm:ss.SSS'))
 * console.log(formatDate("yyyy年MM月dd日 'at' HH:mm")) // 单引号转义字面量
 * console.log(formatDate((dateInfo) => {
 *     return `今年是${dateInfo.year}年`
 * }))
 * ```
 *
 * @param formatter 格式化函数或者字符串，默认 `yyyy-MM-dd HH:mm:ss`。
 * 支持 token（大小写有含义）: yyyy/YYYY/yy, MM/M, dd/d, HH/H, mm/m, ss/s, SSS/ms/S；
 * 单引号包裹的内容原样输出（`''` 表示单引号）。详见 {@link DateFormat}
 * @param date 日期，默认当前时间
 * @param opts 格式化选项
 */
export function formatDate(
  formatter: DateFormat = 'yyyy-MM-dd HH:mm:ss',
  date?: Date,
  opts: FormatDateOpts = {},
) {
  const { locales, timeZone } = opts
  const formatterFn = normalizeFormatter(formatter)

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
    ? getDateInfo(newDate)
    : getLocaleDateInfo(newDate, locales, timeZone)

  return formatterFn(dateInfo)
}
