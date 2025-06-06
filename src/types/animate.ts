import type { TimeFunc } from '@/animation/timeFunc'
import type { PropMap } from '@/types/tools'

export type AnimationOpts<T, P> = {
  /**
   * - 动画缓动函数类型，支持内置函数和函数
   * - 函数需要返回一个 `0 ~ 1` 之间的值
   * @default 'linear'
   */
  timeFunc?: TimeFunc

  /**
   * 动画备选单位，该参数对 *transform* 无效，优先级: `finalProps` > `opt.unit` > `rawEl（原始 DOM 的单位）`
   *
   * 如果 ***target 是 CSSStyleDeclaration*** 并且
   * ***不是 transform*** 属性 并且
   * ***样式表和 finalProps 都没有单位***，则使用 `px` 作为 `CSS` 单位
   */
  unit?: string

  /** 手动触发更新回调 */
  onUpdate?: OnUpdate<T, P>
  /** 动画结束回调 */
  onEnd?: (target: T, diffProps: PropMap<P>) => void
  /** 每次更新值的回调 */
  callback?: OnUpdate<T, P>

  /** 开启自动解析 `transform` 属性 */
  transform?: boolean

  /** 是否开启精度修正 */
  precision?: number
}

/**
 * @param props **初始值, 最终值和初始值的差值** 的对象
 * @param progress 当前进度
 * @param target 要修改的对象
 */
export type OnUpdate<T, P> = (
  /** **初始值, 最终值和初始值的差值** 的对象 */
  props: PropMap<P>,
  /** 当前进度 */
  progress: number,
  /** 要修改的对象 */
  target: T,
) => void
