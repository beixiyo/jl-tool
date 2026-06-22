import { createAnimationFrameScheduler, type AnimationFrameId } from './animationFrame'

/**
 * 在每一帧中执行你的函数
 * @param fn 将此函数放在 *requestAnimationFrame* 内递归执行，如果此函数返回 `stop` 则停止执行
 * @returns 返回一个函数，用于取消函数执行
 */
export function applyAnimation(fn: () => 'stop' | void) {
  const scheduler = createAnimationFrameScheduler()
  let id: AnimationFrameId | undefined
  let stopped = false

  const animate = () => {
    if (stopped)
      return

    if (fn() === 'stop') {
      stopped = true
      scheduler.cancel(id)
      return
    }

    id = scheduler.request(animate)
  }

  animate()
  return () => {
    stopped = true
    scheduler.cancel(id)
  }
}
