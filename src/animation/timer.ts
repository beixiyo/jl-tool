import { Clock } from '@/tools/Clock'
import { applyAnimation } from './applyAnimation'

/**
 * setInterval 替代，用 requestAnimationFrame 实现
 * @returns 停止函数
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
