/**
 * 将数值限制在指定范围内
 * @param value 要限制的值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  // 确保 min 不大于 max
  if (min > max) {
    [min, max] = [max, min]
  }
  return Math.min(Math.max(value, min), max)
}