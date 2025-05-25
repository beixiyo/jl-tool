/**
 * 将数值从一个范围映射到另一个范围，支持反向映射
 *
 * @example
 * ```ts
 * // 反向映射，输出 50
 * mapRange(0, {
 *   input: [0, 50],
 *   output: [50, 0]
 * })
 *
 * // 正向映射，输出 190
 * mapRange(10, {
 *   input: [0, 100],
 *   output: [100, 1000]
 * })
 * ```
 *
 * @param value 要映射的值
 * @param range 输入和输出范围
 * @param options 配置选项
 * @returns 映射后的值
 */
export function mapRange(
  value: number,
  range: Range,
  options: MapRangeOptions = {},
): number {
  const {
    clamp = true,
    precise = false,
    decimals = 2,
  } = options

  const [inMin, inMax] = range.input
  const [outMin, outMax] = range.output

  /** 验证输入范围 */
  if (inMin === inMax) {
    throw new Error('Input range cannot be zero')
  }

  /** 判断是否为反向映射 */
  const isReversed = outMin > outMax

  /** 计算映射值 */
  let result: number
  if (isReversed) {
    /** 反向映射 */
    result = outMin - ((value - inMin) * (outMin - outMax) / (inMax - inMin))
  }
  else {
    /** 正向映射 */
    result = outMin + ((value - inMin) * (outMax - outMin) / (inMax - inMin))
  }

  /** 处理范围限制 */
  if (clamp) {
    const realOutMin = Math.min(outMin, outMax)
    const realOutMax = Math.max(outMin, outMax)
    result = Math.min(Math.max(result, realOutMin), realOutMax)
  }

  /** 处理精度 */
  if (!precise) {
    result = Math.round(result)
  }
  else if (decimals >= 0) {
    const multiplier = 10 ** decimals
    result = Math.round(result * multiplier) / multiplier
  }

  return result
}

/**
 * 创建一个可重用的映射函数
 * @param range 输入和输出范围
 * @param options 配置选项
 * @returns 映射函数
 */
export function createMapRange(
  range: Range,
  options: MapRangeOptions = {},
): (value: number) => number {
  return (value: number) => mapRange(value, range, options)
}

export interface MapRangeOptions {
  /** 是否限制在目标范围内 */
  clamp?: boolean
  /** 是否保留小数 */
  precise?: boolean
  /** 保留的小数位数 (仅在 precise 为 true 时生效) */
  decimals?: number
}

export interface Range {
  input: [number, number]
  output: [number, number]
}
