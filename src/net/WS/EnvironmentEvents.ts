/** 管理浏览器网络状态、页面可见性和隐藏延迟 */
export class EnvironmentEvents {
  private options: EnvironmentEventOptions
  private cleanup?: VoidFunction
  private leaveTimer?: ReturnType<typeof setTimeout>

  constructor(options: EnvironmentEventOptions) {
    this.options = options
  }

  start() {
    if (this.cleanup || typeof window === 'undefined') {
      return
    }

    const browserWindow = window
    browserWindow.addEventListener('online', this.options.onOnline)
    browserWindow.addEventListener('offline', this.options.onOffline)
    if (this.options.stopOnHidden && typeof document !== 'undefined') {
      browserWindow.addEventListener('visibilitychange', this.onVisibilityChange)
    }

    this.cleanup = () => {
      browserWindow.removeEventListener('online', this.options.onOnline)
      browserWindow.removeEventListener('offline', this.options.onOffline)
      browserWindow.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  stop() {
    this.clearLeaveTimer()
    this.cleanup?.()
    this.cleanup = undefined
  }

  private onVisibilityChange = () => {
    this.clearLeaveTimer()

    if (document.visibilityState === 'visible') {
      this.options.onVisible()
      return
    }

    if (document.visibilityState !== 'hidden' || this.options.leaveTime < 0) {
      return
    }

    this.leaveTimer = setTimeout(() => {
      this.leaveTimer = undefined
      this.options.onHidden()
    }, this.options.leaveTime)
  }

  private clearLeaveTimer() {
    clearTimeout(this.leaveTimer)
    this.leaveTimer = undefined
  }
}

type EnvironmentEventOptions = {
  stopOnHidden: boolean
  leaveTime: number
  onOnline: VoidFunction
  onOffline: VoidFunction
  onVisible: VoidFunction
  onHidden: VoidFunction
}
