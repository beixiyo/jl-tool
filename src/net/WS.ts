import { EventBus } from '../channel/EventBus'


/**
 * 根据网络状态自动重连的 WebSocket
 */
export class WS extends EventBus {

    private url = ''
    private protocols?: string | string[]
    private socket?: WebSocket

    /** 已经重连次数 */
    private reconnectAttempts = 0
    /** 最大重连数，默认 5 */
    maxReconnectAttempts = 5

    /** 重连间隔，默认 10000 ms（10s） */
    reconnectInterval = 10000
    /** 发送心跳数据间隔，默认 30000 ms（30s） */
    heartbeatInterval = 30000

    /** 计时器 id */
    private heartbeatTimer?: number
    /** 彻底终止 WS */
    private isStop = false

    /** 标识是自己发的消息 */
    private myId = Date.now().toString()
    /**
     * 自定义 id 名称，标识是自己发送的消息，不会通过 onmessage 接收自己的消息
     * 
     * 如果设置为空字符、null、undefined，则不会发送额外的 id
     * 
     * 默认 '__WS_ID__'，如果你未进行任何设置，则会发送如下消息到服务端
     * @example
     * {
     *      __WS_ID__: Date.now().toString(),
     *      message: '消息内容'
     * }
     */
    customId: string | null | undefined = '__WS_ID__'

    /** 删除事件 */
    private rmNetEvent?: VoidFunction
    private static SPACE = '    '

    /**
     * @param url 地址，如 ws://127.0.0.1:8080
     * @example
     * const ws = new WS('ws://127.0.0.1:8080')
     * ws.connect()
     * ws.onmessage(() => { ... })
     */
    constructor(url: string, protocols?: string | string[]) {
        super()
        this.url = url
        this.protocols = protocols
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
            if (this.customId) {
                this.socket.send(JSON.stringify({
                    [this.customId]: this.myId,
                    message
                }))
                return
            }

            this.socket.send(message)
            return
        }

        this.logInfo('未连接，请先调用 connect', 'warn')
    }

    connect() {
        this.rmNetEvent?.()
        this.rmNetEvent = this.bindNetEvent()

        if (this.reconnectAttempts === 0) {
            this.logInfo('初始化连接中...')
        }
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
            this.isStop = true
            this.socket.close()
            this.socket = undefined

            this.off('open')
            this.off('message')
            this.off('close')
            this.off('error')
            this.rmNetEvent?.()
        }
        this.stopHeartbeat()
    }

    // 私有方法 ==================================================

    /** WebSocket 连接成功 */
    private handleOpen() {
        if (!this.socket) return
        this.socket.onopen = event => {
            this.isStop = false
            this.reconnectAttempts = 0
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
            catch { }

            /**
              * 是自己发的消息，不广播给自己
              */
            if (this.customId && data?.[this.customId] === this.myId) {
                return
            }

            this.emit('message', event)
            this.startHeartbeat()
        }
    }

    private handleClose() {
        if (!this.socket) return
        this.socket.onclose = event => {
            if (this.reconnectAttempts === 0) {
                this.logInfo('连接断开 [onclose]')
            }
            if (!this.isStop) {
                this.reconnect()
            }
            this.emit('close', event)
        }
    }

    private handleError() {
        if (!this.socket) return
        this.socket.onerror = event => {
            if (this.reconnectAttempts === 0) {
                this.logInfo('连接异常 [onerror]...')
            }
            this.stopHeartbeat()
            this.emit('error', event)
        }
    }

    private logInfo(msg: string, type: 'log' | 'warn' = 'log') {
        console[type](`WS ${msg}${WS.SPACE}${this.url}`)
    }

    /** 网络状态变更处理逻辑 */
    private bindNetEvent() {
        if (typeof window === 'undefined' || typeof window.addEventListener === 'undefined') {
            return () => { }
        }

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

        return () => {
            window.removeEventListener('online', onOnline)
            window.removeEventListener('offline', onOffline)
        }
    }

    /** 断网重连逻辑 */
    private reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            this.logInfo(`尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

            setTimeout(this.connect.bind(this), this.reconnectInterval)
            return
        }

        this.stopHeartbeat()
        this.logInfo(`超过重连次数，终止重连: ${this.url}`, 'warn')
    }

    /** 开始心跳检测，定时发送心跳消息 */
    private startHeartbeat() {
        if (this.isStop) return
        if (this.heartbeatTimer) {
            this.stopHeartbeat()
        }

        this.heartbeatTimer = window.setInterval(
            () => {
                if (this.socket) {
                    this.socket.send(JSON.stringify({ type: 'heartBeat', data: {} }))
                    this.logInfo('发送送心跳中...')
                    return
                }

                console.error('[WebSocket] 未连接')
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