import type { WSOpts } from '@/net/WS'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WS } from '@/net/WS'

/** 可控 WebSocket，保留真实 close() 的 CLOSING -> CLOSED 异步转换 */
class FakeWebSocket extends EventTarget {
  static instances: FakeWebSocket[] = []
  static autoCompleteClose = true
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readonly CONNECTING = FakeWebSocket.CONNECTING
  readonly OPEN = FakeWebSocket.OPEN
  readonly CLOSING = FakeWebSocket.CLOSING
  readonly CLOSED = FakeWebSocket.CLOSED

  readyState = FakeWebSocket.CONNECTING
  binaryType: BinaryType = 'blob'
  bufferedAmount = 0
  extensions = ''
  protocol = ''
  sent: unknown[] = []

  onopen: WebSocket['onopen'] = null
  onmessage: WebSocket['onmessage'] = null
  onerror: WebSocket['onerror'] = null
  onclose: WebSocket['onclose'] = null

  private closeDispatched = false

  constructor(public url: string, public protocols?: string | string[]) {
    super()
    FakeWebSocket.instances.push(this)
  }

  send(data: unknown) {
    this.sent.push(data)
  }

  close(code = 1000, reason = '') {
    if (this.readyState === FakeWebSocket.CLOSED || this.readyState === FakeWebSocket.CLOSING) {
      return
    }

    this.readyState = FakeWebSocket.CLOSING
    if (FakeWebSocket.autoCompleteClose) {
      queueMicrotask(() => this.mockClose(code, reason))
    }
  }

  mockOpen() {
    this.readyState = FakeWebSocket.OPEN
    const event = new Event('open')
    this.onopen?.call(this as unknown as WebSocket, event)
    this.dispatchEvent(event)
  }

  mockMessage(data: string) {
    const event = new MessageEvent('message', { data })
    this.onmessage?.call(this as unknown as WebSocket, event)
    this.dispatchEvent(event)
  }

  /** 模拟 readyState 已关闭，但浏览器稍后才派发 close 的竞态 */
  mockDrop() {
    this.readyState = FakeWebSocket.CLOSED
  }

  mockClose(code = 1006, reason = '') {
    if (this.closeDispatched) {
      return
    }

    this.closeDispatched = true
    this.readyState = FakeWebSocket.CLOSED
    const event = new CloseEvent('close', { code, reason })
    this.onclose?.call(this as unknown as WebSocket, event)
    this.dispatchEvent(event)
  }
}

