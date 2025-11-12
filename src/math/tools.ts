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
 * 将大小值与单位相互换算，返回包含各单位数值的对象
 *
 * @example
 * ```ts
 * formatFileSize({ value: 1024, unit: 'byte' }) // { bit: 8192, byte: 1024, kb: 1, mb: 1/1024, ... }
 * formatFileSize({ value: 8, unit: 'bit' }) // { bit: 8, byte: 1, kb: 1/1024, ... }
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

  return {
    bit: bytes * 8,
    byte: bytes,
    kb: bytes / 1024,
    mb: bytes / 1024 ** 2,
    gb: bytes / 1024 ** 3,
    tb: bytes / 1024 ** 4,
  }
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
}
