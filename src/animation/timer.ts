import { Clock } from '@/tools/Clock'
import { applyAnimation } from './applyAnimation'

/**
 * 使用 requestAnimationFrame 实现的定时器
 * @param fn 定时执行的回调函数，参数为已过去的时间（毫秒）
 * @param durationMS 执行间隔时间（毫秒）
 * @returns 停止定时器的函数
 *
 * @example
 * ```ts
 * // 基础用法
 * const stopTimer = timer((elapsed) => {
 *   console.log(`已过去 ${elapsed} 毫秒`)
 * }, 1000) // 每秒执行一次
 *
 * // 停止定时器
 * setTimeout(() => {
 *   stopTimer()
 * }, 5000) // 5秒后停止
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 动画计时器
 * const stopAnimation = timer((elapsed) => {
 *   const progress = Math.min(elapsed / 3000, 1) // 3秒动画
 *   element.style.opacity = progress.toString()
 * }, 16) // 约60fps
 *
 * // 动画完成后停止
 * setTimeout(stopAnimation, 3000)
 * ```
 */
export function timer(
  fn: (elapsedMS: number) => any,
  durationMS: number,
) {
  let tick = durationMS / durationMS
  const clock = new Clock()

  const stop = applyAnimation(() => {
    /**
     * 没到时间，则返回
     */
    if (clock.elapsedMS / durationMS <= tick) {
      return
    }

    fn(clock.elapsedMS)
    tick++
  })

  return stop
}
