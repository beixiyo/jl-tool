export class Clock {
  private readonly _getNow: () => number
  private _startedAt = 0
  private _pausedAt: number | undefined
  private _pausedDuration = 0
  private _lastUpdateAt = 0
  private _running = false

  /** 每帧时间间隔（秒） */
  delta = 0
  /** 每帧时间间隔（毫秒） */
  deltaMS = 0

  /**
   * 时间采样器，可获取
   * - 帧间时间间隔
   * - 累计时间
   * - 起始时间
   * - 当前时间
   */
  constructor(options: ClockOptions = {}) {
    this._getNow = options.getNow ?? createTimeGetter(options.timeApi)

    if (options.autoStart ?? true)
      this.start()
  }

  /** 当前原始时间 */
  get now() {
    return this._getNow()
  }

  /** 开始时间 */
  get startTime() {
    return this._startedAt
  }

  /** 当前采样时间 */
  get curTime() {
    return this._pausedAt ?? this.now
  }

  /** 暂停开始时间 */
  get pausedAt() {
    return this._pausedAt
  }

  /** 已暂停总时长（毫秒） */
  get pausedDuration() {
    return this._pausedDuration
  }

  /** 上一次 update 采样时间 */
  get lastUpdateAt() {
    return this._lastUpdateAt
  }

  /** 是否已经开始计时且尚未 reset */
  get isStarted() {
    return this._running
  }

  /** 是否正在计时 */
  get isRunning() {
    return this._running && this._pausedAt === undefined
  }

  /** 是否处于暂停态 */
  get isPaused() {
    return this._running && this._pausedAt !== undefined
  }

  /** 累计时间（毫秒） */
  get elapsedMS() {
    if (!this._running)
      return 0

    return Math.max(0, this.curTime - this._startedAt - this._pausedDuration)
  }

  /** 累计时间（秒） */
  get elapsed() {
    return this.elapsedMS / 1000
  }

  /** 开始计时，并清空之前状态 */
  start() {
    const now = this.now

    this._startedAt = now
    this._pausedAt = undefined
    this._pausedDuration = 0
    this._lastUpdateAt = now
    this._running = true
    this.delta = 0
    this.deltaMS = 0
  }

  /** 暂停计时 */
  pause() {
    if (!this.isRunning)
      return

    this._pausedAt = this.now
  }

  /** 恢复计时 */
  resume() {
    const pausedAt = this._pausedAt
    if (!this._running || pausedAt === undefined)
      return

    const now = this.now
    this._pausedDuration += now - pausedAt
    this._pausedAt = undefined
    this._lastUpdateAt = now
    this.delta = 0
    this.deltaMS = 0
  }

  /** 停止计时，并清空状态 */
  reset() {
    this._startedAt = 0
    this._pausedAt = undefined
    this._pausedDuration = 0
    this._lastUpdateAt = 0
    this._running = false
    this.delta = 0
    this.deltaMS = 0
  }

  /** 更新帧间隔采样 */
  update() {
    if (!this.isRunning) {
      this.delta = 0
      this.deltaMS = 0
      return this
    }

    const now = this.now
    this.deltaMS = Math.max(0, now - this._lastUpdateAt)
    this.delta = this.deltaMS / 1000
    this._lastUpdateAt = now

    return this
  }
}

export function getMonotonicNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function createTimeGetter(timeApi: ClockTimeApi = 'performance') {
  if (timeApi === 'date')
    return () => Date.now()

  return getMonotonicNow
}

export interface ClockOptions {
  /**
   * 自定义时间源，测试或特殊运行时可注入
   *
   * @default performance.now()，不支持时回退 Date.now()
   */
  getNow?: () => number
  /**
   * 用来选取获取时间的 Api，`performance` 更加精准
   *
   * @default 'performance'
   */
  timeApi?: ClockTimeApi
  /**
   * 构造后是否立即开始计时
   *
   * @default true
   */
  autoStart?: boolean
}

export type ClockTimeApi = 'performance' | 'date'
