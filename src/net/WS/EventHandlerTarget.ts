/** 承载 WebSocket 四类属性处理器的稳定 EventTarget */
import type { WSCloseEvent } from './types'

export class EventHandlerTarget<T extends EventTarget> extends EventTarget {
  #eventHandlers = new Map<SocketEventProp, SocketEventHandler<T>>()
  #eventHandlerListeners = new Map<SocketEventProp, EventListener>()

  get onopen() {
    return this.#getEventHandler('onopen') as OpenHandler<T>
  }

  set onopen(handler) {
    this.#setEventHandler('onopen', handler)
  }

  get onmessage() {
    return this.#getEventHandler('onmessage') as MessageHandler<T>
  }

  set onmessage(handler) {
    this.#setEventHandler('onmessage', handler)
  }

  get onerror() {
    return this.#getEventHandler('onerror') as ErrorHandler<T>
  }

  set onerror(handler) {
    this.#setEventHandler('onerror', handler)
  }

  get onclose() {
    return this.#getEventHandler('onclose') as CloseHandler<T>
  }

  set onclose(handler) {
    this.#setEventHandler('onclose', handler)
  }

  addEventListener<K extends keyof WSEventMap>(
    type: K,
    listener: (this: T, event: WSEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(type, listener, options)
  }

  removeEventListener<K extends keyof WSEventMap>(
    type: K,
    listener: (this: T, event: WSEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) {
    super.removeEventListener(type, listener, options)
  }

  #getEventHandler(prop: SocketEventProp) {
    return this.#eventHandlers.get(prop) ?? null
  }

  #setEventHandler(prop: SocketEventProp, handler: SocketEventHandler<T>) {
    if (!handler) {
      this.#eventHandlers.delete(prop)
      const listener = this.#eventHandlerListeners.get(prop)
      if (listener) {
        this.removeEventListener(prop.slice(2), listener)
        this.#eventHandlerListeners.delete(prop)
      }
      return
    }

    this.#eventHandlers.set(prop, handler)
    if (this.#eventHandlerListeners.has(prop)) {
      return
    }

    const listener: EventListener = (event) => {
      const currentHandler = this.#eventHandlers.get(prop)
      currentHandler && Reflect.apply(currentHandler, this, [event])
    }
    this.#eventHandlerListeners.set(prop, listener)
    this.addEventListener(prop.slice(2), listener)
  }
}

type SocketEventProp = 'onopen' | 'onmessage' | 'onerror' | 'onclose'
type SocketEventHandler<T extends EventTarget> = OpenHandler<T>
  | MessageHandler<T>
  | ErrorHandler<T>
  | CloseHandler<T>

type OpenHandler<T extends EventTarget> = ((this: T, event: Event) => any) | null
type MessageHandler<T extends EventTarget> = ((this: T, event: MessageEvent) => any) | null
type ErrorHandler<T extends EventTarget> = ((this: T, event: Event) => any) | null
type CloseHandler<T extends EventTarget> = ((this: T, event: WSCloseEvent) => any) | null

type WSEventMap = Omit<WebSocketEventMap, 'close'> & {
  close: WSCloseEvent
}
