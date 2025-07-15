import type { CreateAnimationByTimeConfig } from '@/animation/types'
import { createAnimationByTime } from '@/animation/createAnimationByTime'
import { isFn } from '@/shared'

type AToAnimationConfig = CreateAnimationByTimeConfig & {
  target: any | (() => any)
}

/**
 * 一个动画类 能够链式调用; 请先调用`start`函数, 参数和`createAnimationByTime`一致
 * @example
 * ```ts
 * const aTo = new ATo()
 * aTo
 *     .start(
 *         {
 *           target: div1,
 *           to: {
 *               left: '200px',
 *               top: '200px',
 *               opacity: '0.1'
 *           },
 *           duration: 1000
 *         }
 *     )
 *     .next(
 *         {
 *           target: div2,
 *           to: {
 *               x: '50vw',
 *               y: '300px',
 *           },
 *           duration: 2000,
 *           ease: 'ease-in-out'
 *         }
 *     )
 * ```
 */
export class ATo {
  private animateArr: AToAnimationConfig[] = []
  /** 等待被执行的动画 */
  private pendingAnimateArr: AToAnimationConfig[] = []
  /** 所有停止动画的函数 */
  private animateStopArr: Function[] = []

  /**
   * 开始执行动画 首次执行请先调用此函数
   * @param config 动画配置, 与`createAnimationByTime`的参数一致
   * @returns this
   */
  start(
    config: AToAnimationConfig,
  ) {
    this.animateArr.push(config)
    this.addAnimate(this.animateArr)
    return this
  }

  /**
   * 等待上一个动画完成后执行，**第一次请先调用 `start` 函数**
   * @param config 动画配置, 与`createAnimationByTime`的参数一致
   * @returns this
   */
  next(
    config: AToAnimationConfig,
  ) {
    this.pendingAnimateArr.push(config)
    return this
  }

  /** 停止所有动画 */
  stop() {
    let _stopAnimate: Function | undefined
    while ((_stopAnimate = this.animateStopArr.shift()))
      _stopAnimate()
  }

  /** 添加并执行一个动画 */
  private addAnimate(animateArr: AToAnimationConfig[]) {
    const animateConfig = animateArr.shift()
    if (!animateConfig)
      return

    const { onComplete } = animateConfig

    /** 重写函数，实现动画完成后继续添加 */
    const _onComplete = () => {
      onComplete?.()
      this.addAnimate(this.pendingAnimateArr)
    }

    const config = { ...animateConfig, onComplete: _onComplete }

    if (isFn(config.target))
      config.target = config.target()

    const { stop } = createAnimationByTime(config as CreateAnimationByTimeConfig)
    this.animateStopArr.push(stop)
  }
}
