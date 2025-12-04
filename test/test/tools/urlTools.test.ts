import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  getHostname,
  getPort,
  getProtocol,
  getUrlPaths,
  getUrlQuery,
  matchProtocol,
  isValidUrl,
  getUrlContentLen,
} from '@/tools/urlTools'
import { isNode, isBrowser } from '@/constants/tool'

describe('uRL工具函数', () => {
  const testUrl = 'https://example.com:8080/path/to/resource?name=John&age=30'

  it('获取查询参数', () => {
    const params = getUrlQuery(testUrl)
    expect(params).toEqual({
      name: 'John',
      age: '30',
    })

    /** 测试空查询参数 */
    expect(getUrlQuery('https://example.com')).toEqual({})
  })

  it('获取路径部分', () => {
    const segments = getUrlPaths(testUrl)
    expect(segments).toEqual(['path', 'to', 'resource'])

    /** 测试根路径 */
    expect(getUrlPaths('https://example.com')).toEqual([])
  })

  it('获取主机名', () => {
    expect(getHostname(testUrl)).toBe('example.com')
    expect(getHostname('https://sub.example.com')).toBe('sub.example.com')
  })

  it('获取协议', () => {
    expect(getProtocol(testUrl)).toBe('https')
    expect(getProtocol('http://example.com')).toBe('http')
  })

  it('获取端口', () => {
    expect(getPort('https://example.com')).toBe('')
    expect(getPort('http://example.com:9527')).toBe('9527')
  })

  /** 测试相对URL（仅在浏览器环境有效） */
  if (typeof window !== 'undefined') {
    it('浏览器环境 - 处理相对URL', () => {
      window.history.pushState({}, '', '/current?test=1')
      expect(getUrlQuery('?new=2')).toEqual({ new: '2' })
      expect(getUrlPaths('new/path')).toEqual(['new', 'path'])
    })
  }

  /** Node.js 环境测试 */
  if (isNode) {
    it('Node.js 环境 - 处理相对URL', () => {
      // Node.js 环境下，没有提供 baseUrl 时使用默认值
      expect(getUrlQuery('?test=value', 'http://localhost/base')).toEqual({ test: 'value' })
      expect(getUrlPaths('path/to/resource', 'http://localhost')).toEqual(['path', 'to', 'resource'])
      expect(getHostname('sub.example.com', 'http://localhost')).toBe('sub.example.com')
      expect(getProtocol('https://example.com', 'http://localhost')).toBe('https')
      expect(getPort('http://example.com:8080', 'http://localhost')).toBe('8080')
    })

    it('Node.js 环境 - matchProtocol 默认使用 HTTPS', () => {
      // Node.js 环境下，没有提供 baseProtocol 时默认使用 https
      expect(matchProtocol('http://example.com')).toBe('https://example.com')
      expect(matchProtocol('https://example.com')).toBe('https://example.com')
      
      // 指定协议的情况
      expect(matchProtocol('http://example.com', 'http:')).toBe('http://example.com')
      expect(matchProtocol('https://example.com', 'http:')).toBe('http://example.com')
    })
  }

  it('协议转换', () => {
    // 测试指定协议的情况（不受环境影响）
    expect(matchProtocol('http://example.com', 'https:')).toBe('https://example.com')
    expect(matchProtocol('https://example.com', 'http:')).toBe('http://example.com')

    // Node.js 环境下，没有提供 baseProtocol 时默认使用 https
    expect(matchProtocol('http://example.com')).toBe('https://example.com')
    expect(matchProtocol('https://example.com')).toBe('https://example.com')
  })

  it('URL有效性检测', () => {
    // 有效的URL
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('https://example.com:8080')).toBe(true)
    expect(isValidUrl('https://example.com/path')).toBe(true)
    expect(isValidUrl('https://example.com?query=value')).toBe(true)
    expect(isValidUrl('ftp://example.com')).toBe(true)

    // 无效的URL
    expect(isValidUrl('invalid-url')).toBe(false)
    expect(isValidUrl('just-text')).toBe(false)
    expect(isValidUrl('')).toBe(false)
    expect(isValidUrl('://example.com')).toBe(false)
    expect(isValidUrl('https://')).toBe(false)
  })

  it('获取URL内容长度', async () => {
    // 测试有效的URL（需要mock fetch）
    const mockResponse = {
      headers: new Map([['content-length', '1024']]),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const contentLength = await getUrlContentLen('https://example.com/file.zip')
    expect(contentLength).toBe(1024)

    // 测试服务器未返回content-length
    const mockResponseNoLength = {
      headers: new Map([]),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponseNoLength)

    await expect(getUrlContentLen('https://example.com/file.zip')).rejects.toThrow('服务器未返回content-length')

    // 测试无效的URL
    await expect(getUrlContentLen('invalid-url')).rejects.toThrow('无效的URL')

    // 恢复原始fetch（清理mock）
    vi.restoreAllMocks()
  })
})
