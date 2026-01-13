/**
 * 日期格式化选项
 */
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

/**
 * 日期格式化格式
 */
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

/**
 * 日期信息对象
 */
export interface DateInfo {
  yyyy: string
  MM: string
  dd: string
  HH: string
  mm: string
  ss: string
  ms: string
}
