import type { timeFunc } from './timeFunc'

export type TimeFuncStr = keyof typeof timeFunc
/**
 * ### 动画过渡函数
 * 支持内置函数和函数，函数需要返回一个 `0 ~ 1` 之间的值
 */
export type TimeFunc = TimeFuncStr | ((progress: number) => number)

export interface CreateAnimationByTimeConfig<T = any> {
  /** 动画目标（DOM元素或普通对象） */
  target: T | T[] | NodeList | HTMLElement | HTMLElement[] | CSSStyleDeclaration
  /** 目标属性 -> 终值（仅接受数值） */
  to: Partial<Record<string, number>>
  /** 持续时间 (ms) */
  duration: number
  /** 缓动函数名或自定义函数，默认 linear */
  ease?: TimeFunc
  /** 每帧回调 */
  onUpdate?: (progress: number) => void
  /** 完成回调 */
  onComplete?: () => void
}

export interface AnimationHandle {
  /** 停止动画 */
  stop: VoidFunction
}
