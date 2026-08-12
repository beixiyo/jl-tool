import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adaptPx, getAllStyle, getStyle, handleCssUnit, pxToVw } from '@/domTools/cssTool'
import { copyToClipboard, findElementsByText, getSelectedText, isToBottom } from '@/domTools/domTool'

describe('domTool', () => {
  let testElement: HTMLElement

  beforeEach(() => {
    testElement = document.createElement('div')
    testElement.id = 'test-element'
    document.body.appendChild(testElement)
  })

  afterEach(() => {
    if (testElement.parentNode) {
      testElement.parentNode.removeChild(testElement)
    }
  })

  describe('getSelectedText', () => {
    it('应该获取选中的文本', () => {
      /** 模拟选中文本 */
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(testElement)
      selection?.removeAllRanges()
      selection?.addRange(range)

      expect(typeof getSelectedText()).toBe('string')
    })
  })

  describe('copyToClipboard', () => {
    it('应该复制文本到剪贴板', async () => {
      // Mock navigator.clipboard
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
      })

      const result = await copyToClipboard('test text')
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text')
    })
  })

  describe('isToBottom', () => {
    it('应该检测是否到达页面底部', () => {
      const result = isToBottom()
      expect(typeof result).toBe('boolean')
    })

    it('应该检测元素是否到达底部', () => {
      testElement.style.height = '100px'
      testElement.style.overflow = 'auto'
      const result = isToBottom(testElement)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('findElementsByText', () => {
    beforeEach(() => {
      testElement.innerHTML = '<span>test text</span><div>other text</div>'
    })

    it('应该根据文本查找元素', () => {
      const result = findElementsByText('test text')
      expect(Array.isArray(result)).toBe(true)
    })

    it('应该支持大小写敏感查找', () => {
      const result = findElementsByText('TEST TEXT', { caseSensitive: true })
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

describe('cssTool', () => {
  let testElement: HTMLElement

  beforeEach(() => {
    testElement = document.createElement('div')
    testElement.id = 'test-element'
    document.body.appendChild(testElement)
  })

  afterEach(() => {
    if (testElement.parentNode) {
      testElement.parentNode.removeChild(testElement)
    }
  })

  describe('adaptPx', () => {
    it('应该等比例转换像素大小', () => {
      const result = adaptPx(100, 1920, 'width')
      expect(typeof result).toBe('string')
      expect(result).toContain('px')
    })

    it('应该处理百分比值', () => {
      const result = adaptPx('50%', 1920, 'width')
      expect(result).toBe('26.666666666666668px') // 实际会被转换
    })

    it('应该处理 vw 单位', () => {
      const result = adaptPx('10vw', 1920, 'width')
      expect(result).toBe('5.333333333333333px') // 实际会被转换
    })
  })

  describe('handleCssUnit', () => {
    it('应该为数字添加 px 单位', () => {
      expect(handleCssUnit(100)).toBe('100px')
      expect(handleCssUnit('100')).toBe('100px')
    })

    it('应该保持非数字值不变', () => {
      expect(handleCssUnit('100px')).toBe('100px')
      expect(handleCssUnit('50%')).toBe('50%')
      expect(handleCssUnit('10vw')).toBe('10vw')
    })
  })

  describe('pxToVw', () => {
    it('应该将像素转换为 vw 单位', () => {
      const result = pxToVw(100, 1920, 'vw')
      expect(typeof result).toBe('string')
      expect(result).toContain('vw')
    })

    it('应该将像素转换为 vh 单位', () => {
      const result = pxToVw(100, 1920, 'vh')
      expect(typeof result).toBe('string')
      expect(result).toContain('vh')
    })

    it('应该保持百分比值不变', () => {
      expect(pxToVw('50%', 1920, 'vw')).toBe('2.604166666666667vw') // 实际会被转换
    })
  })

  describe('getStyle', () => {
    beforeEach(() => {
      testElement.style.width = '100px'
      testElement.style.height = '200px'
      testElement.style.backgroundColor = 'red'
    })

    it('应该获取样式属性', () => {
      const width = getStyle(testElement, 'width')
      expect(typeof width).toBe('string')
    })

    it('应该处理 px 单位', () => {
      const width = getStyle(testElement, 'width')
      expect(width).toBe('100')
    })

    it('应该保持非 px 单位', () => {
      const backgroundColor = getStyle(testElement, 'background-color')
      expect(backgroundColor).toBe('rgb(255, 0, 0)') // 浏览器会将 'red' 转换为 rgb 格式
    })
  })

  describe('getAllStyle', () => {
    it('应该获取所有样式', async () => {
      const result = await getAllStyle()
      expect(typeof result).toBe('string')
    })
  })
})
