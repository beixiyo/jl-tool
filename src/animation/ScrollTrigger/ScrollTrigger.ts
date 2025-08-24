import type { Scroller, ScrollTriggerOptions, ScrollTriggerState } from './types'
import { CSS_DEFAULT_VAL, WITHOUT_UNITS } from '@/constants'
import { clamp } from '@/math'
import { isObj } from '@/shared/is'
import { debounce, throttle } from '@/tools/timer'
import { uniqueId } from '@/tools/tools'
import { createAnimation } from '../createAnimation'
import { genTimeFunc } from '../timeFunc'
import { ScrollConfig } from './constants'
import { SmoothScroller } from './SmoothScroller'
import {
  createMarkers,
  getElement,
  getElementPosition,
  getPropVal,
  normalizeProps,
  normalizeTriggerPosition,
} from './tools'

/**
 * 触发器实现类
 */
export class ScrollTrigger implements Scroller {
  /** 公共属性 */
  progress = 0
  direction = 0
  isActive = false

  // ======================
  // * Private
  // ======================
  private state: ScrollTriggerState
  private options: Required<ScrollTriggerOptions>
  private markerElements: HTMLElement[] = []
  private animationFn: (curVal: number) => number
  private scrubEase: (p: number) => number = p => p
  private lastScrollPos = 0
  private id: string
  private resizeObserver: ResizeObserver | null = null
  private scrollHandler: Function | null = null
  private smoothScroller: SmoothScroller | null = null

  /** 目标进度值 */
  private targetProgress = 0
  /** 当前动画进度 */
  private currentProgress = 0
  /** 上次更新时间 */
  private lastTime = 0
  private animationFrameId: number | null = null
  /** 当前是否处于一次性播放动画中 */
  private isPlayingOnce = false

  constructor(options: ScrollTriggerOptions) {
    /** 生成唯一ID */
    this.id = options.id || uniqueId()

    /** 初始化默认选项 */
    this.options = {
      id: this.id,
      props: [],
      trigger: document.body,
      start: ['top', 'bottom'],
      end: ['bottom', 'top'],
      scroller: window,
      clamp: true,
      ease: 'linear',
      direction: 'vertical',
      immediateRender: true,
      once: false,
      priority: 0,
      disabled: false,
      markers: false,
      scrub: false,
      onUpdate: () => { },
      onEnter: () => { },
      onLeave: () => { },
      onEnterBack: () => { },
      onLeaveBack: () => { },
      animation: () => { },
      targets: null,
      onRefresh: () => { },
      onDestroy: () => { },
      duration: 500,
      smoothScroll: false,
      ...options,
    }

    /** 如果 scrub 为数字，使用 easeOut 作为惯性曲线 */
    if (typeof this.options.scrub === 'number') {
      this.scrubEase = genTimeFunc('easeOut')
    }

    /** 获取触发元素 */
    const triggerElement = getElement(this.options.trigger as string | HTMLElement) as HTMLElement | null

    /** 获取滚动容器 */
    const scrollerElement = getElement(this.options.scroller) as HTMLElement | Window

    /** 初始化状态 */
    this.state = {
      progress: 0,
      direction: 0,
      isActive: false,
      wasActive: false,
      disabled: this.options.disabled,
      startPos: 0,
      endPos: 0,
      triggerElement,
      scrollerElement,
    }

    /** 创建动画函数 */
    this.animationFn = createAnimation(0, 1, 0, 1, this.options.ease)

    /** 初始化 */
    this.init()

    /** 注册实例 */
    ScrollConfig.instances.set(this.id, this)

    /** 添加滚动监听器 */
    this.addScrollListener()
  }

  /**
   * 初始化触发器
   */
  private init(): void {
    if (!this.state.triggerElement) {
      console.error('无法找到触发元素')
      return
    }

    /** 计算开始和结束位置 */
    this.calculatePositions()

    /** 添加尺寸变化监听器 */
    this.addResizeObserver()

    /** 添加标记（如果启用） */
    if (this.options.markers) {
      const markerOptions = isObj(this.options.markers)
        ? this.options.markers
        : {}
      this.markerElements = createMarkers(
        this.state.startPos,
        this.state.endPos,
        {
          ...markerOptions,
          direction: this.options.direction,
          container: this.state.scrollerElement === window
            ? document.body
            : this.state.scrollerElement as HTMLElement,
        },
      )
    }

    /** 如果需要立即渲染，则立即更新一次 */
    if (this.options.immediateRender) {
      this.update()
    }
  }

