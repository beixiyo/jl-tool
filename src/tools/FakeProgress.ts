/**
 * 虚假进度条
 *
 * @example
 * ```ts
 * const progress = new FakeProgress({ ... })
 * console.log(progress.progress)
 * ```
 */
export class FakeProgress {
  timeConstant = 10000
  /** 进度，0 ~ 1 之间 */
  progress = 0

  onChange?: (progress: number) => void

  private intervalId?: number
  private intervalFrequency = 100
  private startTime = 0
  private initialProgress = 0

  constructor(fakeProgressOpts: FakeProgressOpts = {}) {
    const {
      autoStart = true,
      timeConstant = 60000,
      initialProgress = 0,
      onChange,
    } = fakeProgressOpts

    this.timeConstant = timeConstant
    this.progress = initialProgress
    this.initialProgress = initialProgress
    this.onChange = onChange

    autoStart && this.start()
  }

  start() {
    this.stop()
    this.startTime = Date.now()

    this.intervalId = window.setInterval(() => {
      const elapsedTime = Date.now() - this.startTime
      const deltaProgress = 1 - Math.exp(-elapsedTime / this.timeConstant * 2)
      const nextProgress = this.initialProgress + (1 - this.initialProgress) * deltaProgress

      /** 更新进度，但确保不会回退 */
      if (nextProgress > this.progress) {
        this.setProgress(nextProgress)
      }
    }, this.intervalFrequency)
  }

  stop() {
    clearInterval(this.intervalId)
  }

  end() {
    this.stop()
    this.setProgress(1)
  }

  setProgress(value: number) {
    value > 1 && (value = 1)
    this.progress = value
    this.initialProgress = value

    this.startTime = Date.now()
    this.onChange?.(value)
  }
}

export type FakeProgressOpts = {
  /**
   * 时间系数，毫秒为单位
   * @default 10000
   */
  timeConstant?: number
  /**
   * 是否自动开始
   * @default true
   */
  autoStart?: boolean
  /**
   * 初始进度
   * @default 0
   */
  initialProgress?: number

  onChange?: (progress: number) => void
}
