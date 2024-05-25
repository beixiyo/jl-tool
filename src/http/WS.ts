import { EventBus } from '../channel/EventBus'


/**
 * 根据网络状态自动重连的 WebSocket
 */
export class WS extends EventBus {

    private url = ''
    private socket?: WebSocket

    /** 重连次数 */
    private reconnectAttempts = 0
    /** 最大重连数，默认 5 */
    public maxReconnectAttempts = 5

    /** 重连间隔，默认 10000 ms（10s） */
    public reconnectInterval = 10000
    /** 发送心跳数据间隔，默认 30000 ms（30s） */
    public heartbeatInterval = 30000

    /** 计时器 id */
    private heartbeatTimer?: number
    /** 彻底终止 WS */
    private isStop = false

    private rmNetEvent: VoidFunction
    private static SPACE = '    '

    /**
     * @param url 地址，如 ws://127.0.0.1:8080
     * @example
     * const ws = new WS('ws://127.0.0.1:8080')
     * ws.connect()
     * ws.onmessage(() => { ... })
     */
    constructor(url: string) {
        super()
        this.url = url
        this.rmNetEvent = this.bindNetEvent()
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
        if (this.reconnectAttempts === 0) {
            this.logInfo('初始化连接中...')
        }
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return
        }
        this.socket = new WebSocket(this.url)

        /** WebSocket 连接成功 */
        this.socket.onopen = event => {
            this.isStop = false
            this.reconnectAttempts = 0
            this.startHeartbeat()

            this.logInfo('连接成功 [onopen]...')
            this.emit('open', event)
        }

        this.socket.onmessage = event => {
            this.emit('message', event)
            this.startHeartbeat()
        }

        this.socket.onclose = event => {
            if (this.reconnectAttempts === 0) {
                this.logInfo('连接断开 [onclose]')
            }
            if (!this.isStop) {
                this.handleReconnect()
            }
            this.emit('close', event)
        }

        this.socket.onerror = event => {
            if (this.reconnectAttempts === 0) {
                this.logInfo('连接异常 [onerror]...')
            }
            this.stopHeartbeat()
            this.emit('error', event)
        }
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
            this.rmNetEvent()
        }
        this.stopHeartbeat()
    }

    // 私有方法 ==================================================

    private logInfo(msg: string, type: 'log' | 'warn' = 'log') {
        console[type](`WS ${msg}${WS.SPACE}${this.url}`)
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

        return () => {
            window.removeEventListener('online', onOnline)
            window.removeEventListener('offline', onOffline)
        }
    }

    /** 断网重连逻辑 */
    private handleReconnect() {
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
