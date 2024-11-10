import { applyAnimation } from '@/animation/applyAnimation'


export class Clock {

  private getNow: () => number

  /** 开始时间 */
  startTime: number
  /** 当前时间 */
  curTime: number

  /** 每帧时间间隔 */
  delta = 0
  /** 每帧时间间隔（毫秒） */
  deltaMS = 0

  /** 停止时间计算函数 */
  stop!: VoidFunction

  /**
   * 利用 requestAnimationFrame 循环计算时间，可获取
   * - 帧间时间间隔
   * - 累计时间
   * - 起始时间
   * - 当前时间
   * @param timeApi 用来选取获取时间的 Api，`performance` 更加精准（默认值）
   */
  constructor(timeApi: 'performance' | 'date' = 'performance') {
    if (timeApi === 'date') {
      this.getNow = () => Date.now()
    }
    else {
      this.getNow = () => performance.now()
    }

    this.startTime = this.getNow()
    this.curTime = this.getNow()
    this.start()
  }

  /** 开始计算时间，构造器默认调用一次 */
  start() {
    this.stop?.()

    this.stop = applyAnimation(() => {
      const now = this.getNow()

      this.delta = now - this.curTime
      this.deltaMS = this.delta / 1000

      this.curTime = now
    })
  }

  /** 累计时间（毫秒） */
  get elapsedMS() {
    return this.curTime - this.startTime
  }

  /** 累计时间（秒） */
  get elapsed() {
    return this.elapsedMS / 1000
  }
}