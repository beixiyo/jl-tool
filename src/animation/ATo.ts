import { createAnimationByTime } from '@/animation/createAnimationByTime'
import type { AnimationOpts } from '@/types'
import type { AnimiateParams, FinalProp } from '@/types/tools'
import { isFn } from '@/shared'


/**
 * 一个动画类 能够链式调用; 请先调用`start`函数, 参数和`createAnimationByTime`一致
 * @example
 * ```ts
 * const aTo = new ATo()
 * aTo
 *     .start(
 *         div1.style,
 *         {
 *             left: '200px',
 *             top: '200px',
 *             opacity: '0.1'
 *         },
 *         1000
 *     )
 *     .next(
 *         div2.style,
 *         {
 *             translateX: '50vw',
 *             translateY: '300px',
 *         },
 *         2000,
 *         {
 *             transform: true,
 *             timeFunc: 'ease-in-out'
 *         }
 *     )
 * ```
 */
export class ATo {
  private animateArr: AnimiateParams[] = []
  /** 等待被执行的动画 */
  private pendingAnimateArr: AnimiateParams[] = []
  /** 所有停止动画的函数 */
  private animateStopArr: Function[] = []

  /**
   * 开始执行动画 首次执行请先调用此函数
   * @param target 要修改的对象 如果是 `CSSStyleDeclaration` 对象，则单位默认为 `px`
   * @param finalProps 要修改对象的最终属性值
   * @param durationMS 动画持续时间
   * @param animationOpts 配置项 可选参数
   * @returns 返回一个停止动画函数
   */
  start<T, P extends FinalProp>(
    target: T,
    finalProps: P,
    durationMS: number,
    animationOpts?: AnimationOpts<T, P>
  ) {
    this.animateArr.push([target, finalProps, durationMS, animationOpts || {}])
    this.addAnimate(this.animateArr)
    return this
  }

  /**
   * 等待上一个动画完成后执行，**第一次请先调用 `start` 函数**
   * @param target 要修改的对象，可以是一个函数（用来获取同一个对象不同时间的值）。如果是 `CSSStyleDeclaration` 对象，则单位默认为 `px`
   * @param finalProps 要修改对象的最终属性值
   * @param durationMS 动画持续时间
   * @param animationOpts 配置项 可选参数
   * @returns 返回一个停止动画函数
   */
  next<T, P extends FinalProp>(
    target: T | (() => any),
    finalProps: P,
    durationMS: number,
    animationOpts?: AnimationOpts<T, P>
  ) {
    this.pendingAnimateArr.push([target, finalProps, durationMS, animationOpts || {}])
    return this
  }

  /** 停止所有动画 */
  stop() {
    let _stopAnimate: Function
    while (_stopAnimate = this.animateStopArr.shift()) {
      _stopAnimate()
    }
  }

  /** 添加并执行一个动画 */
  private addAnimate(animateArr: AnimiateParams[]) {
    const animate = animateArr.shift()
    if (!animate) return

    const { onEnd } = animate[3]
    /** 重写函数，实现动画完成后继续添加 */
    const _onEnd = (target: any, diffProps: any) => {
      onEnd?.(target, diffProps)
      this.addAnimate(this.pendingAnimateArr)
    }

    /** 混合配置项 */
    const opt = animate[3]
      ? Object.assign({}, animate[3], { onEnd: _onEnd })
      : { onEnd: _onEnd }

    const params = [...animate.slice(0, 3), opt]
    if (isFn(params[0])) {
      params[0] = params[0]()
    }

    const animateFn = createAnimationByTime.apply(null, params)
    this.animateStopArr.push(animateFn)
  }
}