describe('wS', () => {
  let clients: WS[] = []

  beforeEach(() => {
    clients = []
    FakeWebSocket.instances = []
    FakeWebSocket.autoCompleteClose = true
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(async () => {
    clients.forEach(client => client.close())
    await Promise.resolve()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function createWS(overrides: Partial<WSOpts> = {}) {
    const client = new WS({
      url: 'ws://localhost:1234/test',
      heartbeatInterval: -1,
      stopOnHidden: false,
      ...overrides,
    })
    clients.push(client)
    return client
  }

  it('未连接和显式关闭后只报告 CLOSED 状态', async () => {
    const client = createWS()

    expect(client.isClosed).toBe(true)
    expect(client.isConnecting).toBe(false)
    expect(client.isConnected).toBe(false)
    expect(client.isClosing).toBe(false)

    client.connect()
    expect(client.isConnecting).toBe(true)
    expect(client.isClosed).toBe(false)

    client.close()
    expect(client.isClosed).toBe(true)
    expect(client.isClosing).toBe(false)

    await Promise.resolve()
  })

  it('wS 自身是稳定事件目标并提供原生状态常量', () => {
    const client = createWS()

    expect(client.connect()).toBe(client)
    expect(WS.CONNECTING).toBe(FakeWebSocket.CONNECTING)
    expect(WS.OPEN).toBe(FakeWebSocket.OPEN)
    expect(WS.CLOSING).toBe(FakeWebSocket.CLOSING)
    expect(WS.CLOSED).toBe(FakeWebSocket.CLOSED)
    expect(client.CONNECTING).toBe(FakeWebSocket.CONNECTING)
    expect(client.OPEN).toBe(FakeWebSocket.OPEN)
    expect(client.CLOSING).toBe(FakeWebSocket.CLOSING)
    expect(client.CLOSED).toBe(FakeWebSocket.CLOSED)
    expect(Object.keys(client)).toEqual([])
  })

  it('连接数据通过只读 getter 透传并提供安全默认值', () => {
    const client = createWS()

    expect(client.url).toBe('ws://localhost:1234/test')
    expect(client.protocol).toBe('')
    expect(client.extensions).toBe('')
    expect(client.bufferedAmount).toBe(0)
    expect(client.socket).toBeNull()

    client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.protocol = 'chat'
    socket.extensions = 'permessage-deflate'
    socket.bufferedAmount = 12

    expect(client.protocol).toBe('chat')
    expect(client.extensions).toBe('permessage-deflate')
    expect(client.bufferedAmount).toBe(12)
    expect(client.socket).toBe(socket)
    expect(Reflect.set(client, 'socket', null)).toBe(false)
    expect(client.socket).toBe(socket)
  })

  it('默认队列接受连接前消息并在 open 后发送', () => {
    const client = createWS()

    expect(client.send('queued')).toBe(true)
    client.connect()
    FakeWebSocket.instances[0].mockOpen()

    expect(FakeWebSocket.instances[0].sent).toEqual(['queued'])
  })

  it('默认队列 TTL 为 10 秒', () => {
    vi.useFakeTimers()
    const client = createWS()
    client.connect()
    client.send('expired')

    vi.advanceTimersByTime(10001)
    FakeWebSocket.instances[0].mockOpen()

    expect(FakeWebSocket.instances[0].sent).toEqual([])
  })

  it('createWebSocket 可在没有全局实现时注入底层连接', () => {
    vi.stubGlobal('WebSocket', undefined)
    const createWebSocket = vi.fn((url: string, protocols: string | string[]) => {
      return new FakeWebSocket(url, protocols) as unknown as WebSocket
    })
    const client = createWS({ createWebSocket })

    expect(client.connect()).toBe(client)
    expect(createWebSocket).toHaveBeenCalledWith(
      'ws://localhost:1234/test',
      [],
    )
    expect(client.socket).toBe(FakeWebSocket.instances[0])
  })

  it('close 拒绝 WebSocket API 不允许的状态码', () => {
    const client = createWS()

    for (const code of [999, 1001, 2999, 5000]) {
      expect(() => client.close(code)).toThrow(
        expect.objectContaining({ name: 'InvalidAccessError' }),
      )
    }
    expect(() => client.close(1000)).not.toThrow()
    expect(() => client.close(3000)).not.toThrow()
    expect(() => client.close(4999)).not.toThrow()
  })

  it('close 按 UTF-8 字节数限制 reason 为 123 字节', () => {
    const client = createWS()

    expect(() => client.close(1000, '你'.repeat(41))).not.toThrow()
    expect(() => client.close(1000, '你'.repeat(42))).toThrow(
      expect.objectContaining({ name: 'SyntaxError' }),
    )
  })

  it('重连后重放属性式与 addEventListener 式处理器', () => {
    const client = createWS()
    client.connect()
    const onMessageProp = vi.fn()
    const onMessageListener = vi.fn()
    client.onmessage = onMessageProp
    client.addEventListener('message', onMessageListener)

    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.mockMessage('before')
    first.mockDrop()
    window.dispatchEvent(new Event('online'))

    const second = FakeWebSocket.instances[1]
    second.mockOpen()
    second.mockMessage('after')

    expect(onMessageProp).toHaveBeenCalledTimes(2)
    expect(onMessageListener).toHaveBeenCalledTimes(2)
    expect(onMessageProp.mock.calls[1][0].data).toBe('after')
  })

  it('忽略旧 socket 延迟到达的 close，不破坏新连接心跳', () => {
    const client = createWS({ heartbeatInterval: 1000 })
    client.connect()

    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.mockDrop()
    window.dispatchEvent(new Event('online'))

    const second = FakeWebSocket.instances[1]
    first.mockClose()
    second.mockOpen()

    expect(second.sent).toEqual([
      JSON.stringify({ type: 'Ping', data: null }),
    ])
  })

  it('连续 30 次快速替换保持逻辑事件严格配对', () => {
    const client = createWS()
    const events: string[] = []
    client.addEventListener('open', () => events.push('open'))
    client.addEventListener('close', (event) => {
      expect(event.superseded).toBe(true)
      events.push('close')
    })
    client.connect()
    FakeWebSocket.instances[0].mockOpen()

    for (let i = 0; i < 30; i++) {
      FakeWebSocket.instances[i].mockDrop()
      window.dispatchEvent(new Event('online'))
      FakeWebSocket.instances[i + 1].mockOpen()
    }

    expect(FakeWebSocket.instances).toHaveLength(31)
    expect(events.filter(event => event === 'open')).toHaveLength(31)
    expect(events.filter(event => event === 'close')).toHaveLength(30)
    expect(events.slice(-2)).toEqual(['close', 'open'])
    expect(client.isConnected).toBe(true)
  })

  it('连接处于 CONNECTING 时重复 connect 不创建新连接', () => {
    const client = createWS()
    const firstConnection = client.connect()
    const secondConnection = client.connect()

    expect(secondConnection).toBe(firstConnection)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('online 重连只在 open 后启动心跳', () => {
    const logger = { warn: vi.fn() }
    const client = createWS({ heartbeatInterval: 1000, logger })
    client.connect()

    const first = FakeWebSocket.instances[0]
    first.mockDrop()
    window.dispatchEvent(new Event('online'))
    const second = FakeWebSocket.instances[1]

    expect(second.sent).toEqual([])
    expect(logger.warn).not.toHaveBeenCalledWith(
      '[WS] message rejected because the socket is not connected',
      expect.anything(),
    )

    second.mockOpen()
    expect(second.sent).toHaveLength(1)
  })

  it('心跳不进入业务待发队列', async () => {
    vi.useFakeTimers()
    const heartbeat = JSON.stringify({ type: 'Ping', data: null })
    const client = createWS({
      heartbeatInterval: 100,
      queueMessages: true,
    })
    client.connect()

    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.mockDrop()
    await vi.advanceTimersByTimeAsync(300)

    window.dispatchEvent(new Event('online'))
    const second = FakeWebSocket.instances[1]
    second.mockOpen()

    expect(second.sent).toEqual([heartbeat])
  })

  it('send 在 CONNECTING 且未启用队列时抛出 InvalidStateError', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const client = createWS({ queueMessages: false })
    client.connect()

    expect(() => client.send('lost')).toThrow(
      expect.objectContaining({ name: 'InvalidStateError' }),
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it('send 在 CLOSED 且未启用队列时静默返回 false', () => {
    const client = createWS({ queueMessages: false })

    expect(client.send('lost')).toBe(false)
  })

  it('send 在 CLOSING 且未启用队列时静默返回 false', async () => {
    vi.useFakeTimers()
    FakeWebSocket.autoCompleteClose = false
    let visibilityState: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
    const client = createWS({
      leaveTime: 0,
      queueMessages: false,
      stopOnHidden: true,
    })
    client.connect()
    FakeWebSocket.instances[0].mockOpen()

    visibilityState = 'hidden'
    window.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)

    expect(client.isClosing).toBe(true)
    expect(client.send('lost')).toBe(false)
  })

  it('待发队列在 open 后按顺序 flush，并拒绝超出上限的消息', () => {
    const client = createWS({
      queueMessages: true,
      maxQueuedMessages: 2,
    })
    client.connect()

    expect(client.send('first')).toBe(true)
    expect(() => client.send('second')).not.toThrow()
    expect(client.send('overflow')).toBe(false)

    const socket = FakeWebSocket.instances[0]
    socket.mockOpen()
    expect(socket.sent).toEqual(['first', 'second'])
  })

  it('丢弃超过 TTL 的待发消息', () => {
    vi.useFakeTimers()
    const client = createWS({
      queueMessages: true,
      queuedMessageTTL: 100,
    })
    client.connect()
    client.send('expired')

    vi.advanceTimersByTime(101)
    FakeWebSocket.instances[0].mockOpen()

    expect(FakeWebSocket.instances[0].sent).toEqual([])
  })

  it('相同 type、listener、capture 的监听只记录一次', () => {
    const client = createWS()
    client.connect()
    const listener = vi.fn()
    client.addEventListener('message', listener)
    client.addEventListener('message', listener)

    FakeWebSocket.instances[0].mockDrop()
    window.dispatchEvent(new Event('online'))
    FakeWebSocket.instances[1].mockMessage('data')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('once 监听跨重连只触发一次', () => {
    const client = createWS()
    client.connect()
    const listener = vi.fn()
    client.addEventListener('message', listener, { once: true })

    const first = FakeWebSocket.instances[0]
    first.mockMessage('first')
    first.mockDrop()
    window.dispatchEvent(new Event('online'))
    FakeWebSocket.instances[1].mockMessage('second')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('removeEventListener 只删除 capture 匹配的监听', () => {
    const client = createWS()
    client.connect()
    const listener = vi.fn()
    client.addEventListener('message', listener, false)
    client.addEventListener('message', listener, true)
    client.removeEventListener('message', listener, false)

    FakeWebSocket.instances[0].mockDrop()
    window.dispatchEvent(new Event('online'))
    FakeWebSocket.instances[1].mockMessage('data')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('abortSignal 中止后不再重放监听', () => {
    const client = createWS()
    client.connect()
    const controller = new AbortController()
    const listener = vi.fn()
    client.addEventListener('message', listener, { signal: controller.signal })
    controller.abort()

    FakeWebSocket.instances[0].mockDrop()
    window.dispatchEvent(new Event('online'))
    FakeWebSocket.instances[1].mockMessage('data')

    expect(listener).not.toHaveBeenCalled()
  })

  it('重连后保留 binaryType', () => {
    const client = createWS()
    client.connect()
    client.binaryType = 'arraybuffer'

    FakeWebSocket.instances[0].mockDrop()
    window.dispatchEvent(new Event('online'))

    expect(FakeWebSocket.instances[1].binaryType).toBe('arraybuffer')
    expect(client.binaryType).toBe('arraybuffer')
  })

  it('wS 不暴露内部字段，显式关闭立即结束逻辑状态', async () => {
    const client = createWS()
    client.connect()
    const onClose = vi.fn()
    client.addEventListener('close', onClose)
    FakeWebSocket.instances[0].mockOpen()

    expect(Object.keys(client)).toEqual([])
    client.close()
    expect(client.readyState).toBe(FakeWebSocket.CLOSED)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toMatchObject({
      code: 1000,
      reason: '',
      wasClean: true,
    })

    await Promise.resolve()
    expect(client.readyState).toBe(FakeWebSocket.CLOSED)
    expect(client.socket).toBeNull()
  })

  it('close 后再次 connect 复用当前实例和处理器', async () => {
    const client = createWS()
    const firstConnection = client.connect()
    const listener = vi.fn()
    firstConnection.onmessage = listener

    client.close()
    await Promise.resolve()
    const secondConnection = client.connect()
    FakeWebSocket.instances[1].mockMessage('data')

    expect(secondConnection).toBe(firstConnection)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('显式 close 回调内立即 connect 不会清理新连接', () => {
    const client = createWS()
    client.connect()
    let returnedClient: WS | undefined
    const reconnect = () => {
      returnedClient = client.connect()
    }
    client.addEventListener('close', reconnect)
    FakeWebSocket.instances[0].mockOpen()

    client.close()

    expect(returnedClient).toBe(client)
    expect(client.socket).toBe(FakeWebSocket.instances[1])
    expect(client.isConnecting).toBe(true)

    client.removeEventListener('close', reconnect)
  })

  it('替换连接的 close 回调内先 close 再 connect 会返回当前实例', () => {
    const client = createWS()
    client.connect()
    let returnedClient: WS | undefined
    const onMessage = vi.fn()
    const resetConnection = () => {
      client.close()
      returnedClient = client.connect()
      returnedClient.addEventListener('message', onMessage)
    }
    client.addEventListener('close', resetConnection)

    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.mockDrop()
    window.dispatchEvent(new Event('online'))

    const currentClient = client.connect()
    const second = FakeWebSocket.instances[1]
    second.mockOpen()
    second.mockMessage('data')

    expect(returnedClient).toBe(currentClient)
    expect(returnedClient).toBe(client)
    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(FakeWebSocket.instances).toHaveLength(2)

    client.removeEventListener('close', resetConnection)
  })

  it('close 回调内 connect 后 close 不会递归派发 close', () => {
    FakeWebSocket.autoCompleteClose = false
    const client = createWS()
    const onClose = vi.fn(() => {
      client.connect()
      client.close()
    })
    client.addEventListener('close', onClose)
    client.connect()
    FakeWebSocket.instances[0].mockOpen()

    expect(() => client.close()).not.toThrow()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(client.socket).toBeNull()
    expect(client.isClosed).toBe(true)

    client.removeEventListener('close', onClose)
  })

  it('superseded close 回调内 close、connect、close 不会递归', () => {
    FakeWebSocket.autoCompleteClose = false
    const client = createWS()
    const onClose = vi.fn(() => {
      client.close()
      client.connect()
      client.close()
    })
    client.addEventListener('close', onClose)
    client.connect()
    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.mockDrop()

    expect(() => window.dispatchEvent(new Event('online'))).not.toThrow()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(client.socket).toBeNull()
    expect(client.isClosed).toBe(true)

    client.removeEventListener('close', onClose)
  })

  it('页面恢复早于关闭完成时按 close 到 open 的逻辑顺序投递', async () => {
    vi.useFakeTimers()
    FakeWebSocket.autoCompleteClose = false
    let visibilityState: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
    const onVisible = vi.fn()
    const client = createWS({
      leaveTime: 0,
      onVisible,
      stopOnHidden: true,
    })
    client.connect()
    const onClose = vi.fn()
    const events: string[] = []
    client.onclose = onClose
    client.addEventListener('close', (event) => {
      events.push(`close:${client.isClosed}`)
      expect(event.target).toBe(client)
      expect(event.currentTarget).toBe(client)
      expect(event).toMatchObject({
        code: 1006,
        reason: 'Connection superseded',
        superseded: true,
        wasClean: false,
      })
    })
    client.addEventListener('open', () => events.push('open'))
    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    events.length = 0

    visibilityState = 'hidden'
    window.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(first.readyState).toBe(FakeWebSocket.CLOSING)

    visibilityState = 'visible'
    window.dispatchEvent(new Event('visibilitychange'))
    const second = FakeWebSocket.instances[1]
    second.mockOpen()
    first.mockClose()

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onVisible).toHaveBeenCalledWith()
    expect(events).toEqual(['close:true', 'open'])
  })

  it('旧 socket 的迟到 close 不会让 once 监听重复触发', () => {
    FakeWebSocket.autoCompleteClose = false
    const client = createWS()
    client.connect()
    const onClose = vi.fn()
    client.addEventListener('close', onClose, { once: true })
    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.close()

    window.dispatchEvent(new Event('online'))
    const second = FakeWebSocket.instances[1]
    first.mockClose()
    second.mockClose()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('缺少全局 CloseEvent 时仍能转发物理 close 字段', () => {
    const physicalClose = new CloseEvent('close', {
      code: 4001,
      reason: 'server closed',
      wasClean: true,
    })
    const client = createWS({ autoReconnect: false })
    client.connect()
    const onClose = vi.fn()
    client.addEventListener('close', onClose)
    const socket = FakeWebSocket.instances[0]
    socket.mockOpen()
    socket.readyState = FakeWebSocket.CLOSED
    vi.stubGlobal('CloseEvent', undefined)

    expect(() => socket.dispatchEvent(physicalClose)).not.toThrow()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toMatchObject({
      code: 4001,
      reason: 'server closed',
      wasClean: true,
    })
  })

  it('重连后不投递旧 socket 的迟到 message', () => {
    FakeWebSocket.autoCompleteClose = false
    const client = createWS()
    client.connect()
    const onMessage = vi.fn()
    client.addEventListener('message', onMessage)
    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.close()

    window.dispatchEvent(new Event('online'))
    first.mockMessage('stale')

    expect(onMessage).not.toHaveBeenCalled()
  })

  it('替换 property handler 时保持原始监听顺序', () => {
    const client = createWS()
    client.connect()
    const events: string[] = []
    client.onmessage = () => events.push('property-before')
    client.addEventListener('message', () => events.push('listener'))
    client.onmessage = () => events.push('property-after')

    FakeWebSocket.instances[0].mockMessage('data')

    expect(events).toEqual(['property-after', 'listener'])
  })

  it('dispose 后每个逻辑转换只投递一次 close', () => {
    FakeWebSocket.autoCompleteClose = false
    const client = createWS()
    client.connect()
    const onClose = vi.fn()
    client.addEventListener('close', onClose)
    const first = FakeWebSocket.instances[0]
    first.mockOpen()
    first.close()

    window.dispatchEvent(new Event('online'))
    const second = FakeWebSocket.instances[1]
    second.mockOpen()
    expect(onClose).toHaveBeenCalledTimes(1)

    client.dispose()
    first.mockClose()
    second.mockClose()

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('非预期关闭后按指数退避重连，并遵守次数上限', async () => {
    vi.useFakeTimers()
    const onReconnectAttempt = vi.fn()
    const onReconnectExhausted = vi.fn()
    const client = createWS({
      reconnectBaseDelay: 100,
      reconnectMaxDelay: 200,
      maxReconnectAttempts: 2,
      onReconnectAttempt,
      onReconnectExhausted,
    })
    client.connect()
    FakeWebSocket.instances[0].mockOpen()
    FakeWebSocket.instances[0].mockClose()

    expect(onReconnectAttempt).toHaveBeenLastCalledWith({ attempt: 1, delay: 100 })
    await vi.advanceTimersByTimeAsync(100)
    expect(FakeWebSocket.instances).toHaveLength(2)

    FakeWebSocket.instances[1].mockClose()
    expect(onReconnectAttempt).toHaveBeenLastCalledWith({ attempt: 2, delay: 200 })
    await vi.advanceTimersByTimeAsync(200)
    expect(FakeWebSocket.instances).toHaveLength(3)

    FakeWebSocket.instances[2].mockClose()
    expect(onReconnectExhausted).toHaveBeenCalledTimes(1)
  })

  it('同一重连周期只报告一次次数耗尽', () => {
    const onReconnectExhausted = vi.fn()
    const client = createWS({
      maxReconnectAttempts: 0,
      onReconnectExhausted,
    })
    client.connect()

    const socket = FakeWebSocket.instances[0]
    socket.mockClose()
    socket.dispatchEvent(new CloseEvent('close'))

    expect(onReconnectExhausted).toHaveBeenCalledTimes(1)
  })

  it('手动 connect 在次数耗尽后开启新的重连周期', async () => {
    vi.useFakeTimers()
    const onReconnectAttempt = vi.fn()
    const onReconnectExhausted = vi.fn()
    const client = createWS({
      reconnectBaseDelay: 100,
      maxReconnectAttempts: 1,
      onReconnectAttempt,
      onReconnectExhausted,
    })
    client.connect()
    FakeWebSocket.instances[0].mockClose()
    await vi.advanceTimersByTimeAsync(100)
    FakeWebSocket.instances[1].mockClose()
    expect(onReconnectExhausted).toHaveBeenCalledTimes(1)

    client.connect()
    FakeWebSocket.instances[2].mockClose()

    expect(onReconnectAttempt).toHaveBeenCalledTimes(2)
    expect(onReconnectAttempt).toHaveBeenLastCalledWith({ attempt: 1, delay: 100 })
    await vi.advanceTimersByTimeAsync(100)
    expect(FakeWebSocket.instances).toHaveLength(4)
  })

  it('online 在次数耗尽后开启新的重连周期', async () => {
    vi.useFakeTimers()
    const onReconnectAttempt = vi.fn()
    const client = createWS({
      reconnectBaseDelay: 100,
      maxReconnectAttempts: 1,
      onReconnectAttempt,
    })
    client.connect()
    FakeWebSocket.instances[0].mockClose()
    await vi.advanceTimersByTimeAsync(100)
    FakeWebSocket.instances[1].mockClose()

    window.dispatchEvent(new Event('online'))
    FakeWebSocket.instances[2].mockClose()

    expect(onReconnectAttempt).toHaveBeenCalledTimes(2)
    expect(onReconnectAttempt).toHaveBeenLastCalledWith({ attempt: 1, delay: 100 })
  })

  it('显式 close 会清除页面隐藏定时器', () => {
    vi.useFakeTimers()
    let visibilityState: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
    const onHidden = vi.fn()
    const client = createWS({
      leaveTime: 100,
      stopOnHidden: true,
      onHidden,
    })
    client.connect()

    visibilityState = 'hidden'
    window.dispatchEvent(new Event('visibilitychange'))
    client.close()
    vi.advanceTimersByTime(100)

    expect(onHidden).not.toHaveBeenCalled()
  })

  it('没有 window 时仍可连接和关闭', () => {
    vi.stubGlobal('window', undefined)
    const client = createWS()
    client.connect()
    FakeWebSocket.instances[0].mockOpen()

    expect(client.readyState).toBe(FakeWebSocket.OPEN)
    expect(() => client.close()).not.toThrow()
  })

  it('没有 WebSocket 实现时抛出明确错误', () => {
    vi.stubGlobal('WebSocket', undefined)
    const client = createWS()

    expect(() => client.connect()).toThrow(
      '[WS] WebSocket is not available in the current environment',
    )
  })

  it('仅在注入 logger 时输出生命周期日志', () => {
    const logger = { warn: vi.fn() }
    const client = createWS({ logger, maxQueuedMessages: 0 })
    client.send('rejected')

    expect(logger.warn).toHaveBeenCalledWith(
      '[WS] message rejected because the queue is full',
      { maxQueuedMessages: 0 },
    )
  })
})
