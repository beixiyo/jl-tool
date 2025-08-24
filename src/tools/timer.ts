/**
 * 节流
 * @param fn 要节流的函数
 * @param delay 延迟时间（ms）
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
 * 防抖
 * @param fn 要防抖的函数
 * @param delay 延迟时间（ms），@default 200
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
 * 用 requestAnimationFrame 节流，只有一帧内执行完毕，才会继续执行
 * @param fn 可以是异步函数
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
