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
 * 日期格式化格式。
 *
 * 支持的 token（大小写有含义，遵循 Unicode LDML）：
 *
 * | token      | 含义            | 示例（2026-03-05 09:08:07.009） |
 * | ---------- | --------------- | ------------------------------- |
 * | `yyyy`     | 年（4 位）      | `2026`                          |
 * | `yy`       | 年（2 位）      | `26`                            |
 * | `MM` / `M` | 月（补零/不补） | `03` / `3`                      |
 * | `dd` / `d` | 日（补零/不补） | `05` / `5`                      |
 * | `HH` / `H` | 时（补零/不补） | `09` / `9`                      |
 * | `mm` / `m` | 分（补零/不补） | `08` / `8`                      |
 * | `ss` / `s` | 秒（补零/不补） | `07` / `7`                      |
 * | `SSS`/`S`  | 毫秒（补零/不补） | `009` / `9`                   |
 *
 * 字面量转义：用单引号包裹的内容会原样输出，`''` 表示一个单引号。
 *
 * @remarks
 * 为兼容历史写法，运行时也接受 `YYYY`（等价 `yyyy`）和 `ms`（等价 `SSS`），
 * 但它们非标准（不符合 Unicode LDML），不建议在新代码中使用。
 *
 * @example
 * ```ts
 * formatDate('yyyy-MM-dd HH:mm:ss')   // 2026-03-05 09:08:07
 * formatDate('yy/M/d')                // 26/3/5
 * formatDate("yyyy年MM月dd日 'at' HH:mm") // 2026年03月05日 at 09:08
 * ```
 */
export type DateFormat =
  | ((dateInfo: DateInfo) => string)
  /** 定宽（补零） */
  | 'yyyy-MM-dd'
  | 'yyyy-MM-dd HH'
  | 'yyyy-MM-dd HH:mm'
  | 'yyyy-MM-dd HH:mm:ss'
  | 'yyyy-MM-dd HH:mm:ss.SSS'
  | 'yyyy-MM-dd 00:00'
  | 'yyyy-MM-dd 00:00:00'
  | 'yyyy-MM-dd 23:59'
  | 'yyyy-MM-dd 23:59:59'
  /** 变宽（不补零）/ 两位年 */
  | 'yy-MM-dd'
  | 'yyyy-M-d'
  | 'yyyy/M/d'
  | 'M/d'
  | 'H:m:s'
  | (string & {})

/**
 * 日期信息对象，各字段均为原始数值（未补零）。
 *
 * 在自定义格式化函数里，可直接拿到数值做任意拼装。
 */
export interface DateInfo {
  /** 年，如 `2026` */
  year: number
  /** 月，`1` - `12` */
  month: number
  /** 日，`1` - `31` */
  day: number
  /** 时，`0` - `23` */
  hour: number
  /** 分，`0` - `59` */
  minute: number
  /** 秒，`0` - `59` */
  second: number
  /** 毫秒，`0` - `999` */
  millisecond: number
}
