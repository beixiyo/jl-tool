import type { ScrollTrigger } from './ScrollTrigger'
import type { Scroller, SmoothScrollerOptions } from './types'
import { clamp } from '@jl-org/tool'

/**
 * @class SmoothScroller
 * @description 平滑滚动器类，用于实现自定义元素的平滑滚动效果。
 * 它通过插值计算实现平滑滚动，并支持垂直或水平方向的滚动。
 */
export class SmoothScroller {
  /** 滚动元素，可以是 HTMLElement 或 Window */
  private element: HTMLElement | Window
  /** 滚动选项，包含插值因子和滚动方向 */
  private options: Required<SmoothScrollerOptions>
  /** 注册的滚动触发器集合 */
  private triggers: Set<Scroller> = new Set()
  // requestAnimationFrame 的 ID，用于控制动画循环
  private animationFrameId: number | null = null

  /** 当前滚动位置 */
  private currentScroll = 0
  /** 目标滚动位置 */
  private targetScroll = 0
  /** 是否正在滚动（通过滚轮） */
  private isWheeling = false
  /** 滚轮事件的超时计时器 */
  private wheelTimeout: NodeJS.Timeout | null = null

  /**
   * 构造函数
   * @param element 要应用平滑滚动的 DOM 元素或 Window 对象
   * @param options 滚动选项，可选，包含 lerp（插值因子）和 direction（滚动方向）
   */
  constructor(element: HTMLElement | Window, options: SmoothScrollerOptions = {}) {
    this.element = element
    this.options = {
      lerp: 0.1,
      direction: 'vertical',
      wheelIdleTimeout: 150,
      ...options,
    }

    /** 初始化当前滚动位置和目标滚动位置 */
    this.currentScroll = this.getScroll()
    this.targetScroll = this.currentScroll

    /** 绑定事件处理函数，确保 `this` 上下文正确 */
    this.handleWheel = this.handleWheel.bind(this)
    this.update = this.update.bind(this)

    /** 监听滚轮事件，并阻止默认行为以实现自定义滚动 */
    this.element.addEventListener('wheel', this.handleWheel, { passive: false })
  }

  /**
   * 获取当前滚动位置
   * @returns 当前滚动位置的数值
   */
  private getScroll(): number {
    /** 判断是否为垂直滚动 */
    const isVertical = this.options.direction === 'vertical'
    /** 如果是 Window 对象，则获取 window.scrollY 或 window.scrollX */
    if (this.element === window) {
      return isVertical
        ? window.scrollY
        : window.scrollX
    }
    /** 如果是 HTMLElement，则获取 scrollTop 或 scrollLeft */
    const el = this.element as HTMLElement
    return isVertical
      ? el.scrollTop
      : el.scrollLeft
  }

  /**
   * 设置滚动位置
   * @param value 要设置的滚动位置
   */
  private setScroll(value: number): void {
    /** 判断是否为垂直滚动 */
    const isVertical = this.options.direction === 'vertical'
    /** 如果是 Window 对象，则使用 window.scrollTo */
    if (this.element === window) {
      window.scrollTo({
        [isVertical
          ? 'top'
          : 'left']: value,
      })
    }
    /** 如果是 HTMLElement，则直接设置 scrollTop 或 scrollLeft */
    else {
      (this.element as HTMLElement)[isVertical
        ? 'scrollTop'
        : 'scrollLeft'] = value
    }
  }

  /**
   * 获取最大滚动距离
   * @returns 最大滚动距离的数值
   */
  private getMaxScroll(): number {
    /** 判断是否为垂直滚动 */
    const isVertical = this.options.direction === 'vertical'
    /** 如果是 Window 对象，则计算文档的滚动高度/宽度减去视口高度/宽度 */
    if (this.element === window) {
      return isVertical
        ? document.documentElement.scrollHeight - window.innerHeight
        : document.documentElement.scrollWidth - window.innerWidth
    }
    /** 如果是 HTMLElement，则计算元素的滚动高度/宽度减去客户端高度/宽度 */
    const el = this.element as HTMLElement
    return isVertical
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth
  }

