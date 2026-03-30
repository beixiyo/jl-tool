import type { ScrollTrigger } from './ScrollTrigger'
import type { Scroller, SmoothScrollerOptions } from './types'
import { clamp } from '@/math'

/**
 * 帧率无关的阻尼插值（参考 Lenis / Rory Driscoll）
 * {@link http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/}
 */
function damp(current: number, target: number, lambda: number, deltaTime: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * deltaTime))
}

/**
 * @class SmoothScroller
 * @description 平滑滚动器类，采用 Lenis 风格的滚动劫持方案。
 *
 * 核心流程：
 * 1. 拦截 wheel 事件，阻止默认滚动
 * 2. 将 deltaY 累加到 targetScroll
 * 3. 每帧用 damp（帧率无关阻尼）平滑追踪 targetScroll
 * 4. 用 scrollTo({ behavior: 'instant' }) 设置实际滚动位置
 *
 * 滚动条兼容：通过 scroll 事件 + preventNextNativeScroll 标志
 * 区分"自身触发"和"外部拖动"的滚动事件
 */
export class SmoothScroller {
  private element: HTMLElement | Window
  private options: Required<SmoothScrollerOptions>
  private triggers: Set<Scroller> = new Set()
  private animationFrameId: number | null = null

  /** 当前平滑滚动位置 */
  private currentScroll = 0
  /** 目标滚动位置 */
  private targetScroll = 0
  /** 上一帧的时间戳（ms） */
  private lastTime = 0
  /**
   * 跳过下一次原生 scroll 事件
   * scrollTo 会触发原生 scroll 事件，需要区分是自身触发还是用户拖动滚动条
   */
  private preventNextNativeScroll = false

  constructor(element: HTMLElement | Window, options: SmoothScrollerOptions = {}) {
    this.element = element
    this.options = {
      lerp: 0.1,
      direction: 'vertical',
      wheelIdleTimeout: 150,
      ...options,
    }

    this.currentScroll = this.getScroll()
    this.targetScroll = this.currentScroll

    this.onWheel = this.onWheel.bind(this)
    this.onScroll = this.onScroll.bind(this)
    this.update = this.update.bind(this)

    /** wheel 事件必须 passive: false 才能 preventDefault */
    this.element.addEventListener('wheel', this.onWheel, { passive: false })
    /**
     * 监听原生 scroll 事件，用于检测滚动条拖拽等外部滚动
     * scrollTo 触发的 scroll 事件会被 preventNextNativeScroll 跳过
     */
    this.element.addEventListener('scroll', this.onScroll, { passive: true })
  }

  private getScroll(): number {
    const isVertical = this.options.direction === 'vertical'
    if (this.element === window) {
      return isVertical
        ? window.scrollY
        : window.scrollX
    }
    const el = this.element as HTMLElement
    return isVertical
      ? el.scrollTop
      : el.scrollLeft
  }

  private setScroll(value: number): void {
    const rounded = Math.round(value)
    const isVertical = this.options.direction === 'vertical'

    /** 标记下一次 scroll 事件是自身触发，跳过外部检测 */
    this.preventNextNativeScroll = true

    if (this.element === window) {
      window.scrollTo({
        [isVertical
          ? 'top'
          : 'left']: rounded,
        behavior: 'instant',
      })
    }
    else {
      (this.element as HTMLElement)[isVertical
        ? 'scrollTop'
        : 'scrollLeft'] = rounded
    }
  }

  private getMaxScroll(): number {
    const isVertical = this.options.direction === 'vertical'
    if (this.element === window) {
      return isVertical
        ? document.documentElement.scrollHeight - window.innerHeight
        : document.documentElement.scrollWidth - window.innerWidth
    }
    const el = this.element as HTMLElement
    return isVertical
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth
  }

  /**
   * 归一化 deltaY（处理 deltaMode）
   * deltaMode: 0=像素, 1=行(≈100/6px，与 Lenis 一致), 2=页(≈视口高度)
   */
  private normalizeDelta(event: WheelEvent): number {
    const { deltaY, deltaMode } = event
    if (deltaMode === 1)
      return deltaY * (100 / 6)
    if (deltaMode === 2)
      return deltaY * window.innerHeight
    return deltaY
  }

  /**
   * wheel 事件处理：拦截滚动，累加 delta
   */
  private onWheel(event: Event): void {
    const e = event as WheelEvent
    /** 缩放操作（Ctrl+滚轮）不拦截 */
    if (e.ctrlKey)
      return

    e.preventDefault()

    this.targetScroll += this.normalizeDelta(e)
    this.targetScroll = clamp(this.targetScroll, 0, this.getMaxScroll())

    this.startLoop()
  }

  /**
   * 原生 scroll 事件处理（检测滚动条拖拽）
   * scrollTo 触发的 scroll 会被 preventNextNativeScroll 跳过
   */
  private onScroll(): void {
    if (this.preventNextNativeScroll) {
      this.preventNextNativeScroll = false
      return
    }
    /** 非自身触发的滚动（用户拖动滚动条），同步内部状态 */
    const actual = this.getScroll()
    this.currentScroll = actual
    this.targetScroll = actual
    this.updateTriggers()
  }

  /** 启动 rAF 循环（如果尚未运行） */
  private startLoop(): void {
    if (this.animationFrameId === null) {
      this.lastTime = 0
      this.animationFrameId = requestAnimationFrame(this.update)
    }
  }

  /**
   * rAF 循环：damp 平滑追踪 targetScroll，驱动页面滚动
   */
  private update(time: number): void {
    const deltaTime = this.lastTime === 0
      ? 1 / 60
      : (time - this.lastTime) / 1000
    this.lastTime = time

    this.currentScroll = damp(
      this.currentScroll,
      this.targetScroll,
      this.options.lerp * 60,
      deltaTime,
    )

    this.setScroll(this.currentScroll)
    this.updateTriggers()

    /** 像素级到达目标后停止循环 */
    if (Math.round(this.currentScroll) === Math.round(this.targetScroll)) {
      this.currentScroll = this.targetScroll
      this.setScroll(this.currentScroll)
      this.updateTriggers()
      this.animationFrameId = null
      this.lastTime = 0
      return
    }

    this.animationFrameId = requestAnimationFrame(this.update)
  }

  private updateTriggers(): void {
    this.triggers.forEach(trigger => trigger.update(this.currentScroll))
  }

  register(trigger: ScrollTrigger): void {
    this.triggers.add(trigger)
  }

  deregister(trigger: ScrollTrigger): void {
    this.triggers.delete(trigger)
  }

  getCurrentScroll(): number {
    return this.currentScroll
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.element.removeEventListener('wheel', this.onWheel as EventListener)
    this.element.removeEventListener('scroll', this.onScroll as EventListener)
    this.triggers.clear()
  }
}