  /**
   * 计算开始和结束位置
   */
  private calculatePositions(): void {
    if (!this.state.triggerElement || !this.state.scrollerElement)
      return

    const { direction } = this.options

    /** 解析开始位置 */
    const startConfig = normalizeTriggerPosition(this.options.start)
    this.state.startPos = getElementPosition(
      this.state.triggerElement,
      this.state.scrollerElement,
      startConfig.trigger,
      startConfig.scroller,
      startConfig.offset,
      direction,
    )

    /** 解析结束位置 */
    const endConfig = normalizeTriggerPosition(this.options.end)
    this.state.endPos = getElementPosition(
      this.state.triggerElement,
      this.state.scrollerElement,
      endConfig.trigger,
      endConfig.scroller,
      endConfig.offset,
      direction,
    )
  }

  /**
   * 添加调整大小观察器
   */
  private addResizeObserver(): void {
    if (!this.state.triggerElement)
      return

    /** 创建resize观察器 */
    this.resizeObserver = new ResizeObserver(
      debounce(() => {
        this.refresh()
      }, 100),
    )

    /** 开始观察 */
    this.resizeObserver.observe(this.state.triggerElement)
  }

  /**
   * 添加滚动监听器
   */
  private addScrollListener(): void {
    const scroller = this.state.scrollerElement
    if (!scroller)
      return

    /** 如果启用了平滑滚动 */
    if (this.options.smoothScroll) {
      if (!ScrollConfig.smoothScrollers.has(scroller)) {
        const smoothScrollOptions = isObj(this.options.smoothScroll)
          ? this.options.smoothScroll
          : {}
        const newScroller = new SmoothScroller(scroller, {
          ...smoothScrollOptions,
          direction: this.options.direction,
        })
        ScrollConfig.smoothScrollers.set(scroller, newScroller)
      }

      this.smoothScroller = ScrollConfig.smoothScrollers.get(scroller)!
      this.smoothScroller!.register(this)
      /** 在平滑滚动模式下，更新由 SmoothScroller 驱动，因此不添加原生滚动监听器 */
      return
    }

    /** 创建针对当前实例的滚动处理函数 */
    this.scrollHandler = throttle(() => {
      if (!this.state.disabled) {
        this.update()
      }
    }, 16)

    /** 检查该滚动容器是否已有监听器集合 */
    if (!ScrollConfig.scrollerListeners.has(scroller)) {
      ScrollConfig.scrollerListeners.set(scroller, new Set())
    }

    /** 添加当前实例ID到该滚动容器的监听集合 */
    const listenerSet = ScrollConfig.scrollerListeners.get(scroller)!
    listenerSet.add(this.id)

    /** 为滚动容器添加事件监听器 */
    scroller.addEventListener('scroll', this.scrollHandler as EventListener, { passive: true })
  }

  /**
   * 获取当前滚动位置
   */
  private getScrollPosition(): number {
    /** 如果启用了平滑滚动，则从 SmoothScroller 获取位置 */
    if (this.smoothScroller) {
      return this.smoothScroller.getCurrentScroll()
    }

    const { scrollerElement } = this.state
    const { direction } = this.options

    if (scrollerElement === window) {
      return direction === 'vertical'
        ? window.scrollY
        : window.scrollX
    }
    else {
      return direction === 'vertical'
        ? (scrollerElement as HTMLElement).scrollTop
        : (scrollerElement as HTMLElement).scrollLeft
    }
  }

