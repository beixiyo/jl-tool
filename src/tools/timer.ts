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
  let timer: number | null = null
  const { makeSureNotToMissTask = true } = options

  /**
   * 确保不会因为节流而丢失最后一个任务
   */
  function runMissTask(fn: Function) {
    if (!makeSureNotToMissTask)
      return

    clear()
    timer = window.setTimeout(() => {
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
  let id: number

  return function (this: any, ...args: P) {
    id && clearTimeout(id)
    id = window.setTimeout(() => {
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
 */
export function rafThrottle<P extends any[]>(
  fn: (...args: P) => any,
) {
  let lock = false

  return function (this: any, ...args: P) {
    if (lock)
      return
    lock = true

    window.requestAnimationFrame(async () => {
      await fn.apply(this, args)
      lock = false
    })
  }
}

type ThrottleOpts = {
  /**
   * 确保不会因为节流而丢失最后一个任务
   * @default true
   */
  makeSureNotToMissTask?: boolean
}
