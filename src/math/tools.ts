/**
 * 将数值限制在指定范围内
 * @param value 要限制的值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 *
 * @example
 * ```typescript
 * clamp(5, 0, 10) // 5
 * clamp(-1, 0, 10) // 0
 * clamp(11, 0, 10) // 10
 * clamp(5, 10, 0) // 5 (自动交换min和max)
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  /** 确保 min 不大于 max */
  if (min > max) {
    [min, max] = [max, min]
  }
  return Math.min(Math.max(value, min), max)
}

/**
 * 解决 Number.toFixed 计算错误
 * @example
 * ```ts
 * 1.335.toFixed(2) => '1.33'
 * numFixed(1.335) => 1.34
 * ```
 *
 * @param num 数值
 * @param precision 精度，默认 2
 */
export function numFixed(num: number | string, precision = 2) {
  num = Number(num)
  const scale = 10 ** precision
  return Math.round(num * scale) / scale
}

/**
 * 将大小值与单位相互换算，返回包含各单位数值的对象
 *
 * @example
 * ```ts
 * formatFileSize({ value: 1024, unit: 'byte' })
 * // { bit: 8192, byte: 1024, kb: 1, mb: 1/1024, ..., recommended: { value: 1, unit: 'kb' } }
 *
 * formatFileSize({ value: 1.5 * 1024 * 1024, unit: 'byte' })
 * // { ..., recommended: { value: 1.5, unit: 'mb' } }
 *
 * formatFileSize({ value: 8, unit: 'bit' })
 * // { bit: 8, byte: 1, kb: 1/1024, ..., recommended: { value: 1, unit: 'byte' } }
 * ```
 */
export function formatFileSize(input: FormatFileSizeInput): FormatFileSizeResult {
  const { value, unit = 'byte' } = input

  /** 基准换算为字节（byte） */
  const toBytes = (v: number, u: FileSizeUnit): number => {
    switch (u) {
      case 'bit':
        return v / 8
      case 'byte':
        return v
      case 'kb':
        return v * 1024
      case 'mb':
        return v * 1024 ** 2
      case 'gb':
        return v * 1024 ** 3
      case 'tb':
        return v * 1024 ** 4
      default:
        return v
    }
  }

  const bytes = toBytes(value, unit)

  const result = {
    bit: bytes * 8,
    byte: bytes,
    kb: bytes / 1024,
    mb: bytes / 1024 ** 2,
    gb: bytes / 1024 ** 3,
    tb: bytes / 1024 ** 4,
  }

  /** 智能推荐最合适的单位和值 */
  const getRecommended = (): { value: number, unit: FileSizeUnit } => {
    /** 如果值为0，返回0 byte */
    if (bytes === 0) {
      return { value: 0, unit: 'byte' }
    }

    /**
     * 按单位从大到小检查，选择值在 [1, 1024) 范围内的最大单位
     * 如果值小于1，则使用更小的单位
     */
    if (result.tb >= 1) {
      return { value: result.tb, unit: 'tb' }
    }
    if (result.gb >= 1) {
      return { value: result.gb, unit: 'gb' }
    }
    if (result.mb >= 1) {
      return { value: result.mb, unit: 'mb' }
    }
    if (result.kb >= 1) {
      return { value: result.kb, unit: 'kb' }
    }
    if (result.byte >= 1) {
      return { value: result.byte, unit: 'byte' }
    }
    /** 如果小于1 byte，使用 bit */
    return { value: result.bit, unit: 'bit' }
  }

  return {
    ...result,
    recommended: getRecommended(),
  }
}

/**
 * 格式化时长（秒转 MM:SS 格式）
 * @param value 时长（秒），支持小数
 * @returns 格式化后的时长字符串，格式为 MM:SS，秒数四舍五入最多保留两位小数
 *
 * @example
 * ```ts
 * formatDuration(0) // "00:00"
 * formatDuration(30) // "00:30"
 * formatDuration(65) // "01:05"
 * formatDuration(125.5) // "02:05.5"
 * formatDuration(125.456) // "02:05.46"
 * formatDuration(3661.123) // "61:01.12"
 * formatDuration(-5) // "00:00" (负数会被处理为0)
 * formatDuration(NaN) // "00:00" (NaN会被处理为0)
 * ```
 */
export function formatDuration(value: number): string {
  const safeValue = Number.isNaN(value)
    ? 0
    : Math.max(0, value)

  /** 四舍五入最多保留两位小数 */
  const roundedValue = Math.round(safeValue * 100) / 100

  const minutes = Math.floor(roundedValue / 60)
  const seconds = roundedValue % 60

  /** 格式化秒数，保留最多两位小数 */
  const secondsFixed = seconds.toFixed(2)
  const secondsStr = secondsFixed.replace(/\.?0+$/, '')

  /** 确保秒数部分至少两位（包括整数部分） */
  const secondsParts = secondsStr.split('.')
  const secondsInt = secondsParts[0].padStart(2, '0')
  const secondsDecimal = secondsParts[1]
    ? `.${secondsParts[1]}`
    : ''

  return `${minutes.toString().padStart(2, '0')}:${secondsInt}${secondsDecimal}`
}

/**
 * 文件大小单位
 */
export type FileSizeUnit = 'bit' | 'byte' | 'kb' | 'mb' | 'gb' | 'tb'

export type FormatFileSizeInput = {
  value: number
  /**
   * 数值的单位
   * @default 'byte'
   */
  unit?: FileSizeUnit
}

export type FormatFileSizeResult = {
  bit: number
  byte: number
  kb: number
  mb: number
  gb: number
  tb: number
  /**
   * 智能推荐值，符合人类最好的阅读习惯
   * 例如：{ value: 1, unit: 'mb' } 或 { value: 1.5, unit: 'gb' }
   */
  recommended: {
    value: number
    unit: FileSizeUnit
  }
}
