/** 管理只向当前 OPEN 物理 socket 发送的心跳 timer */
export class Heartbeat {
  private interval: number
  private createMessage: () => unknown
  private timer?: ReturnType<typeof setInterval>

  constructor(options: HeartbeatOptions) {
    this.interval = options.interval
    this.createMessage = options.createMessage
  }

  start(getOpenSocket: () => WebSocket | null) {
    if (this.interval < 0 || !getOpenSocket()) {
      return
    }

    this.stop()
    const ping = () => {
      const socket = getOpenSocket()
      if (!socket) {
        this.stop()
        return
      }

      socket.send(JSON.stringify(this.createMessage()))
    }

    ping()
    if (getOpenSocket()) {
      this.timer = setInterval(ping, this.interval)
    }
  }

  stop() {
    clearInterval(this.timer)
    this.timer = undefined
  }
}

type HeartbeatOptions = {
  interval: number
  createMessage: () => unknown
}
