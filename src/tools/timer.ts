/**
 * 节流函数
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒），默认 80ms
 * @param options 配置选项
 * @param options.makeSureNotToMissTask 确保不会因为节流而丢失最后一个任务，默认 true
 * @returns 节流后的函数
 *
 * @example
 * ```ts
 * // 基础用法
 * const throttledFn = throttle(() => {
 *   console.log('节流执行')
 * }, 1000)
 *
 * // 快速调用多次，但只会按间隔执行
 * throttledFn() // 立即执行
 * throttledFn() // 被节流
 * throttledFn() // 被节流
 * // 1秒后执行最后一次调用
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 滚动事件节流
 * const handleScroll = throttle(() => {
 *   console.log('滚动位置:', window.scrollY)
 * }, 100)
 *
 * window.addEventListener('scroll', handleScroll)
 * ```
 */
export function throttle<P extends any[]>(
  fn: (...args: P) => any,
  delay = 80,
  options: ThrottleOpts = {},
) {
  let st = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  const { makeSureNotToMissTask = true } = options

  /**
   * 确保不会因为节流而丢失最后一个任务
   */
  function runMissTask(fn: Function) {
    if (!makeSureNotToMissTask)
      return

    clear()
    timer = setTimeout(() => {
      fn()
    }, delay)
  }

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return function (this: any, ...args: P) {
    clear()
    const now = Date.now()

    if (now - st > delay) {
      st = now
      return fn.apply(this, args)
    }
    else {
      runMissTask(() => fn.apply(this, args))
    }
  }
}

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒），默认 200ms
 * @returns 防抖后的函数
 *
 * @example
 * ```ts
 * // 基础用法
 * const debouncedFn = debounce(() => {
 *   console.log('防抖执行')
 * }, 300)
 *
 * // 快速调用多次，只有最后一次调用会在延迟后执行
 * debouncedFn() // 取消之前的调用
 * debouncedFn() // 取消之前的调用
 * debouncedFn() // 300ms后执行
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 搜索输入防抖
 * const handleSearch = debounce((query: string) => {
 *   console.log('搜索:', query)
 *   // 执行搜索逻辑
 * }, 500)
 *
 * searchInput.addEventListener('input', (e) => {
 *   handleSearch(e.target.value)
 * })
 * ```
 */
export function debounce<P extends any[]>(
  fn: (...args: P) => any,
  delay = 200,
) {
  let id: ReturnType<typeof setTimeout> | undefined

  return function (this: any, ...args: P) {
    id !== undefined && clearTimeout(id)
    id = setTimeout(() => {
      return fn.apply(this, args)
    }, delay)
  }
}

/**
 * 使用 requestAnimationFrame 进行节流
 * @param fn 要节流的函数，可以是异步函数
 * @returns 节流后的函数
 *
 * @example
 * ```ts
 * // 基础用法
 * const rafThrottledFn = rafThrottle(() => {
 *   console.log('RAF 节流执行')
 * })
 *
 * // 快速调用多次，但只会在一帧内执行一次
 * rafThrottledFn() // 立即执行
 * rafThrottledFn() // 被节流
 * rafThrottledFn() // 被节流
 * // 下一帧时执行最后一次调用
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 动画性能优化
 * const updateAnimation = rafThrottle(() => {
 *   // 更新动画状态
 *   element.style.transform = `translateX(${scrollX}px)`
 * })
 *
 * window.addEventListener('scroll', updateAnimation)
 * ```
 *
 * @remarks
 * 非浏览器环境（如 Node）无 `requestAnimationFrame`，自动降级为 ~16ms 的 `setTimeout`，
 * 仅保证不抛错；动画语义本就依赖浏览器，Node 下请按需自行处理
 */
export function rafThrottle<P extends any[]>(
  fn: (...args: P) => any,
) {
  let lock = false

  return function (this: any, ...args: P) {
    if (lock)
      return
    lock = true

    raf(async () => {
      await fn.apply(this, args)
      lock = false
    })
  }
}

/**
 * 回退帧间隔(ms)，模块级缓存只算一次
 *
 * 真实刷新率只能靠 rAF 连续两帧测时间差，而本回退恰恰发生在「没有 rAF」的环境，
 * 那里既走不到原生 rAF、也测不出帧率，故用 60fps 标准间隔兜底
 */
const FALLBACK_FRAME_MS = Math.round(1000 / 60)

/**
 * 通用 requestAnimationFrame：浏览器用原生，非浏览器（如 Node）降级为按 60fps 的 setTimeout
 * 用 `typeof` 守卫，对未声明全局取值也不会抛 ReferenceError
 *
 * 返回 `void`：调度句柄无人使用，避免 `number` 与 Node `Timeout` 类型冲突
 */
function raf(cb: FrameRequestCallback): void {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(cb)
  }
  else {
    setTimeout(() => cb(Date.now()), FALLBACK_FRAME_MS)
  }
}

type ThrottleOpts = {
  /**
   * 确保不会因为节流而丢失最后一个任务
   * @default true
   */
  makeSureNotToMissTask?: boolean
}
