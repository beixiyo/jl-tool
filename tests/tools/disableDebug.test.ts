import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { disableDebug } from '@/tools/disableDebug'

describe('disableDebug', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('不应该拦截普通 j，但应该拦截开发者工具快捷键', () => {
    const cleanup = disableDebug({
      secret: 'secret',
      disableMenu: false,
    })

    const plainJ = new KeyboardEvent('keydown', {
      key: 'j',
      cancelable: true,
    })
    document.dispatchEvent(plainJ)
    expect(plainJ.defaultPrevented).toBe(false)

    const devtoolsShortcut = new KeyboardEvent('keydown', {
      key: 'j',
      metaKey: true,
      altKey: true,
      cancelable: true,
    })
    document.dispatchEvent(devtoolsShortcut)
    expect(devtoolsShortcut.defaultPrevented).toBe(true)

    const windowsShortcut = new KeyboardEvent('keydown', {
      key: 'I',
      ctrlKey: true,
      shiftKey: true,
      cancelable: true,
    })
    document.dispatchEvent(windowsShortcut)
    expect(windowsShortcut.defaultPrevented).toBe(true)

    cleanup()

    const afterCleanup = new KeyboardEvent('keydown', {
      key: 'i',
      metaKey: true,
      altKey: true,
      cancelable: true,
    })
    document.dispatchEvent(afterCleanup)
    expect(afterCleanup.defaultPrevented).toBe(false)
  })

  it('重复触发解锁快捷键时只创建一个输入框，并可统一清理', () => {
    const cleanup = disableDebug({
      secret: 'secret',
      disableF12: false,
      disableMenu: false,
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', shiftKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', shiftKey: true }))
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(1)

    cleanup()
    expect(document.querySelector('input[type="password"]')).toBeNull()
  })

  it('可以只上报窗口尺寸检测结果而不跳转页面', () => {
    const onDetected = vi.fn()
    const originalOuterWidth = window.outerWidth
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'outerWidth', { configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })

    const cleanup = disableDebug({
      secret: 'secret',
      detectDebugger: false,
      redirectOnDetected: false,
      onDetected,
    })
    vi.advanceTimersByTime(1000)
    expect(onDetected).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(onDetected).toHaveBeenCalledOnce()
    expect(onDetected).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'window-size',
      widthGap: 400,
      matches: 2,
    }))
    expect(location.href).not.toBe('about:blank')

    cleanup()
    Object.defineProperty(window, 'outerWidth', { configurable: true, value: originalOuterWidth })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth })
  })

  it('应该按照自定义间隔、尺寸阈值和连续次数检测窗口', () => {
    const onDetected = vi.fn()
    const originalOuterWidth = window.outerWidth
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'outerWidth', { configurable: true, value: 900 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })

    const cleanup = disableDebug({
      secret: 'secret',
      detectDebugger: false,
      detectionInterval: 200,
      windowSizeThreshold: 50,
      windowSizeMatchCount: 3,
      redirectOnDetected: false,
      onDetected,
    })
    vi.advanceTimersByTime(599)
    expect(onDetected).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onDetected).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'window-size',
      widthGap: 100,
      matches: 3,
    }))

    cleanup()
    Object.defineProperty(window, 'outerWidth', { configurable: true, value: originalOuterWidth })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth })
  })

  it('debugger 暂停超过自定义阈值时应该上报测量时长', () => {
    const onDetected = vi.fn()
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(75)

    const cleanup = disableDebug({
      secret: 'secret',
      detectWindowSize: false,
      debuggerThreshold: 50,
      detectionInterval: 100,
      redirectOnDetected: false,
      onDetected,
    })
    vi.advanceTimersByTime(100)

    expect(onDetected).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'debugger-pause',
      elapsed: 65,
    }))
    cleanup()
  })

  it('应该清理右键和 F12 的拦截监听器', () => {
    const cleanup = disableDebug({ secret: 'secret' })
    const contextMenu = new MouseEvent('contextmenu', { cancelable: true })
    const f12 = new KeyboardEvent('keydown', { key: 'F12', cancelable: true })

    document.dispatchEvent(contextMenu)
    document.dispatchEvent(f12)
    expect(contextMenu.defaultPrevented).toBe(true)
    expect(f12.defaultPrevented).toBe(true)

    cleanup()

    const afterContextMenu = new MouseEvent('contextmenu', { cancelable: true })
    const afterF12 = new KeyboardEvent('keydown', { key: 'F12', cancelable: true })
    document.dispatchEvent(afterContextMenu)
    document.dispatchEvent(afterF12)
    expect(afterContextMenu.defaultPrevented).toBe(false)
    expect(afterF12.defaultPrevented).toBe(false)
  })
})
