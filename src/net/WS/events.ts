/** 克隆普通物理事件，避免泄露底层 socket 身份 */
import type { WSCloseEvent } from './types'

export function cloneEvent(event: Event) {
  return new Event(event.type, {
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    composed: event.composed,
  })
}

/** 克隆消息事件，并兼容缺少 MessageEvent 构造器的宿主 */
export function cloneMessageEvent(event: MessageEvent) {
  if (typeof MessageEvent !== 'undefined') {
    return new MessageEvent('message', {
      data: event.data,
      lastEventId: event.lastEventId,
      origin: event.origin,
      ports: [...event.ports],
      source: event.source,
    })
  }

  return defineEventFields(new Event('message'), {
    data: event.data,
    lastEventId: event.lastEventId,
    origin: event.origin,
    ports: event.ports,
    source: event.source,
  }) as MessageEvent
}

/** 创建逻辑关闭事件，并兼容缺少 CloseEvent 构造器的宿主 */
export function createCloseEvent(init: CloseEventFields) {
  const { code, reason, superseded, wasClean } = init
  const fields = { code, reason, wasClean }
  if (typeof CloseEvent !== 'undefined') {
    const event = new CloseEvent('close', fields)
    return superseded === undefined
      ? event
      : defineEventFields(event, { superseded }) as WSCloseEvent
  }

  return defineEventFields(new Event('close'), {
    ...fields,
    ...(superseded === undefined
      ? {}
      : { superseded }),
  }) as WSCloseEvent
}

type CloseEventFields = Pick<CloseEvent, 'code' | 'reason' | 'wasClean'> & {
  superseded?: boolean
}

function defineEventFields(event: Event, fields: Record<string, unknown>) {
  for (const [key, value] of Object.entries(fields)) {
    Object.defineProperty(event, key, {
      configurable: true,
      enumerable: true,
      value,
    })
  }
  return event
}
