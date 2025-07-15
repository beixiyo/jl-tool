/**
 * 模拟打字效果
 */
export function typewriterEffect(options: TypewriterEffectOptions) {
  const {
    content,
    onUpdate,
    speed = 16,
    continueFromIndex = 0,
  } = options

  let startTime = Date.now() - continueFromIndex * speed
  let currentIndex = continueFromIndex
  const { resolve, promise } = Promise.withResolvers<void>()

  /** 处理页面可见性变化 */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      /** 重新计算时间差 */
      startTime = Date.now() - currentIndex * speed
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  const update = () => {
    const elapsed = Date.now() - startTime
    const targetIndex = Math.floor(elapsed / speed)
    currentIndex = Math.min(targetIndex, content.length)

    onUpdate?.(content.slice(0, currentIndex))

    /** 检查是否已完成打字，如果是则停止并清理资源 */
    if (currentIndex >= content.length) {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      resolve()
    }
  }

  /** 初始立即执行一次 */
  update()

  const interval = setInterval(update, speed)
  const stop = () => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    resolve()
  }

  return { promise, stop }
}

export type TypewriterEffectOptions = {
  /**
   * 打字速度，单位：ms
   * @default 16
   */
  speed?: number
  onUpdate?: (txt: string) => void
  content: string
  /**
   * 从指定索引继续打字，用于内容变化时不重新开始
   * @default 0
   */
  continueFromIndex?: number
}
