import { describe, it, expect } from 'vitest'
import {
  getUrlQuery,
  getUrlPaths,
  getHostname,
  getProtocol,
  getPort,
} from '@/tools/urlTools'

describe('URL工具函数', () => {
  const testUrl = 'https://example.com:8080/path/to/resource?name=John&age=30'

  it('获取查询参数', () => {
    const params = getUrlQuery(testUrl)
    expect(params).toEqual({
      name: 'John',
      age: '30',
    })

    // 测试空查询参数
    expect(getUrlQuery('https://example.com')).toEqual({})
  })

  it('获取路径部分', () => {
    const segments = getUrlPaths(testUrl)
    expect(segments).toEqual(['path', 'to', 'resource'])

    // 测试根路径
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

  // 测试相对URL（仅在浏览器环境有效）
  if (typeof window !== 'undefined') {
    it('浏览器环境 - 处理相对URL', () => {
      window.history.pushState({}, '', '/current?test=1')
      expect(getUrlQuery('?new=2')).toEqual({ new: '2' })
      expect(getUrlPaths('new/path')).toEqual(['new', 'path'])
    })
  }
})