type Message = Parameters<WebSocket['send']>[0]

/** 管理有容量和有效期边界的待发消息 */
export class MessageQueue {
  readonly enabled: boolean

  private maxSize: number
  private ttl: number
  private messages: QueuedMessage[] = []

  constructor(options: MessageQueueOptions) {
    this.enabled = options.enabled
    this.maxSize = options.maxSize
    this.ttl = options.ttl
  }

  enqueue(data: Message) {
    this.purgeExpired()
    if (this.messages.length >= this.maxSize) {
      return false
    }

    this.messages.push({
      data,
      expiresAt: this.ttl < 0
        ? Number.POSITIVE_INFINITY
        : Date.now() + this.ttl,
    })
    return true
  }

  flush(send: (message: Message) => boolean) {
    this.purgeExpired()
    while (this.messages.length > 0) {
      const message = this.messages[0]
      if (!send(message.data)) {
        return
      }
      this.messages.shift()
    }
  }

  clear() {
    this.messages = []
  }

  private purgeExpired() {
    const now = Date.now()
    this.messages = this.messages.filter(message => message.expiresAt > now)
  }
}

type MessageQueueOptions = {
  enabled: boolean
  maxSize: number
  ttl: number
}

type QueuedMessage = {
  data: Message
  expiresAt: number
}
