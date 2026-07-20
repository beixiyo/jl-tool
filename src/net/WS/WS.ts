/**
 * WS 连接编排器
 *
 * 负责在一条逻辑连接之上管理物理 socket 的创建、替换与销毁，
 * 并把物理事件转换为对外稳定的逻辑事件
 */
import type { NormalizedWSOpts, WSOpts } from './types'
import { WS_CLOSED, WS_CLOSING, WS_CONNECTING, WS_OPEN } from './constants'
import { EnvironmentEvents } from './EnvironmentEvents'
import { EventHandlerTarget } from './EventHandlerTarget'
import { cloneEvent, cloneMessageEvent, createCloseEvent } from './events'
import { Heartbeat } from './Heartbeat'
import { MessageQueue } from './MessageQueue'
import { normalizeWSOptions } from './options'
import { ReconnectCycle } from './ReconnectCycle'

/**
 * 带心跳、自动重连和消息暂存的 WebSocket 客户端
 *
 * 事件接口与原生 WebSocket 一致，同时支持 `addEventListener` 和 `onmessage` 等属性处理器
 * 与原生的区别在于：一个 WS 实例是一条**逻辑连接**，底层物理连接会随重连不断替换，
 * 但实例本身和已注册的事件处理器始终有效，无需在重连后重新绑定
 *
 * @example
 * ```ts
 * const ws = new WS({ url: 'wss://example.com/socket' })
 *
 * ws.onmessage = event => console.log(event.data)
 * ws.connect()
 *
 * // 未连接时消息进入队列，连接建立后按原顺序补发
 * ws.send(JSON.stringify({ type: 'hello' }))
 * ```
 *
 * @example 区分「真正断开」和「内部替换连接」
 * ```ts
 * ws.onclose = (event) => {
 *   // 内部重连产生的合成事件，业务通常应忽略
 *   if (event.superseded) return
 *   console.log('连接已断开', event.code)
 * }
 * ```
 *
 * @example 关闭消息队列时，send 的返回值表示是否已交给底层连接
 * ```ts
 * const ws = new WS({ url: 'wss://example.com/socket', queueMessages: false })
 *
 * if (!ws.send(payload)) {
 *   // 连接当前不可发送，由调用方决定重试还是丢弃
 * }
 * ```
 *
 * @example 在 Node、Electron 或测试中注入 WebSocket 实现
 * ```ts
 * import WebSocket from 'ws'
 *
 * const ws = new WS({
 *   url: 'wss://example.com/socket',
 *   createWebSocket: (url, protocols) => new WebSocket(url, protocols) as any,
 * })
 * ```
 */
export class WS extends EventHandlerTarget<WS> {
  static readonly CONNECTING = WS_CONNECTING
  static readonly OPEN = WS_OPEN
  static readonly CLOSING = WS_CLOSING
  static readonly CLOSED = WS_CLOSED

  #opts: NormalizedWSOpts
  #socket: WebSocket | null = null
  #reconnectTimer?: ReturnType<typeof setTimeout>
  #socketEventCleanup?: VoidFunction

  #environmentEvents: EnvironmentEvents
  #heartbeat: Heartbeat
  #messageQueue: MessageQueue
  #reconnectCycle = new ReconnectCycle()

  #binaryType: BinaryType = 'blob'
  #logicalReadyState: number = WS_CLOSED
  #allowReconnect = false
  #dispatchingClose = false
  #suspended = false

