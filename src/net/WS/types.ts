/**
 * WS 配置
 */
export type WSOpts = {
  url: string
  protocols?: string | string[]
  /**
   * 发送心跳数据间隔，单位 ms，小于 0 表示关闭心跳
   * @default 5000
   */
  heartbeatInterval?: number
  /**
   * 生成心跳数据
   * @default () => ({ type: 'Ping', data: null })
   */
  genHeartbeatMsg?: () => unknown
  /**
   * 页面不可见多久后暂停连接，单位 ms，小于 0 表示不暂停
   * @default 10000
   */
  leaveTime?: number
  /**
   * 是否在页面不可见时暂停连接
   *
   * 开启时，页面重新可见会恢复被挂起的连接，该恢复不受 `autoReconnect` 约束
   * @default true
   */
  stopOnHidden?: boolean
  /**
   * 连接不可用时是否暂存消息
   * @default true
   */
  queueMessages?: boolean
  /**
   * 最大待发消息数
   * @default 100
   */
  maxQueuedMessages?: number
  /**
   * 待发消息有效期，单位 ms，小于 0 表示永不过期
   * @default 10000
   */
  queuedMessageTTL?: number
  /**
   * 非预期关闭后是否自动重连
   *
   * 关闭后，底层连接断开和网络恢复 `online` 都不会触发重连，只能显式调用 `connect()`
   *
   * 注意它不约束页面可见性恢复：`stopOnHidden` 为 true 时，
   * 页面隐藏超过 `leaveTime` 会主动挂起连接，重新可见时**总会**重新建连，
   * 否则挂起的连接将永久无法恢复。需要完全禁止自动建连时，同时设置 `stopOnHidden: false`
   * @default true
   */
  autoReconnect?: boolean
  /**
   * 单个重连周期内的最大自动重连次数
   * @default 5
   */
  maxReconnectAttempts?: number
  /**
   * 首次重连延迟，单位 ms
   * @default 1000
   */
  reconnectBaseDelay?: number
  /**
   * 重连延迟上限，单位 ms
   * @default 30000
   */
  reconnectMaxDelay?: number
  /**
   * 可选日志接收器，默认静默
   * @default undefined
   */
  logger?: WSLogger
  /**
   * 创建底层 WebSocket，用于注入 Node、Electron 或测试实现
   *
   * 工厂应返回一条新建的 CONNECTING 连接
   * @default (url, protocols) => new WebSocket(url, protocols)
   */
  createWebSocket?: (url: string, protocols: string | string[]) => WebSocket
  /** 页面恢复可见并重新连接后的回调 */
  onVisible?: () => void
  /** 页面隐藏并暂停连接后的回调 */
  onHidden?: () => void
  /** 自动重连开始等待时的回调 */
  onReconnectAttempt?: (context: WSReconnectContext) => void
  /** 单个重连周期内自动重连次数耗尽时的回调，每周期最多触发一次 */
  onReconnectExhausted?: () => void
}

/**
 * WS 日志接收器
 */
export type WSLogger = {
  warn: (message: string, context?: Record<string, unknown>) => void
}

/**
 * 自动重连上下文
 */
export type WSReconnectContext = {
  attempt: number
  delay: number
}

/**
 * WS 派发的逻辑关闭事件
 */
export type WSCloseEvent = CloseEvent & {
  /** 底层连接是否因内部替换而关闭 */
  readonly superseded?: boolean
}

/** 供连接编排器使用的标准化配置 */
export type NormalizedWSOpts = Required<Omit<WSOpts, | 'logger'
  | 'onVisible'
  | 'onHidden'
  | 'onReconnectAttempt'
  | 'onReconnectExhausted'>> & Pick<WSOpts, | 'logger'
  | 'onVisible'
  | 'onHidden'
  | 'onReconnectAttempt'
  | 'onReconnectExhausted'>
