const nativeWebSocket = typeof WebSocket !== 'undefined'
  ? WebSocket
  : undefined

export const WS_CONNECTING = nativeWebSocket?.CONNECTING ?? 0
export const WS_OPEN = nativeWebSocket?.OPEN ?? 1
export const WS_CLOSING = nativeWebSocket?.CLOSING ?? 2
export const WS_CLOSED = nativeWebSocket?.CLOSED ?? 3
