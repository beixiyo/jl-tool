import type { MediaAccessErrorContext } from '@/webApi/MediaPermission'
import { describe, expect, it } from 'vitest'
import { classifyMediaAccessError } from '@/webApi/MediaPermission'

/**
 * 归类结果决定调用方给用户什么引导：分错了要么该引导时不引导，要么用户刚拒绝又被打扰
 * 错误名与 message 取自各家浏览器源码里的真实报法
 */
describe('classifyMediaAccessError', () => {
  const granted: MediaAccessErrorContext = { stateBefore: 'granted', stateAfter: 'granted', hasInputDevice: true }

  it('chromium macOS 系统关闭浏览器麦克风', () => {
    const error = new DOMException('Permission denied by system', 'NotAllowedError')
    expect(classifyMediaAccessError(error, granted)).toBe('system-denied')
  })

  it('firefox macOS 系统关闭时报 NotFoundError，但设备列表里有设备', () => {
    const error = new DOMException('The object can not be found here.', 'NotFoundError')
    expect(classifyMediaAccessError(error, granted)).toBe('system-denied')
  })

  it('真的没有设备', () => {
    const error = new DOMException('Requested device not found', 'NotFoundError')
    expect(classifyMediaAccessError(error, { ...granted, hasInputDevice: false })).toBe('no-device')
  })

  it('调用前本站已被拒绝', () => {
    const error = new DOMException('Permission denied', 'NotAllowedError')
    expect(classifyMediaAccessError(error, { stateBefore: 'denied', stateAfter: 'denied', hasInputDevice: true }))
      .toBe('blocked')
  })

  it('这次授权窗口里刚点了拒绝', () => {
    const error = new DOMException('Permission denied', 'NotAllowedError')
    expect(classifyMediaAccessError(error, { stateBefore: 'prompt', stateAfter: 'denied', hasInputDevice: true }))
      .toBe('denied')
  })

  it('关掉授权窗口没有选择', () => {
    const error = new DOMException('Permission dismissed', 'NotAllowedError')
    expect(classifyMediaAccessError(error, { stateBefore: 'prompt', stateAfter: 'prompt', hasInputDevice: true }))
      .toBe('dismissed')
  })

  it('读不到授权状态的浏览器被拒，按已拒绝处理', () => {
    const error = new DOMException('The request is not allowed by the user agent', 'NotAllowedError')
    expect(classifyMediaAccessError(error, { stateBefore: 'unknown', stateAfter: 'unknown', hasInputDevice: true }))
      .toBe('blocked')
  })

  it('设备被占用', () => {
    const error = new DOMException('Device in use', 'NotReadableError')
    expect(classifyMediaAccessError(error, granted)).toBe('device-busy')
  })
})