  /**
   * 更新触发器状态
   */
  update(): ScrollTrigger {
    if (this.state.disabled)
      return this

    const currentScrollPos = this.getScrollPosition()

    /** 计算方向 */
    if (currentScrollPos !== this.lastScrollPos) {
      this.direction = currentScrollPos > this.lastScrollPos
        ? 1
        : -1
    }
    this.lastScrollPos = currentScrollPos

    /** 计算进度 */
    const { startPos, endPos } = this.state
    let rawProgress = (currentScrollPos - startPos) / (endPos - startPos)

    /** 如果需要，限制进度值在0-1范围内 */
    if (this.options.clamp) {
      rawProgress = clamp(rawProgress, 0, 1)
    }

    /** 处理 scrub 模式 */
    if (this.options.scrub === false) {
      /** 若当前仍在一次性播放中，则忽略滚动更新 */
      if (this.isPlayingOnce) {
        return this
      }

      const prevActive = this.isActive
      /** 判断当前是否在触发区间内 */
      const inRange = rawProgress > 0 && rawProgress < 1

      this.isActive = inRange
      this.state.wasActive = prevActive

      /** 进入触发区，启动一次性播放 */
      if (!prevActive && this.isActive) {
        const from = this.direction > 0
          ? 0
          : 1
        const to = this.direction > 0
          ? 1
          : 0
        this.playOnce(from, to)

        /** 执行进入回调 */
        this.executeCallbacks(prevActive)
      }
      else if (!this.isActive) {
        /** 已离开触发区，根据位置立即设定进度为0或1 */
        this.progress = rawProgress <= 0
          ? 0
          : 1

        this.applyProgress(this.progress)

        /** 如果之前在播放中，取消动画帧 */
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId)
          this.animationFrameId = null
          this.isPlayingOnce = false
        }

        /** 触发离开回调 */
        this.executeCallbacks(prevActive)
      }

      /** 如果配置为一次性，并且已离开视图，则销毁 */
      if (this.options.once && !this.isActive && (this.progress === 1)) {
        this.destroy()
      }

