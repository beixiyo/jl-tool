import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EventBus } from '@/channel/EventBus'

describe('eventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  afterEach(() => {
    eventBus.off() // 清除所有事件
  })

  describe('on', () => {
    it('应该注册事件监听器', () => {
      const callback = () => {}
      const unsubscribe = eventBus.on('test', callback)
      expect(typeof unsubscribe).toBe('function')
    })

    it('应该支持多个监听器', () => {
      const callback1 = () => {}
      const callback2 = () => {}
      const unsubscribe1 = eventBus.on('test', callback1)
      const unsubscribe2 = eventBus.on('test', callback2)
      expect(typeof unsubscribe1).toBe('function')
      expect(typeof unsubscribe2).toBe('function')
    })

    it('应该支持多个事件', () => {
      const callback = () => {}
      const unsubscribe1 = eventBus.on('event1', callback)
      const unsubscribe2 = eventBus.on('event2', callback)
      expect(typeof unsubscribe1).toBe('function')
      expect(typeof unsubscribe2).toBe('function')
    })
  })

  describe('emit', () => {
    it('应该触发事件监听器', () => {
      let called = false
      const callback = () => { called = true }
      eventBus.on('test', callback)
      eventBus.emit('test', undefined)
      expect(called).toBe(true)
    })

    it('应该传递参数给监听器', () => {
      let receivedData: any = null
      const callback = (data: any) => { receivedData = data }
      eventBus.on('test', callback)
      eventBus.emit('test', { message: 'hello' })
      expect(receivedData).toEqual({ message: 'hello' })
    })

    it('应该触发多个监听器', () => {
      let count = 0
      const callback1 = () => { count++ }
      const callback2 = () => { count++ }
      eventBus.on('test', callback1)
      eventBus.on('test', callback2)
      eventBus.emit('test', undefined)
      expect(count).toBe(2)
    })

    it('应该处理不存在的事件', () => {
      expect(() => eventBus.emit('nonexistent', undefined)).not.toThrow()
    })
  })

  describe('off', () => {
    it('应该移除指定的监听器', () => {
      let count = 0
      const callback1 = () => { count++ }
      const callback2 = () => { count++ }
      eventBus.on('test', callback1)
      eventBus.on('test', callback2)
      eventBus.off('test', callback1)
      eventBus.emit('test', undefined)
      expect(count).toBe(1)
    })

    it('应该移除所有监听器', () => {
      let count = 0
      const callback = () => { count++ }
      eventBus.on('test', callback)
      eventBus.off('test')
      eventBus.emit('test', undefined)
      expect(count).toBe(0)
    })

    it('应该处理不存在的监听器', () => {
      const callback = () => {}
      expect(() => eventBus.off('test', callback)).not.toThrow()
    })
  })

  describe('once', () => {
    it('应该只触发一次监听器', () => {
      let count = 0
      const callback = () => { count++ }
      eventBus.once('test', callback)
      eventBus.emit('test', undefined)
      eventBus.emit('test', undefined)
      expect(count).toBe(1)
    })

    it('应该传递参数给 once 监听器', () => {
      let receivedData: any = null
      const callback = (data: any) => { receivedData = data }
      eventBus.once('test', callback)
      eventBus.emit('test', { message: 'hello' })
      expect(receivedData).toEqual({ message: 'hello' })
    })
  })

  describe('unsubscribe', () => {
    it('应该通过返回的函数取消订阅', () => {
      let count = 0
      const callback = () => { count++ }
      const unsubscribe = eventBus.on('test', callback)
      eventBus.emit('test', undefined)
      expect(count).toBe(1)
      unsubscribe()
      eventBus.emit('test', undefined)
      expect(count).toBe(1) // 应该还是1，因为已经取消订阅
    })
  })

  describe('clear all', () => {
    it('应该清除所有事件', () => {
      let count = 0
      const callback = () => { count++ }
      eventBus.on('event1', callback)
      eventBus.on('event2', callback)
      eventBus.off() // 清除所有事件
      eventBus.emit('event1', undefined)
      eventBus.emit('event2', undefined)
      expect(count).toBe(0)
    })
  })
})
