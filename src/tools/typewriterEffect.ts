/**
 * 模拟打字效果
 *
 * - 按时间计算下标而不是按 tick 计数，标签页隐藏导致定时器被节流时，恢复后进度仍然正确
 * - 固定文本：传 `content` 即可，打完 `promise` 完成
 * - 流式文本（如 LLM 输出）：设置 `streaming: true`，随到随用 `update(content)` 追加，落后超过 `maxLag` 个字符时自动跳过，
 *   全部到达后调用 `end()`，把剩余字符打完后 `promise` 完成；需要立即显示全部用 `flush()`
 *
 * @example
 * ```ts
 * const t = typewriterEffect({ content: '', streaming: true, onUpdate: render })
 * t.update('你好')
 * t.update('你好，世界')
 * t.end()
 * await t.promise
 * ```
 */
export function typewriterEffect(options: TypewriterEffectOptions): TypewriterEffectReturn {
  const {
    onUpdate,
    speed = 16,
    continueFromIndex = 0,
    streaming = false,
    maxLag = 200,
  } = options

  let content = options.content
  let startTime = Date.now() - continueFromIndex * speed
  let currentIndex = Math.min(continueFromIndex, content.length)
  let lastEmittedIndex = -1
  let ended = !streaming
  let finished = false
  let interval: ReturnType<typeof setInterval> | undefined
  const { resolve, promise } = Promise.withResolvers<void>()

  /** 处理页面可见性变化 */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      /** 重新计算时间差 */
      startTime = Date.now() - currentIndex * speed
    }
  }

  const finish = () => {
    if (finished) return

    finished = true
    clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    resolve()
  }

  const emit = () => {
    if (currentIndex === lastEmittedIndex) return

    lastEmittedIndex = currentIndex
    onUpdate?.(content.slice(0, currentIndex))
  }

  const tick = () => {
    const elapsed = Date.now() - startTime
    const targetIndex = Math.floor(elapsed / speed)
    currentIndex = Math.min(targetIndex, content.length)

    /** 流式文本到达速度超过打字速度时，落后量超过上限就跳过一段，之后继续匀速打 */
    if (streaming && content.length - currentIndex > maxLag) {
      currentIndex = content.length - maxLag
      startTime = Date.now() - currentIndex * speed
    }

    emit()

    /** 流式模式下追上已收到的文本也不能结束，要等 `end()` */
    if (ended && currentIndex >= content.length) finish()
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  /** 先注册定时器再首次 tick：已无字可打时 `finish` 需要拿到 `interval` 才能清理 */
  interval = setInterval(tick, speed)
  tick()

  return {
    promise,
    stop: finish,
    update: (nextContent) => {
      if (finished) return

      /** 已追上旧文本才在这里重新对齐起点，否则空闲期累积的时间会让新文本瞬间蹦出来 */
      if (currentIndex >= content.length) startTime = Date.now() - currentIndex * speed

      /** 新文本不是旧文本的延续（重试、改写）时，回退到相同前缀的末尾，不凭空保留已展示的字 */
      if (!nextContent.startsWith(content.slice(0, currentIndex))) {
        currentIndex = commonPrefixLength(content.slice(0, currentIndex), nextContent)
        startTime = Date.now() - currentIndex * speed
        lastEmittedIndex = -1
      }

      content = nextContent
      tick()
    },
    end: () => {
      if (finished) return

      ended = true
      tick()
    },
    flush: () => {
      if (finished) return

      currentIndex = content.length
      emit()
      finish()
    },
  }
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length)
  let i = 0
  while (i < max && a[i] === b[i]) i++
  return i
}

export type TypewriterEffectOptions = {
  /**
   * 打字速度，单位：ms
   * @default 16
   */
  speed?: number
  /** 每次进度变化时回调；进度没变化的 tick 不会回调 */
  onUpdate?: (txt: string) => void
  /** 要打出的文本；`streaming` 为 true 时是初始文本，后续用 `update` 追加 */
  content: string
  /**
   * 从指定索引继续打字，用于内容变化时不重新开始
   * @default 0
   */
  continueFromIndex?: number
  /**
   * 流式模式：追上已收到的文本时不结束，等待 `update` 追加新文本，直到调用 `end()` 或 `flush()`
   * @default false
   */
  streaming?: boolean
  /**
   * 仅流式模式生效：已收到但尚未打出的字符数超过该值时，直接跳过多余部分，避免内容太多一直追不上；
   * 设为 `Infinity` 关闭。固定文本不受影响，始终完整逐字打出
   * @default 200
   */
  maxLag?: number
}

export type TypewriterEffectReturn = {
  /** 全部打完（或被 `stop` / `flush`）后完成 */
  promise: Promise<void>
  /** 立即停止，保持当前已显示的内容，不再回调 */
  stop: VoidFunction
  /**
   * 替换为最新的完整文本，已展示的进度保持；新文本不是旧文本的延续时回退到相同前缀处
   * 已结束或已停止后调用无效
   */
  update: (content: string) => void
  /** 声明不会再有新文本，剩余字符打完后 `promise` 完成；非流式模式下无需调用 */
  end: VoidFunction
  /** 立即显示全部已收到的文本并结束 */
  flush: VoidFunction
}
