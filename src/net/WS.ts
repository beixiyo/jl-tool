import type { Optional } from '@jl-org/ts-tool'

/**
 * 根据网络状态自动重连的，自动发送心跳数据的 WebSocket
 */
export class WS {
  private opts: Optional<Required<WSOpts>, 'protocols' | 'onVisible' | 'onHidden'>
  socket: WebSocket | null = null

  /** 心跳计时器 id */
  private heartbeatTimer?: number
  /** 离开页面计时器 id */
  private leaveTimer?: number

  /** 删除事件 */
  private rmNetEvent?: RmEvent

  constructor(opts: WSOpts) {
    const defaultOpts = {
      protocols: [],
      heartbeatInterval: 5000,
      genHeartbeatMsg: () => ({ type: 'Ping', data: null }),
      leaveTime: 10000,
      stopOnHidden: true,
    }
    this.opts = {
      ...defaultOpts,
      ...opts,
    }
  }

  /**
   * socket.readyState === WebSocket.OPEN
   */
  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  /**
   * socket.readyState === WebSocket.CONNECTING
   */
  get isConnecting() {
    return this.socket?.readyState === WebSocket.CONNECTING
  }

  /**
   * socket.readyState === WebSocket.CLOSING
   */
  get isClosed() {
    return this.socket?.readyState === WebSocket.CLOSED
  }

  /**
   * 网络状态是否离线，!window.navigator.onLine
   */
  get isOffline() {
    return !window.navigator.onLine
  }

  /**
   * 发送消息
   * @param message 要发送的消息，支持字符串、ArrayBuffer 或 Blob
   *
   * @example
   * ```ts
   * // 基础用法
   * const ws = new WS({ url: 'ws://localhost:8080' })
   * ws.connect()
   * ws.send('Hello WebSocket!')
   * ws.send(JSON.stringify({ type: 'message', data: 'Hello' }))
   * ```
   *
   * @example
   * ```ts
   * // 发送二进制数据
   * const ws = new WS({ url: 'ws://localhost:8080' })
   * ws.connect()
   * const buffer = new ArrayBuffer(8)
   * ws.send(buffer)
   * ```
   */
  send(message: Parameters<WebSocket['send']>[0]) {
    if (this.socket && this.isConnected) {
      this.socket.send(message)
      return
    }

    console.warn('未连接，请先调用 connect')
  }

  /**
   * 开启连接并初始化事件（报错、关闭、网络状态变更等）
   * @returns WebSocket 实例
   *
   * @example
   * ```ts
   * // 基础用法
   * const ws = new WS({
   *   url: 'ws://localhost:8080',
   *   heartbeatInterval: 3000,
   *   genHeartbeatMsg: () => ({ type: 'ping' })
   * })
   *
   * const socket = ws.connect()
   * socket.addEventListener('message', (event) => {
   *   console.log('收到消息:', event.data)
   * })
   * ```
   *
   * @example
   * ```ts
   * // 带协议的子协议
   * const ws = new WS({
   *   url: 'ws://localhost:8080',
   *   protocols: ['chat', 'notification']
   * })
   *
   * const socket = ws.connect()
   * ```
   */
  connect(): WebSocket {
    if (this.isConnected) {
      return this.socket!
    }

    this.socket = new WebSocket(this.opts.url, this.opts.protocols)
    this.rmNetEvent = this.bindNetEvent()
    window.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.opts.stopOnHidden && window.addEventListener('visibilitychange', this.onVisibilityChange)

    return this.socket
  }

  /**
   * 关闭连接并清除事件
   *
   * @example
   * ```ts
   * // 基础用法
   * const ws = new WS({ url: 'ws://localhost:8080' })
   * ws.connect()
   *
   * // 关闭连接
   * ws.close()
   * ```
   *
   * @example
   * ```ts
   * // 在组件卸载时关闭连接
   * const ws = new WS({ url: 'ws://localhost:8080' })
   * ws.connect()
   *
   * // 组件卸载时
   * useEffect(() => {
   *   return () => {
   *     ws.close()
   *   }
   * }, [])
   * ```
   */
  close() {
    if (this.socket) {
      this.rmNetEvent?.rmNetEvent()
      this.rmNetEvent?.rmSocketEvent()
      this.socket.close()
      this.socket = null
    }

    clearInterval(this.heartbeatTimer)
    window.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  /** 私有方法 ================================================== */

  /**
   * 页面不可见时，关闭连接。恢复时，重新连接
   */
  private onVisibilityChange = () => {
    clearTimeout(this.leaveTimer)

    if (document.visibilityState === 'visible' && (!this.socket || this.isClosed)) {
      console.log('页面可见，尝试重连...')
      const socket = this.connect()
      this.opts.onVisible?.(socket)
    }
    else if (document.visibilityState === 'hidden') {
      if (this.opts.leaveTime < 0) {
        return
      }

      this.leaveTimer = window.setTimeout(() => {
        clearInterval(this.heartbeatTimer)
        console.log('离开页面过久，关闭连接')
        this.socket?.close()
        this.opts.onHidden?.()
      }, this.opts.leaveTime)
    }
  }

  /** 网络状态变更处理逻辑 */
  private bindNetEvent(): RmEvent {
    this.rmNetEvent?.rmNetEvent()
    this.rmNetEvent?.rmSocketEvent()

    const onOnline = () => {
      console.log('网络恢复，尝试重连...')
      this.connect()
      this.heartbeat()
    }
    const onOffline = () => {
      console.log('网络断开，停止心跳检测')
      clearInterval(this.heartbeatTimer)
    }

    const onClose = () => {
      console.log('WebSocket 已关闭')
      this.rmNetEvent?.rmSocketEvent()
      clearInterval(this.heartbeatTimer)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    this.socket?.addEventListener('open', this.heartbeat)
    this.socket?.addEventListener('close', onClose)

    return {
      rmSocketEvent: () => {
        this.socket?.removeEventListener('open', this.heartbeat)
        this.socket?.removeEventListener('close', onClose)
      },
      rmNetEvent: () => {
        window.removeEventListener('online', onOnline)
        window.removeEventListener('offline', onOffline)
      },
    }
  }

  /** 开始心跳检测，定时发送心跳消息 */
  private heartbeat = () => {
    if (
      this.opts.heartbeatInterval === -1
    ) return
    clearInterval(this.heartbeatTimer)

    const ping = () => {
      this.send(JSON.stringify(this.opts.genHeartbeatMsg()))
    }

    ping()
    this.heartbeatTimer = window.setInterval(
      ping,
      this.opts.heartbeatInterval,
    )
  }
}

export type WSOpts = {
  url: string
  protocols?: string | string[]
  /**
   * 发送心跳数据间隔，单位 ms。-1 表示不发送心跳
   * @default 5000
   */
  heartbeatInterval?: number
  /**
   * 生成心跳数据函数
   * @default () => ({ type: 'Ping', data: null })
   */
  genHeartbeatMsg?: () => any
  /**
   * 页面不可见时，多久后断开连接，单位 ms，如果小于 0 则不自动断开
   * @default 10000
   */
  leaveTime?: number

  /**
   * 是否在页面不可见时停止心跳检测、关闭连接
   * @default true
   */
  stopOnHidden?: boolean
  /**
   * 页面可见时的回调
   */
  onVisible?: (socket: WebSocket) => void
  /**
   * 页面不可见时的回调
   */
  onHidden?: () => void
}

type RmEvent = {
  rmSocketEvent: VoidFunction
  /**
   * 移除 online、offline 事件监听
   */
  rmNetEvent: VoidFunction
}
