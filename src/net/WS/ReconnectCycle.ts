import type { WSReconnectContext } from './types'

/** 管理单个故障周期的退避次数和耗尽通知 */
export class ReconnectCycle {
  private attempts = 0
  private exhaustedNotified = false

  next(options: ReconnectOptions): WSReconnectContext | null {
    if (this.attempts >= options.maxAttempts) {
      return null
    }

    const delay = Math.min(
      options.baseDelay * 2 ** this.attempts,
      options.maxDelay,
    )
    this.attempts += 1
    return {
      attempt: this.attempts,
      delay,
    }
  }

  consumeExhaustedNotification() {
    if (this.exhaustedNotified) {
      return false
    }

    this.exhaustedNotified = true
    return true
  }

  reset() {
    this.attempts = 0
    this.exhaustedNotified = false
  }
}

type ReconnectOptions = {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
}
