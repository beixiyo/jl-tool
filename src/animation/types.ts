import type { timeFunc } from './timeFunc'
import type { OnUpdate } from '@/types'

export type SetValOpts<T, P> = {
  /** 目标对象 */
  target: T
  /** 最终值对象和目标的差值 */
  diffProps: any
  /**  进度百分比 `0 ~ 1` */
  progress: number
  /**
   * 单位
   * 动画单位优先级 : `finalProps` > `opt.unit` > `rawEl`
   */
  optUnit?: string
  /**
   * 更改的回调函数
   */
  onUpdate?: OnUpdate<T, P>
  /**
   * 每次更新值的回调
   */
  callback?: OnUpdate<T, P>
  /**
   * 开启解析 transform
   * @default true
   */
  enableTransform?: boolean
  /** 精度 */
  precision?: number | undefined
}

export type TimeFuncStr = keyof typeof timeFunc
/**
 * ### 动画过渡函数
 * 支持内置函数和函数，函数需要返回一个 `0 ~ 1` 之间的值
 */
export type TimeFunc = TimeFuncStr | ((progress: number) => number)
