import { EventBus } from '../channel/EventBus'


/**
 * 根据网络状态自动重连的 WebSocket
 */
export class WS extends EventBus<'open' | 'message' | 'close' | 'error'> {

  private url = ''
  private protocols?: string | string[]
  socket: WebSocket | null = null

  /** 
   * 发送心跳数据间隔，单位 ms
   * @default 5000
   */
  heartbeatInterval = 5000
  /**
   * 生成心跳数据函数
   * @default () => ({ type: 'Ping', data: null })
   */
  genHeartbeatMsg = () => ({ type: 'Ping', data: null })

  /** 心跳计时器 id */
  private heartbeatTimer?: number
  /** 离开页面计时器 id */
  private leaveTimer?: number
  /**
   * 页面不可见时，多久后断开连接，单位 ms
   * @default 10000
   */
  leaveTime = 10000

  /** 删除事件 */
  private rmNetEvent?: VoidFunction

  /**
   * 和原生 WebSocket 参数一致
   * 自带心跳发送，断网重连
   */
  constructor(url: string, protocols?: string | string[]) {
    super()
    this.url = url
    this.protocols = protocols
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  get isConnecting() {
    return this.socket?.readyState === WebSocket.CONNECTING
  }

  get isOffline() {
    return !navigator.onLine
  }

  get isClose() {
    return this.socket?.readyState === WebSocket.CLOSED
  }

  // 事件 ==================================================
  onopen<T>(callBack: SocketCb<T>) {
    this.on('open', callBack)
  }
  onmessage<T>(callBack: SocketCb<T>) {
    this.on('message', callBack)
  }
  onclose<T>(callBack: SocketCb<T>) {
    this.on('close', callBack)
  }
  onerror<T>(callBack: SocketCb<T>) {
    this.on('error', callBack)
  }

  send(message: Parameters<WebSocket['send']>[0]) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message)
      return
    }

    this.logInfo('未连接，请先调用 connect', 'warn')
  }

  connect() {
    this.rmNetEvent?.()
    this.rmNetEvent = this.bindNetEvent()

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return
    }

    this.socket = new WebSocket(this.url, this.protocols)
    this.handleOpen()
    this.handleMessage()
    this.handleClose()
    this.handleError()
  }

  close() {
    if (this.socket) {
      this.socket.close()
      this.socket = null

      this.off('open')
      this.off('message')
      this.off('close')
      this.off('error')
      this.rmNetEvent?.()
    }
    this.stopHeartbeat()
  }

  // 私有方法 ==================================================

  private handleOpen() {
    if (!this.socket) return
    this.socket.onopen = event => {
      this.startHeartbeat()

      this.logInfo('连接成功 [onopen]...')
      this.emit('open', event)
    }
  }

  private handleMessage() {
    if (!this.socket) return
    this.socket.onmessage = event => {
      let { data } = event
      try {
        data = JSON.parse(data)
      }
      catch {
        console.error('[WebSocket] 解析消息失败', event)
      }

      this.emit('message', event)
      this.startHeartbeat()
    }
  }

  private handleClose() {
    if (!this.socket) return
    this.socket.onclose = event => {
      this.emit('close', event)
    }
  }

  private handleError() {
    if (!this.socket) return
    this.socket.onerror = event => {
      this.stopHeartbeat()
      this.emit('error', event)
    }
  }

  private logInfo(msg: string, type: 'log' | 'warn' = 'log') {
    console[type](`WS ${msg} ${this.url}`)
  }

  /**
   * 页面不可见时，关闭连接。恢复时，重新连接
   */
  private onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.isClose) {
      this.connect()
    }
    else if (document.visibilityState === 'hidden') {
      clearTimeout(this.leaveTimer)
      this.leaveTimer = window.setTimeout(() => {
        this.socket?.close()
      }, this.leaveTime)
    }
  }

  /** 网络状态变更处理逻辑 */
  private bindNetEvent() {
    const onOnline = () => {
      this.logInfo('网络恢复，尝试重连...')
      this.connect()
    }
    const onOffline = () => {
      this.logInfo('网络断开，停止心跳检测')
      this.stopHeartbeat()
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('visibilitychange', this.onVisibilityChange)

    // @ts-ignore
    if (window.navigator.connection) {
      // @ts-ignore
      window.navigator.connection.addEventListener('change', onOnline)
    }


    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('visibilitychange', this.onVisibilityChange)
      // @ts-ignore
      window.navigator.connection.removeEventListener('change', onOnline)
    }
  }

  /** 开始心跳检测，定时发送心跳消息 */
  private startHeartbeat() {
    if (!this.socket) return
    if (this.heartbeatTimer) {
      this.stopHeartbeat()
    }

    this.heartbeatTimer = window.setInterval(
      () => {
        this.socket?.send(JSON.stringify(this.genHeartbeatMsg()))
        this.logInfo('发送送心跳中...')
        return
      },
      this.heartbeatInterval
    )
  }

  /** 关闭心跳 */
  private stopHeartbeat() {
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = undefined
  }
}


export type SocketCb<T> = (event: MessageEvent<T>) => void