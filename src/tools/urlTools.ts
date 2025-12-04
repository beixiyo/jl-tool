import { isBrowser } from '@/constants/tool'

/**
 * 把 `http` 协议转换成当前站点的协议
 * @param url 要转换的 URL
 * @param baseProtocol 基础协议，如果不提供则根据环境自动选择
 * @returns 转换后的 URL
 * @example
 * // 浏览器环境：当前站点是 HTTPS
 * matchProtocol('http://example.com/file.css')
 * // 返回: 'https://example.com/file.css'
 *
 * // Node.js 环境：默认使用 HTTPS
 * matchProtocol('http://example.com/file.css')
 * // 返回: 'https://example.com/file.css'
 *
 * // 指定协议
 * matchProtocol('http://example.com/file.css', 'http:')
 * // 返回: 'http://example.com/file.css'
 */
export function matchProtocol(url: string, baseProtocol?: string) {
  if (baseProtocol) {
    return url.replace(/(http:|https:)/, baseProtocol)
  }

  /** 浏览器环境，使用 window.location.protocol */
  if (isBrowser && window.location.protocol) {
    return url.replace(/(http:|https:)/, window.location.protocol)
  }

  /** 其他环境默认使用 https */
  return url.replace(/(http:|https:)/, 'https:')
}

/**
 * 检测链接是否合法
 * @param url 要检测的 URL 字符串
 * @returns URL 是否合法
 * @example
 * isValidUrl('https://example.com')
 * // 返回: true
 *
 * isValidUrl('invalid-url')
 * // 返回: false
 *
 * isValidUrl('http://example.com:8080/path')
 * // 返回: true
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * 获取 content-length
 * @param url 要获取内容长度的 URL
 * @returns 内容长度（字节数）
 * @throws {Error} 当 URL 无效或获取失败时抛出错误
 * @example
 * const url = 'https://example.com/file.zip'
 * await getUrlContentLen(url)
 * // 返回: 1024 (假设文件大小为 1024 字节)
 */
export async function getUrlContentLen(url: string): Promise<number> {
  if (!isValidUrl(url)) {
    throw new Error(`无效的URL: ${url}`)
  }

  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentLength = response.headers.get('content-length')

    if (!contentLength) {
      throw new Error('服务器未返回content-length')
    }

    const size = Number(contentLength)
    if (Number.isNaN(size)) {
      throw new TypeError('无效的文件大小')
    }

    return size
  }
  catch (err) {
    throw new Error(`获取URL文件大小失败: ${err instanceof Error
      ? err.message
      : '未知错误'}`)
  }
}

/**
 * 解析URL的查询参数为对象
 * @param url URL字符串
 * @param baseUrl 基础URL，用于解析相对URL
 * - 浏览器环境：默认使用当前页面URL
 * - Node.js环境：默认使用 http://localhost
 * @returns 查询参数对象
 * @example
 * const url = 'https://example.com:8080/path/to/resource?name=John&age=30'
 * getUrlQuery(url)
 * // 返回: { name: 'John', age: '30' }
 *
 * // 无查询参数的情况
 * getUrlQuery('https://example.com')
 * // 返回: {}
 *
 * // 编码参数的情况
 * const encodedUrl = 'https://example.com?msg=hello%20world&tag=%23test'
 * getUrlQuery(encodedUrl)
 * // 返回: { msg: 'hello world', tag: '#test' }
 */
export function getUrlQuery(url: string, baseUrl?: string): Record<string, string> {
  const query: Record<string, string> = {}
  let queryString = ''

  const base = baseUrl || (isBrowser
    ? window.location.href
    : 'http://localhost')
  const urlObj = new URL(url, base)
  queryString = urlObj.search.substring(1)

  if (queryString) {
    queryString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=')
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || '')
      }
    })
  }

  return query
}

/**
 * 解析URL的路径部分为数组
 * @param url URL字符串
 * @param baseUrl 基础URL，用于解析相对URL
 * - 浏览器环境：默认使用当前页面URL
 * - Node.js环境：默认使用 http://localhost
 * @returns 路径部分数组
 * @example
 * const url = 'https://example.com:8080/path/to/resource?name=John&age=30'
 * getUrlPaths(url)
 * // 返回: ['path', 'to', 'resource']
 *
 * // 根路径的情况
 * getUrlPaths('https://example.com')
 * // 返回: []
 *
 * // 多层路径的情况
 * getUrlPaths('https://example.com/a/b/c/d/e')
 * // 返回: ['a', 'b', 'c', 'd', 'e']
 */
export function getUrlPaths(url: string, baseUrl?: string): string[] {
  let pathname = ''

  const base = baseUrl || (isBrowser
    ? window.location.href
    : 'http://localhost')
  const urlObj = new URL(url, base)
  pathname = urlObj.pathname

  return pathname.split('/').filter(segment => segment !== '')
}

/**
 * 获取URL的主机名
 * @param url URL字符串
 * @param baseUrl 基础URL，用于解析相对URL
 * - 浏览器环境：默认使用当前页面URL
 * - Node.js环境：默认使用 http://localhost
 * @returns 主机名
 * @example
 * const url = 'https://example.com:8080/path/to/resource?name=John&age=30'
 * getHostname(url)
 * // 返回: 'example.com'
 *
 * // 子域名的情况
 * getHostname('https://sub.example.com')
 * // 返回: 'sub.example.com'
 *
 * // 多级子域名的情况
 * getHostname('https://api.v2.example.com')
 * // 返回: 'api.v2.example.com'
 */
export function getHostname(url: string, baseUrl?: string): string {
  const base = baseUrl || (isBrowser
    ? window.location.href
    : 'http://localhost')
  const urlObj = new URL(url, base)
  return urlObj.hostname
}

/**
 * 获取URL的协议
 * @param url URL字符串
 * @param baseUrl 基础URL，用于解析相对URL
 * - 浏览器环境：默认使用当前页面URL
 * - Node.js环境：默认使用 http://localhost
 * @returns 协议 (不带冒号)
 * @example
 * const url = 'https://example.com:8080/path/to/resource?name=John&age=30'
 * getProtocol(url)
 * // 返回: 'https'
 *
 * // HTTP 协议的情况
 * getProtocol('http://example.com')
 * // 返回: 'http'
 *
 * // FTP 协议的情况
 * getProtocol('ftp://example.com')
 * // 返回: 'ftp'
 */
export function getProtocol(url: string, baseUrl?: string): string {
  const base = baseUrl || (isBrowser
    ? window.location.href
    : 'http://localhost')
  const urlObj = new URL(url, base)
  return urlObj.protocol.replace(':', '')
}

/**
 * 获取URL的端口
 * @param url URL字符串
 * @param baseUrl 基础URL，用于解析相对URL
 * - 浏览器环境：默认使用当前页面URL
 * - Node.js环境：默认使用 http://localhost
 * @returns 端口 (如果没有明确指定则返回空字符串)
 * @example
 * const url = 'https://example.com:8080/path/to/resource?name=John&age=30'
 * getPort(url)
 * // 返回: '8080'
 *
 * // 默认端口的情况 (HTTPS)
 * getPort('https://example.com')
 * // 返回: ''
 *
 * // 自定义端口的情况 (HTTP)
 * getPort('http://example.com:9527')
 * // 返回: '9527'
 *
 * // 常用端口的情况
 * getPort('http://example.com:80')
 * // 返回: '80'
 */
export function getPort(url: string, baseUrl?: string): string {
  const base = baseUrl || (isBrowser
    ? window.location.href
    : 'http://localhost')
  const urlObj = new URL(url, base)
  return urlObj.port
}
