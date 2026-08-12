import { describe, expect, it } from 'vitest'
import { extractDOMText, HTMLToStr } from '@/domTools/domParse'

describe('extractDOMText', () => {
  describe('基本功能测试', () => {
    it('应该提取普通 HTML 的文本内容', () => {
      const html = '<div><p>Hello <strong>World</strong></p></div>'
      const result = extractDOMText(html)
      expect(result).toBe('Hello World')
    })

    it('应该处理空的 HTML 字符串', () => {
      const html = ''
      const result = extractDOMText(html)
      expect(result).toBe('')
    })

    it('应该处理只有空白字符的 HTML', () => {
      const html = '<div>   \n\t  </div>'
      const result = extractDOMText(html)
      expect(result).toBe('')
    })

    it('应该处理纯文本内容', () => {
      const html = 'Hello World'
      const result = extractDOMText(html)
      expect(result).toBe('Hello World')
    })
  })

  describe('编码 HTML 解析测试', () => {
    it('应该解析包含 \\x3C 编码的 HTML', () => {
      const html = '<div>\\x3Cspan\\x3EHello\\x3C/span\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Hello')
    })

    it('应该解析包含 \\x3E 编码的 HTML', () => {
      const html = '<div>\\x3Cstrong\\x3EWorld\\x3C/strong\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('World')
    })

    it('应该解析嵌套的编码 HTML', () => {
      const html = '<div>\\x3Cdiv\\x3E\\x3Cspan\\x3ENested\\x3C/span\\x3E\\x3C/div\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Nested')
    })

    it('应该解析多层编码的 HTML', () => {
      const html = '<div>\\x3Cdiv\\x3E\\x3Cspan\\x3E\\x3Cstrong\\x3EDeep\\x3C/strong\\x3E\\x3C/span\\x3E\\x3C/div\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Deep')
    })

    it('应该处理编码 HTML 和普通 HTML 混合的情况', () => {
      const html = '<div>Normal <span>\\x3Cstrong\\x3EBold\\x3C/strong\\x3E</span> Text</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Normal Bold Text')
    })
  })

  describe('自定义编码模式测试', () => {
    it('应该使用自定义编码模式', () => {
      const html = '<div>\\x3Cspan\\x3EHello\\x3C/span\\x3E</div>'
      const customPatterns = {
        '\\x3C': '<',
        '\\x3E': '>',
        '\\x26': '&',
      }
      const result = extractDOMText(html, customPatterns)
      expect(result).toBe('Hello')
    })
  })

  describe('复杂场景测试', () => {
    it('应该处理包含特殊字符的编码 HTML', () => {
      const html = '<div>\\x3Cspan\\x3EHello &amp; World\\x3C/span\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Hello & World')
    })

    it('应该处理包含多个编码片段的 HTML', () => {
      const html = '<div>First \\x3Cspan\\x3ESecond\\x3C/span\\x3E Third \\x3Cstrong\\x3EFourth\\x3C/strong\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('First Second Third Fourth')
    })

    it('应该处理自闭合标签的编码 HTML', () => {
      const html = '<div>\\x3Cimg src="test.jpg" /\\x3E Text</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Text')
    })
  })

  describe('边界情况测试', () => {
    it('应该处理不完整的编码 HTML', () => {
      const html = '<div>\\x3Cspan\\x3EHello</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Hello')
    })

    it('应该处理错误的编码格式', () => {
      const html = '<div>\\x3Cspan\\x3EHello\\x3C/span\\x3E\\x3C</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Hello<')
    })

    it('应该处理包含注释的编码 HTML', () => {
      const html = '<div>\\x3C!-- comment --\\x3E\\x3Cspan\\x3EHello\\x3C/span\\x3E</div>'
      const result = extractDOMText(html)
      expect(result).toBe('Hello')
    })
  })

  describe('与 HTMLToStr 的兼容性测试', () => {
    it('对于普通 HTML，结果应该与 HTMLToStr 一致', () => {
      const html = '<div><p>Hello <strong>World</strong></p></div>'
      const extractResult = extractDOMText(html)
      const htmlToStrResult = HTMLToStr(html)
      expect(extractResult).toBe(htmlToStrResult)
    })

    it('对于纯文本，结果应该与 HTMLToStr 一致', () => {
      const html = 'Hello World'
      const extractResult = extractDOMText(html)
      const htmlToStrResult = HTMLToStr(html)
      expect(extractResult).toBe(htmlToStrResult)
    })
  })

  describe('性能相关测试', () => {
    it('应该处理大量嵌套的编码 HTML', () => {
      let html = '<div>'
      for (let i = 0; i < 10; i++) {
        html += '\\x3Cdiv\\x3E'
      }
      html += 'Final Text'
      for (let i = 0; i < 10; i++) {
        html += '\\x3C/div\\x3E'
      }
      html += '</div>'

      const result = extractDOMText(html)
      expect(result).toBe('Final Text')
    })

    it('应该处理包含大量编码片段的 HTML', () => {
      let html = '<div>'
      for (let i = 0; i < 5; i++) {
        html += `Text ${i} \\x3Cspan\\x3ESpan ${i}\\x3C/span\\x3E `
      }
      html += '</div>'

      const result = extractDOMText(html)
      expect(result).toBe('Text 0 Span 0 Text 1 Span 1 Text 2 Span 2 Text 3 Span 3 Text 4 Span 4')
    })
  })
})

describe('hTMLToStr (deprecated)', () => {
  it('应该提取普通 HTML 的文本内容', () => {
    const html = '<div><p>Hello <strong>World</strong></p></div>'
    const result = HTMLToStr(html)
    expect(result).toBe('Hello World')
  })

  it('应该处理空的 HTML 字符串', () => {
    const html = ''
    const result = HTMLToStr(html)
    expect(result).toBe('')
  })

  it('应该处理纯文本内容', () => {
    const html = 'Hello World'
    const result = HTMLToStr(html)
    expect(result).toBe('Hello World')
  })
})