  constructor(opts: WSOpts) {
    super()
    this.#opts = normalizeWSOptions(opts)
    this.#messageQueue = new MessageQueue({
      enabled: this.#opts.queueMessages,
      maxSize: this.#opts.maxQueuedMessages,
      ttl: this.#opts.queuedMessageTTL,
    })
    this.#heartbeat = new Heartbeat({
      interval: this.#opts.heartbeatInterval,
      createMessage: this.#opts.genHeartbeatMsg,
    })
    this.#environmentEvents = new EnvironmentEvents({
      stopOnHidden: this.#opts.stopOnHidden,
      leaveTime: this.#opts.leaveTime,
      onOnline: this.#onOnline,
      onOffline: this.#onOffline,
      onVisible: this.#onVisible,
      onHidden: this.#onHidden,
    })
  }

  get CONNECTING() {
    return WS_CONNECTING
  }

  get OPEN() {
    return WS_OPEN
  }

  get CLOSING() {
    return WS_CLOSING
  }

  get CLOSED() {
    return WS_CLOSED
  }

  /** 当前底层 WebSocket，只读且可能为空 */
  get socket() {
    return this.#socket
  }

  /** 当前连接地址 */
  get url() {
    return this.#socket?.url ?? this.#opts.url
  }

  /** 当前协商协议 */
  get protocol() {
    return this.#socket?.protocol ?? ''
  }

  /** 当前协商扩展 */
  get extensions() {
    return this.#socket?.extensions ?? ''
  }

  /** 当前底层 socket 尚未发送的字节数 */
  get bufferedAmount() {
    return this.#socket?.bufferedAmount ?? 0
  }

  /** 当前二进制消息类型，跨重连保留 */
  get binaryType() {
    return this.#binaryType
  }

  set binaryType(value) {
    this.#binaryType = value
    if (this.#socket) {
      this.#socket.binaryType = value
    }
  }

  /** 当前逻辑连接状态 */
  get readyState(): number {
    return this.#logicalReadyState
  }

  /** 当前连接是否已打开 */
  get isConnected() {
    return this.readyState === WS_OPEN
  }

  /** 当前连接是否正在建立 */
  get isConnecting() {
    return this.readyState === WS_CONNECTING
  }

  /** 当前连接是否正在关闭 */
  get isClosing() {
    return this.readyState === WS_CLOSING
  }

  /** 当前连接是否已经关闭 */
  get isClosed() {
    return this.readyState === WS_CLOSED
  }

  /** 当前运行环境明确报告网络离线 */
  get isOffline() {
    return typeof navigator !== 'undefined' && 'onLine' in navigator
      ? !navigator.onLine
      : false
  }

  /**
   * 发送消息
   *
   * @returns 消息已发送或已进入待发队列时返回 true，消息被拒绝时返回 false
   */
  send(message: Parameters<WebSocket['send']>[0]): boolean {
    const socket = this.#openSocket
    if (socket) {
      socket.send(message)
      return true
    }

    if (this.#messageQueue.enabled) {
      if (this.#messageQueue.enqueue(message)) {
        return true
      }

      this.#warn('[WS] message rejected because the queue is full', {
        maxQueuedMessages: this.#opts.maxQueuedMessages,
      })
      return false
    }

    if (this.isConnecting) {
      throw new DOMException('WebSocket is still in CONNECTING state', 'InvalidStateError')
    }

    return false
  }

  /**
   * 开启连接
   *
   * 重复调用具有幂等性：连接处于 OPEN 或 CONNECTING 时直接返回当前实例
   */
  connect(): this {
    if (this.#hasActivePhysicalSocket) {
      return this
    }

    this.#clearReconnectTimer()
    this.#resetReconnectCycle()
    this.#allowReconnect = true
    this.#suspended = false
    this.#environmentEvents.start()
    this.#openConnection()
    return this
  }

  /**
   * 销毁当前连接上下文
   *
   * 清除重连、心跳和待发消息。事件处理器保留，后续 connect() 会复用当前实例
   */
  close(code?: number, reason?: string) {
    validateCloseArguments(code, reason)

    this.#allowReconnect = false
    this.#suspended = false
    this.#heartbeat.stop()
    this.#clearReconnectTimer()
    this.#environmentEvents.stop()
    this.#socketEventCleanup?.()
    this.#socketEventCleanup = undefined

    const socket = this.#socket
    const shouldEmitClose = this.#logicalReadyState !== WS_CLOSED
    if (socket && socket.readyState !== WS_CLOSED) {
      socket.close(code, reason)
    }

    this.#logicalReadyState = WS_CLOSED
    this.#socket = null
    this.#messageQueue.clear()
    this.#resetReconnectCycle()

    if (shouldEmitClose) {
      this.#dispatchClose(createCloseEvent({
        code: code ?? 1000,
        reason: reason ?? '',
        wasClean: true,
      }))
    }
  }

  /** close() 的显式销毁别名 */
  dispose(code?: number, reason?: string) {
    this.close(code, reason)
  }

  get #openSocket() {
    const socket = this.#socket
    return socket?.readyState === WS_OPEN
      ? socket
      : null
  }

  get #hasActivePhysicalSocket() {
    return this.#socket?.readyState === WS_OPEN
      || this.#socket?.readyState === WS_CONNECTING
  }

  /** 创建一条底层连接，并把当前实例切换到它 */
  #openConnection() {
    const previousSocket = this.#socket
    this.#socketEventCleanup?.()
    this.#socketEventCleanup = undefined
    this.#socket = null

    if (previousSocket && this.#logicalReadyState !== WS_CLOSED) {
      this.#logicalReadyState = WS_CLOSED
      this.#dispatchClose(createCloseEvent({
        code: 1006,
        reason: 'Connection superseded',
        superseded: true,
        wasClean: false,
      }))

      /** 事件处理器可以同步 close/connect，新连接优先于外层转换 */
      if (this.#hasActivePhysicalSocket || !this.#allowReconnect) {
        return
      }
    }

    const socket = this.#opts.createWebSocket(this.#opts.url, this.#opts.protocols)
    socket.binaryType = this.#binaryType
    this.#socket = socket
    this.#logicalReadyState = WS_CONNECTING
    this.#socketEventCleanup = this.#bindSocketEvents(socket)
  }

  /** 绑定当前底层 socket 的内部生命周期事件 */
  #bindSocketEvents(socket: WebSocket): VoidFunction {
    const onOpen = (event: Event) => {
      if (socket !== this.#socket) {
        return
      }

      this.#logicalReadyState = WS_OPEN
      this.#resetReconnectCycle()
      this.#clearReconnectTimer()
      this.#flushMessageQueue()
      this.#heartbeat.start(() => this.#openSocket)
      this.dispatchEvent(cloneEvent(event))
    }

    const onClose = (event: CloseEvent) => {
      if (socket !== this.#socket) {
        return
      }

      this.#logicalReadyState = WS_CLOSED
      this.#heartbeat.stop()
      this.#warn('[WS] connection closed')
      this.#scheduleReconnect()
      this.#dispatchClose(createCloseEvent(event))
    }

    const onError = (event: Event) => {
      if (socket === this.#socket) {
        this.#warn('[WS] connection error')
        this.dispatchEvent(cloneEvent(event))
      }
    }

    const onMessage = (event: MessageEvent) => {
      if (socket === this.#socket) {
        this.dispatchEvent(cloneMessageEvent(event))
      }
    }

    socket.addEventListener('open', onOpen)
    socket.addEventListener('close', onClose)
    socket.addEventListener('error', onError)
    socket.addEventListener('message', onMessage)

    return () => {
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('close', onClose)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('message', onMessage)
    }
  }

  #onOnline = () => {
    if (!this.#allowReconnect || this.#suspended || !this.#opts.autoReconnect) {
      return
    }
    if (this.#hasActivePhysicalSocket) {
      return
    }

    this.#clearReconnectTimer()
    this.#resetReconnectCycle()
    try {
      this.#openConnection()
    }
    catch (error) {
      this.#warn('[WS] reconnect failed', { error })
      this.#scheduleReconnect()
    }
  }

  #onOffline = () => {
    this.#heartbeat.stop()
    this.#clearReconnectTimer()
    this.#warn('[WS] network offline')
  }

  /**
   * 恢复因页面隐藏而挂起的连接
   *
   * 这里刻意不检查 autoReconnect：挂起是本类主动发起的，恢复与之成对，
   * 若受 autoReconnect 约束，关闭重连的连接在页面隐藏一次后将永久无法恢复
   */
  #onVisible = () => {
    if (!this.#suspended) {
      return
    }

    this.#suspended = false
    this.#resetReconnectCycle()
    this.#openConnection()
    if (this.#hasActivePhysicalSocket) {
      this.#opts.onVisible?.()
    }
  }

  #onHidden = () => {
    this.#suspendConnection()
    this.#opts.onHidden?.()
  }

  /** 暂停底层连接但保留当前实例、处理器和待发消息 */
  #suspendConnection() {
    this.#suspended = true
    this.#heartbeat.stop()
    this.#clearReconnectTimer()

    if (this.#socket && this.#socket.readyState !== WS_CLOSED) {
      this.#logicalReadyState = WS_CLOSING
      this.#socket.close()
    }
  }

  /** 安排有限指数退避重连 */
  #scheduleReconnect() {
    if (
      !this.#allowReconnect
      || this.#suspended
      || !this.#opts.autoReconnect
      || this.isOffline
      || this.#reconnectTimer
    ) {
      return
    }

    const reconnect = this.#reconnectCycle.next({
      maxAttempts: this.#opts.maxReconnectAttempts,
      baseDelay: this.#opts.reconnectBaseDelay,
      maxDelay: this.#opts.reconnectMaxDelay,
    })
    if (!reconnect) {
      if (!this.#reconnectCycle.consumeExhaustedNotification()) {
        return
      }

      this.#warn('[WS] maximum reconnect attempts reached', {
        maxReconnectAttempts: this.#opts.maxReconnectAttempts,
      })
      this.#opts.onReconnectExhausted?.()
      return
    }

    const { attempt, delay } = reconnect
    this.#opts.onReconnectAttempt?.({ attempt, delay })
    this.#warn('[WS] reconnect scheduled', { attempt, delay })

    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined
      try {
        this.#openConnection()
      }
      catch (error) {
        this.#warn('[WS] reconnect failed', { attempt, error })
        this.#scheduleReconnect()
      }
    }, delay)
  }

  #clearReconnectTimer() {
    clearTimeout(this.#reconnectTimer)
    this.#reconnectTimer = undefined
  }

  /** 同一同步调用栈只公开一次逻辑 close，避免永久处理器自激重入 */
  #dispatchClose(event: CloseEvent) {
    if (this.#dispatchingClose) {
      return
    }

    this.#dispatchingClose = true
    try {
      this.dispatchEvent(event)
    }
    finally {
      this.#dispatchingClose = false
    }
  }

  #resetReconnectCycle() {
    this.#reconnectCycle.reset()
  }

  /** 把未过期的待发消息按原顺序发送 */
  #flushMessageQueue() {
    this.#messageQueue.flush((message) => {
      const socket = this.#openSocket
      if (!socket) {
        return false
      }

      socket.send(message)
      return true
    })
  }

  #warn(message: string, context?: Record<string, unknown>) {
    this.#opts.logger?.warn(message, context)
  }
}

function validateCloseArguments(code?: number, reason?: string) {
  if (code !== undefined && code !== 1000 && (code < 3000 || code > 4999)) {
    throw new DOMException('Invalid close code', 'InvalidAccessError')
  }
  if (reason !== undefined && new TextEncoder().encode(reason).byteLength > 123) {
    throw new DOMException('Close reason is too long', 'SyntaxError')
  }
}
