import type { NormalizedWSOpts, WSOpts } from './types'

/** 把公开配置收敛为运行期可直接使用的完整配置 */
export function normalizeWSOptions(opts: WSOpts): NormalizedWSOpts {
  return {
    url: opts.url,
    protocols: opts.protocols ?? [],
    heartbeatInterval: opts.heartbeatInterval ?? 5000,
    genHeartbeatMsg: opts.genHeartbeatMsg ?? (() => ({ type: 'Ping', data: null })),
    leaveTime: opts.leaveTime ?? 10000,
    stopOnHidden: opts.stopOnHidden ?? true,
    queueMessages: opts.queueMessages ?? true,
    maxQueuedMessages: Math.max(0, Math.floor(opts.maxQueuedMessages ?? 100)),
    queuedMessageTTL: opts.queuedMessageTTL ?? 10000,
    autoReconnect: opts.autoReconnect ?? true,
    maxReconnectAttempts: Math.max(0, Math.floor(opts.maxReconnectAttempts ?? 5)),
    reconnectBaseDelay: Math.max(0, opts.reconnectBaseDelay ?? 1000),
    reconnectMaxDelay: Math.max(0, opts.reconnectMaxDelay ?? 30000),
    logger: opts.logger,
    createWebSocket: opts.createWebSocket ?? createDefaultWebSocket,
    onVisible: opts.onVisible,
    onHidden: opts.onHidden,
    onReconnectAttempt: opts.onReconnectAttempt,
    onReconnectExhausted: opts.onReconnectExhausted,
  }
}

function createDefaultWebSocket(url: string, protocols: string | string[]) {
  if (typeof WebSocket === 'undefined') {
    throw new TypeError('[WS] WebSocket is not available in the current environment')
  }

  return new WebSocket(url, protocols)
}