      return this
    }
    else {
      /**
       * 模式2和3: scrub=true 或 scrub=数字（延迟跟随）
       * 更新目标进度
       */
      this.targetProgress = rawProgress

      /* 每次目标进度变化重置 lastTime，避免首次帧 step=0 */
      this.lastTime = 0

      /** 对于 scrub=true，立即更新进度；对于 scrub=数字，启动动画帧更新 */
      if (this.options.scrub === true) {
        this.currentProgress = this.targetProgress
        this.applyProgress(this.currentProgress)
      }
      else if (typeof this.options.scrub === 'number' && this.animationFrameId === null) {
        /** 启动动画帧更新 */
        this.lastTime = 0
        this.animationFrameId = requestAnimationFrame(() => this.updateAnimation())
      }

      /** 更新激活状态 */
      const prevActive = this.isActive
      this.isActive = this.targetProgress > 0 && this.targetProgress < 1
      this.state.wasActive = prevActive

      /** 仅处理进入/离开回调，不重复执行动画 */
      if (prevActive !== this.isActive) {
        this.executeCallbacks(prevActive, true)
      }
    }

    /** 如果配置为一次性，并且已离开视图，则销毁 */
    if (this.options.once && this.progress >= 1) {
      this.destroy()
    }

    return this
  }

  /**
   * 执行回调函数
   */
  private executeCallbacks(prevActive: boolean, onlyStateChange: boolean = false): void {
    /** 调用回调函数 */
    if (!onlyStateChange) {
      this.options.onUpdate(this)
    }

    /** 进入/离开回调 */
    if (!prevActive && this.isActive) {
      if (this.direction > 0) {
        this.options.onEnter(this)
      }
      else {
        this.options.onEnterBack(this)
      }
    }
    else if (prevActive && !this.isActive) {
      if (this.direction > 0) {
        this.options.onLeave(this)
      }
      else {
        this.options.onLeaveBack(this)
      }
    }

    /** 处理方向变化 */
    if (!onlyStateChange && this.direction !== 0) {
      /** 方向变化可以添加特殊处理逻辑 */
    }

    /** 执行自定义动画函数 */
    if (!onlyStateChange) {
      this.options.animation(this.progress)

      /** 处理目标元素动画 */
      this.animateTargets()
    }
  }

  /**
   * 获取目标 DOM 元素
   */
  private getTargetElements(): HTMLElement[] {
    const { targets } = this.options
    if (!targets)
      return []

    const elements: HTMLElement[] = []

    if (typeof targets === 'string') {
      document.querySelectorAll(targets).forEach(el => elements.push(el as HTMLElement))
    }
    else if (targets instanceof HTMLElement) {
      elements.push(targets)
    }
    else if (targets instanceof NodeList || Array.isArray(targets)) {
      Array.from(targets).forEach(el => elements.push(el as HTMLElement))
    }
    return elements
  }

  /**
   * 处理目标元素的动画
   */
  private animateTargets(): void {
    const { props } = this.options
    const elements = this.getTargetElements()

    if (elements.length === 0 || !props || props.length === 0)
      return

    const {
      fromProps,
      toProps,
      allPropKeys,
    } = normalizeProps(props)

    elements.forEach((element, index) => {
      const transforms: string[] = []

      for (const prop of allPropKeys) {
        const startVal = getPropVal(fromProps[prop], index).toString()
        const endVal = getPropVal(toProps[prop], index).toString()

        const startNumVal = Number.parseFloat(startVal ?? CSS_DEFAULT_VAL[prop].toString() ?? '0')
        const endNumVal = Number.parseFloat(endVal ?? '0')

        if (endNumVal === undefined)
          continue

        const value = startNumVal + (endNumVal - startNumVal) * this.progress

        switch (prop) {
          case 'x':
          case 'y':
          case 'z':
            transforms.push(`translate${prop.toUpperCase()}(${value}px)`)
            break
          case 'scale':
          case 'scaleX':
          case 'scaleY':
            transforms.push(`${prop}(${value})`)
            break
          case 'rotate':
            transforms.push(`rotate(${value}deg)`)
            break

          default:
            if (WITHOUT_UNITS.has(prop)) {
              element.style[prop as any] = `${value}`
            }
            else {
              element.style[prop as any] = `${value}px`
            }
            break
        }
      }

      if (transforms.length > 0) {
        element.style.transform = transforms.join(' ')
      }
    })
  }

  /**
   * 刷新触发器
   */
  refresh(): ScrollTrigger {
    this.calculatePositions()

    /** 更新标记位置（如果有） */
    if (this.markerElements.length === 2) {
      const [startMarker, endMarker] = this.markerElements
      startMarker.style.top = `${this.state.startPos}px`
      endMarker.style.top = `${this.state.endPos}px`
    }

    /** 调用刷新回调 */
    this.options.onRefresh(this)

    /** 更新当前状态 */
    return this.update()
  }

  /**
   * 启用触发器
   */
  enable(): ScrollTrigger {
    if (this.state.disabled) {
      this.state.disabled = false
      this.update()
    }
    return this
  }

  /**
   * 禁用触发器
   */
  disable(): ScrollTrigger {
    this.state.disabled = true
    return this
  }

  /**
   * 销毁触发器并释放资源
   */
  destroy(): void {
    /** 删除实例 */
    ScrollConfig.instances.delete(this.id)

    /** 移除滚动事件监听器 */
    if (this.scrollHandler && this.state.scrollerElement) {
      this.state.scrollerElement.removeEventListener('scroll', this.scrollHandler as EventListener)

      /** 从监听器集合中移除当前实例 */
      const scroller = this.state.scrollerElement
      const listenerSet = ScrollConfig.scrollerListeners.get(scroller)

      if (listenerSet) {
        listenerSet.delete(this.id)

        /** 如果该滚动容器没有其他监听器，则清理集合 */
        if (listenerSet.size === 0) {
          ScrollConfig.scrollerListeners.delete(scroller)
        }
      }
    }

    /** 如果使用了平滑滚动，则注销并可能销毁 SmoothScroller */
    if (this.smoothScroller) {
      this.smoothScroller.deregister(this)

      /** 如果没有其他 trigger 在使用这个 SmoothScroller，则销毁它 */
      if ((this.smoothScroller as any).triggers.size === 0) {
        this.smoothScroller.destroy()
        ScrollConfig.smoothScrollers.delete(this.state.scrollerElement)
      }
    }

    /** 取消动画帧 */
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    /** 移除ResizeObserver */
    if (this.resizeObserver && this.state.triggerElement) {
      this.resizeObserver.unobserve(this.state.triggerElement)
      this.resizeObserver.disconnect()
    }

    /** 移除标记 */
    this.markerElements.forEach((marker) => {
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker)
      }
    })

    /** 调用销毁回调 */
    this.options.onDestroy(this)
  }

  /**
   * 处理延迟动画更新
   */
  private updateAnimation(): void {
    if (!this.options.scrub || typeof this.options.scrub !== 'number') {
      return
    }

    /** 计算当前时间 */
    const currentTime = performance.now()
    if (this.lastTime === 0) {
      this.lastTime = currentTime
      this.animationFrameId = requestAnimationFrame(() => this.updateAnimation())
      return
    }

    /** 计算时间差和应移动的进度量 */
    const deltaTime = (currentTime - this.lastTime) / 1000 // 转为秒
    const scrubDuration = typeof this.options.scrub === 'number'
      ? this.options.scrub
      : 0
    const progressDiff = this.targetProgress - this.currentProgress

    /** 根据延迟时间计算速度 */
    const ratio = scrubDuration > 0
      ? Math.min(1, deltaTime / scrubDuration)
      : 1
    const eased = this.scrubEase(ratio)
    const step = progressDiff * eased

    /** 更新当前进度 */
    if (Math.abs(progressDiff) > 0.001) {
      this.currentProgress += step
      this.applyProgress(this.currentProgress)
      this.lastTime = currentTime
      this.animationFrameId = requestAnimationFrame(() => this.updateAnimation())
    }
    else {
      this.currentProgress = this.targetProgress
      this.applyProgress(this.currentProgress)
      this.lastTime = 0
    }
  }

  /**
   * 应用进度值到动画
   */
  private applyProgress(progressValue: number): void {
    /** 保存当前真实进度值以供外部访问 */
    this.progress = progressValue

    /** 调用回调函数 */
    this.options.onUpdate(this)

    /** 执行自定义动画函数 */
    this.options.animation(progressValue)

    /** 处理目标元素动画 */
    this.animateTargets()
  }

  /**
   * 一次性播放动画
   */
  private playOnce(from: number, to: number): void {
    this.isPlayingOnce = true
    this.progress = from
    this.applyProgress(from)

    const animationDuration = this.options.duration
    const startTime = performance.now()

    const tick = () => {
      const currentTime = performance.now()
      const elapsedTime = currentTime - startTime
      const ratio = Math.min(1, elapsedTime / animationDuration)
      const eased = this.animationFn(ratio)
      const progress = from + (to - from) * eased

      this.progress = progress
      this.applyProgress(progress)

      if (ratio < 1) {
        this.animationFrameId = requestAnimationFrame(tick)
      }
      else {
        this.isPlayingOnce = false
        this.animationFrameId = null
      }
    }

    this.animationFrameId = requestAnimationFrame(tick)
  }

  /**
   * 静态方法：按照 priority 刷新所有实例
   */
  static refreshAll(): void {
    const instances = Array.from(ScrollConfig.instances.values())
      .sort((a, b) => b.options.priority - a.options.priority)
    instances.forEach(i => i.refresh())
  }

  /**
   * 根据ID获取滚动触发器实例
   * @param id 触发器ID
   * @returns 触发器实例或undefined
   */
  static getById(id: string): ScrollTrigger | undefined {
    return ScrollConfig.instances.get(id)
  }

  /**
   * 销毁所有滚动触发器
   */
  static destroyAll(): void {
    Array.from(ScrollConfig.instances.values()).forEach(instance => instance.destroy())
  }

  /**
   * 启用所有滚动触发器
   */
  static enableAll(): void {
    ScrollConfig.instances.forEach(instance => instance.enable())
  }

  /**
   * 禁用所有滚动触发器
   */
  static disableAll(): void {
    ScrollConfig.instances.forEach(instance => instance.disable())
  }

  /**
   * 获取所有 ScrollTrigger 实例
   * @returns ScrollTrigger 实例数组
   */
  static getAll(): ScrollTrigger[] {
    return Array.from(ScrollConfig.instances.values())
  }

  /**
   * 获取所有 ScrollTrigger 实例的 ID
   * @returns ScrollTrigger ID 数组
   */
  static getAllIds(): string[] {
    return Array.from(ScrollConfig.instances.keys())
  }
}
