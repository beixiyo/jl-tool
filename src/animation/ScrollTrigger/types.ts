import type { TimeFunc } from '../types'
import type { ScrollTrigger } from './ScrollTrigger'
import type { BaseType } from '@/types'

/**
 * 位置类型，用于定义触发位置
 * 'top' | 'center' | 'bottom' | 'px值' | '百分比'
 */
export type PositionValue = 'top' | 'center' | 'bottom' | `${number}px` | `${number}%`

/**
 * 位置偏移配置
 * 可以是数字（像素值）或字符串（带单位）
 */
export type PositionOffset = number | `${number}px` | `${number}%` | `+=${number}` | `-=${number}`

export type TriggerPositionObj = {
  scroller: PositionValue
  trigger: PositionValue
  offset?: PositionOffset
}

/**
 * 触发位置配置
 * 可以是元组 [容器位置, 触发元素位置, 偏移量?]
 * 或者是对象 { scroller: 位置, trigger: 位置, offset?: 偏移量 }
 */
export type TriggerPosition =
  | [PositionValue, PositionValue, PositionOffset?]
  | TriggerPositionObj
  | string

/**
 * 标记配置
 */
export interface MarkersOptions {
  startColor?: string
  endColor?: string
  fontSize?: string
  indent?: number
}

/**
 * ScrollTrigger配置选项
 */
export interface ScrollTriggerOptions {
  /**
   * 触发动画元素，可以是选择器字符串或DOM元素
   * 默认为整个视口
   * @default document.body
   */
  trigger?: string | HTMLElement

  /**
   * 要执行动画的目标元素
   */
  targets?: string | HTMLElement | NodeList | HTMLElement[] | null

  /**
   * 滚动容器，默认为 window
   * @default window
   */
  scroller?: string | HTMLElement | Window

  /**
   * 动画属性配置
   * - 键为CSS属性，值为起始值和结束值的数组
   * - 可以仅仅传入一个一个元素，它会被视为结束值
   * - 如果传入两个元素，则视为起始值和结束值
   * - 例如：{ opacity: [0, 1], x: [0, 100] }
   */
  props?: ScrollTriggerProp[]

  /**
   * 开始触发的位置
   * 可以是元组 [容器位置, 触发元素位置, 偏移量?]
   * 或者是对象 { container: 位置, trigger: 位置, offset?: 偏移量 }
   * @default ['top', 'bottom']
   */
  start?: TriggerPosition

  /**
   * 结束触发的位置
   * 格式与 start 相同
   * @default ['bottom', 'top']
   */
  end?: TriggerPosition

  /**
   * 是否将进度值固定在 0-1 范围内
   * 使用 @jl-org/tool 的 clamp 函数
   * @default true
   */
  clamp?: boolean

  /**
   * 动画缓动函数
   * 使用 @jl-org/tool 的 timeFunc
   */
  ease?: TimeFunc

  /**
   * 滚动方向，水平或垂直
   * @default "vertical"
   */
  direction?: 'vertical' | 'horizontal'

  /**
   * 是否在初始化时立即执行一次
   * @default true
   */
  immediateRender?: boolean

  /**
   * 是否在离开视口时自动销毁
   * @default false
   */
  once?: boolean

  /**
   * 触发器的优先级，数值越大优先级越高
   * @default 0
   */
  priority?: number

  /**
   * 是否禁用触发器
   * @default false
   */
  disabled?: boolean

  /**
   * 进度变化时的回调函数
   */
  onUpdate?: (self: ScrollTrigger) => void

  /**
   * 进入触发区域时的回调函数
   */
  onEnter?: (self: ScrollTrigger) => void

  /**
   * 离开触发区域时的回调函数
   */
  onLeave?: (self: ScrollTrigger) => void

  /**
   * 重新进入触发区域时的回调函数
   */
  onEnterBack?: (self: ScrollTrigger) => void

  /**
   * 重新离开触发区域时的回调函数
   */
  onLeaveBack?: (self: ScrollTrigger) => void

  /**
   * 自定义动画函数
   */
  animation?: (progress: number) => void

  /**
   * 标记，用于分组或识别特定的触发器
   */
  markers?: boolean | MarkersOptions

  /**
   * 触发器的唯一ID
   */
  id?: string

  /**
   * 刷新时的回调函数
   */
  onRefresh?: (self: ScrollTrigger) => void

  /**
   * 触发器被销毁时的回调函数
   */
  onDestroy?: (self: ScrollTrigger) => void

  /**
   * 是否启用 scrub，使动画进度如何与滚动位置关联
   * - false（默认）：首次滚入触发区时按动画自身 duration 播放一次，
   *   播放过程中与滚动条脱钩；离开区间后再次进入会重新播放
   * - true：动画进度严格绑定滚动位置，滚动停止即暂停，反向滚动即倒放
   * - number：与 true 相同，但动画进度以该数值（秒）为延迟平滑跟随滚动（值越大越滞后）
   * @default false
   */
  scrub?: boolean | number

  /**
   * scrub:false 时，一次性动画的持续时间（毫秒）
   * @default 500
   */
  duration?: number

  /**
   * 是否启用平滑滚动，可以传入一个对象进行配置
   * @default false
   */
  smoothScroll?: boolean | SmoothScrollerOptions
}

export type ScrollTriggerPropValue = ((index: number) => BaseType) | BaseType
export type ScrollTriggerProp = Record<string, ScrollTriggerPropValue>

/**
 * 内部使用的ScrollTrigger状态
 */
export interface ScrollTriggerState {
  progress: number
  direction: number
  isActive: boolean
  wasActive: boolean
  disabled: boolean
  startPos: number
  endPos: number
  triggerElement: HTMLElement | null
  scrollerElement: HTMLElement | Window
}

export interface SmoothScrollerOptions {
  lerp?: number
  direction?: 'vertical' | 'horizontal'
  /**
   * 判断平滑滚动是否停止的延迟时间
   * @default 150
   */
  wheelIdleTimeout?: number
}

export type Scroller = {
  update: (scrollPosition: number) => void
  clear?: () => void
}
