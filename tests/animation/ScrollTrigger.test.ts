import type { ScrollTrigger as ScrollTriggerInstance } from '@/animation/ScrollTrigger'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScrollTrigger } from '@/animation/ScrollTrigger'
import { getElementPosition } from '@/animation/ScrollTrigger/tools'

describe('ScrollTrigger', () => {
  let trigger: ScrollTriggerInstance | undefined

  afterEach(() => {
    trigger?.destroy()
    trigger = undefined
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('应该在自定义滚动容器的内容坐标系中计算元素位置', () => {
    const container = document.createElement('div')
    const element = document.createElement('div')

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect({
      top: 200,
      height: 300,
    }))
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect({
      top: 350,
      height: 100,
    }))
    Object.defineProperties(container, {
      clientHeight: { configurable: true, value: 300 },
      clientTop: { configurable: true, value: 2 },
      scrollTop: { configurable: true, value: 50 },
    })

    expect(getElementPosition(
      element,
      container,
      'top',
      'top',
      undefined,
      'vertical',
    )).toBe(198)
  })

  it('应该支持自定义容器的水平滚动、中心位置和偏移量', () => {
    const container = document.createElement('div')
    const element = document.createElement('div')

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect({
      left: 100,
      width: 400,
    }))
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect({
      left: 250,
      width: 80,
    }))
    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 400 },
      clientLeft: { configurable: true, value: 3 },
      scrollLeft: { configurable: true, value: 20 },
    })

    expect(getElementPosition(
      element,
      container,
      'center',
      'center',
      '+=10',
      'horizontal',
    )).toBe(17)
  })

  it('数字 scrub 收敛后应该能响应下一次滚动', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })

    const element = document.createElement('div')
    document.body.appendChild(element)
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => rect({
      top: -window.scrollY,
      height: 100,
    }))
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 50,
      writable: true,
    })

    const now = vi.spyOn(performance, 'now')
    trigger = new ScrollTrigger({
      trigger: element,
      start: ['top', 'top'],
      end: ['bottom', 'top'],
      scrub: 0.1,
      immediateRender: false,
    })

    trigger.update()
    expect(frames).toHaveLength(1)

    now
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(110)
      .mockReturnValueOnce(210)
    frames.shift()!(10)
    frames.shift()!(110)
    frames.shift()!(210)
    expect(frames).toHaveLength(0)

    window.scrollY = 80
    trigger.update()
    expect(frames).toHaveLength(1)
  })
})

function rect(overrides: Partial<DOMRect>): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...overrides,
  }
}
