import { describe, expect, it, vi } from 'vitest'
import { EventBus } from '@/channel'

/** 测试字符串类型事件 */
describe('eventBus with string event types', () => {
  it('should subscribe and emit events with string types', () => {
    const bus = new EventBus<string>()
    const handler = vi.fn()

    bus.on('test-event', handler)
    bus.emit('test-event', 'test-data')

    expect(handler).toHaveBeenCalledWith('test-data')
  })

  it('should handle once events correctly', () => {
    const bus = new EventBus<string>()
    const handler = vi.fn()

    bus.once('once-event', handler)
    bus.emit('once-event', 'data1')
    bus.emit('once-event', 'data2')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('data1')
  })

  it('should unsubscribe correctly', () => {
    const bus = new EventBus<string>()
    const handler = vi.fn()

    const off = bus.on('unsubscribe-event', handler)
    bus.emit('unsubscribe-event', 'data')
    expect(handler).toHaveBeenCalledTimes(1)

    off()
    bus.emit('unsubscribe-event', 'data2')
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

/** 测试枚举类型事件 */
enum TestEvents {
  DataUpdate = 'data-update',
  UserLogin = 'user-login',
  PageChange = 'page-change',
}

describe('eventBus with enum event types', () => {
  it('should subscribe and emit events with enum types', () => {
    const bus = new EventBus<TestEvents>()
    const handler = vi.fn()

    bus.on(TestEvents.DataUpdate, handler)
    bus.emit(TestEvents.DataUpdate, { id: 1, name: 'test' })

    expect(handler).toHaveBeenCalledWith({ id: 1, name: 'test' })
  })

  it('should handle multiple enum events', () => {
    const bus = new EventBus<TestEvents>()
    const dataHandler = vi.fn()
    const loginHandler = vi.fn()

    bus.on(TestEvents.DataUpdate, dataHandler)
    bus.on(TestEvents.UserLogin, loginHandler)

    bus.emit(TestEvents.DataUpdate, { id: 1 })
    bus.emit(TestEvents.UserLogin, { userId: 'user123' })

    expect(dataHandler).toHaveBeenCalledWith({ id: 1 })
    expect(loginHandler).toHaveBeenCalledWith({ userId: 'user123' })
  })
})

/** 测试对象映射类型事件 */
interface EventMap {
  'user-action': { action: string, userId: string }
  'data-loaded': { data: any[], timestamp: number }
  'error-occurred': { message: string, code: number }
}

describe('eventBus with object mapping event types', () => {
  it('should subscribe and emit events with strict typing', () => {
    const bus = new EventBus<EventMap>()
    const handler = vi.fn()

    bus.on('user-action', handler)
    bus.emit('user-action', { action: 'click', userId: 'user123' })

    expect(handler).toHaveBeenCalledWith({ action: 'click', userId: 'user123' })
  })

  it('should provide type safety for event parameters', () => {
    const bus = new EventBus<EventMap>()
    const handler = vi.fn()

    bus.on('data-loaded', handler)
    bus.emit('data-loaded', { data: [1, 2, 3], timestamp: Date.now() })

    expect(handler).toHaveBeenCalledWith({
      data: expect.any(Array),
      timestamp: expect.any(Number),
    })
  })

  it('should enforce correct parameter types', () => {
    const bus = new EventBus<EventMap>()

    /** 这些应该是类型安全的，TypeScript 会在编译时检查参数类型 */
    bus.on('error-occurred', (params) => {
      // TypeScript 应该知道 params.message 是 string 类型
      // TypeScript 应该知道 params.code 是 number 类型
      expect(typeof params.message).toBe('string')
      expect(typeof params.code).toBe('number')
    })

    bus.emit('error-occurred', { message: 'Test error', code: 500 })
  })
})

/** 测试 triggerBefore 选项 */
describe('eventBus triggerBefore option', () => {
  it('should store and trigger missed events when triggerBefore is true', () => {
    const bus = new EventBus<string>({ triggerBefore: true })
    const handler = vi.fn()

    /** 先发送事件，再订阅 */
    bus.emit('missed-event', 'data')
    bus.on('missed-event', handler)

    expect(handler).toHaveBeenCalledWith('data')
  })

  it('should not trigger missed events when triggerBefore is false', () => {
    const bus = new EventBus<string>({ triggerBefore: false })
    const handler = vi.fn()

    /** 先发送事件，再订阅 */
    bus.emit('missed-event', 'data')
    bus.on('missed-event', handler)

    expect(handler).not.toHaveBeenCalled()
  })
})

/** 测试 off 方法 */
describe('eventBus off method', () => {
  it('should remove specific event listener', () => {
    const bus = new EventBus<string>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('test-event', handler1)
    bus.on('test-event', handler2)

    bus.emit('test-event', 'data')
    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)

    bus.off('test-event', handler1)
    bus.emit('test-event', 'data')

    expect(handler1).toHaveBeenCalledTimes(1) // 不再被调用
    expect(handler2).toHaveBeenCalledTimes(2) // 仍然被调用
  })

  it('should remove all listeners for an event', () => {
    const bus = new EventBus<string>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('test-event', handler1)
    bus.on('test-event', handler2)

    bus.emit('test-event', 'data')
    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)

    bus.off('test-event') // 移除所有监听器
    bus.emit('test-event', 'data')

    expect(handler1).toHaveBeenCalledTimes(1) // 不再被调用
    expect(handler2).toHaveBeenCalledTimes(1) // 不再被调用
  })

  it('should clear all events', () => {
    const bus = new EventBus<string>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('event1', handler1)
    bus.on('event2', handler2)

    bus.emit('event1', 'data1')
    bus.emit('event2', 'data2')

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)

    bus.off() // 清除所有事件

    bus.emit('event1', 'data1')
    bus.emit('event2', 'data2')

    expect(handler1).toHaveBeenCalledTimes(1) // 不再被调用
    expect(handler2).toHaveBeenCalledTimes(1) // 不再被调用
  })
})