  /**
   * 滚轮事件处理函数
   * @param event 滚轮事件对象
   */
  private handleWheel(event: Event): void {
    const wheelEvent = event as WheelEvent
    /** 只有当有注册的触发器时才阻止默认的滚轮行为，以实现自定义滚动 */
    if (this.triggers.size > 0) {
      wheelEvent.preventDefault()
    }

    /** 设置正在滚动的标志 */
    this.isWheeling = true
    /** 清除之前的滚轮超时计时器 */
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout)
    }
    /** 设置新的滚轮超时计时器，在一定时间后重置 isWheeling 标志 */
    this.wheelTimeout = setTimeout(() => {
      this.isWheeling = false
    }, this.options.wheelIdleTimeout) // 150毫秒后认为滚轮停止

    /** 根据滚轮的 deltaY 更新目标滚动位置 */
    this.targetScroll += wheelEvent.deltaY
    /** 将目标滚动位置限制在有效范围内（0 到最大滚动距离） */
    this.targetScroll = clamp(this.targetScroll, 0, this.getMaxScroll())

    /** 如果动画帧循环未启动，则请求新的动画帧 */
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.update)
    }
  }

  /**
   * 更新滚动位置和触发器
   * 该方法会在每一帧动画中被调用，实现平滑滚动效果
   */
  private update(): void {
    /** 计算目标滚动位置与当前滚动位置的差值 */
    const diff = this.targetScroll - this.currentScroll

    /** 如果差值足够小（小于0.1），则认为已到达目标位置，停止动画循环 */
    if (Math.abs(diff) < 0.1) {
      this.currentScroll = this.targetScroll // 将当前滚动位置设置为目标位置
      this.setScroll(this.currentScroll) // 设置实际滚动位置

      /** 即使停止了动画，也可能需要最后一次更新触发器 */
      this.updateTriggers()

      /** 如果仍在滚轮滚动中，则继续请求动画帧，以处理可能连续的滚轮事件 */
      if (this.isWheeling) {
        this.animationFrameId = requestAnimationFrame(this.update)
      }
      /** 否则，停止动画循环 */
      else {
        this.animationFrameId = null
      }
      return
    }

    /** 根据插值因子（lerp）平滑地更新当前滚动位置 */
    this.currentScroll += diff * this.options.lerp
    /** 设置实际滚动位置 */
    this.setScroll(this.currentScroll)
    /** 更新所有注册的滚动触发器 */
    this.updateTriggers()

    /** 请求下一帧动画 */
    this.animationFrameId = requestAnimationFrame(this.update)
  }

  /**
   * 更新所有注册的滚动触发器
   */
  private updateTriggers(): void {
    /** 遍历所有触发器，并调用其 update 方法，传入当前滚动位置 */
    this.triggers.forEach(trigger => trigger.update(this.getCurrentScroll()))
  }

  /**
   * 注册一个滚动触发器
   * @param trigger 要注册的 ScrollTrigger 实例
   */
  register(trigger: ScrollTrigger): void {
    this.triggers.add(trigger)
  }

  /**
   * 注销一个滚动触发器
   * @param trigger 要注销的 ScrollTrigger 实例
   */
  deregister(trigger: ScrollTrigger): void {
    this.triggers.delete(trigger)
  }

  /**
   * 获取当前的滚动位置
   * @returns 当前的滚动位置
   */
  getCurrentScroll(): number {
    return this.currentScroll
  }

  /**
   * 销毁平滑滚动器实例，移除事件监听器和清除计时器
   */
  destroy(): void {
    /** 取消动画帧循环 */
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    /** 清除滚轮超时计时器 */
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout)
    }
    /** 移除滚轮事件监听器 */
    this.element.removeEventListener('wheel', this.handleWheel as EventListener)
    /** 清空所有注册的触发器 */
    this.triggers.clear()
  }
}
