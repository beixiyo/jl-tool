/**
 * 检测链接是否合法
 */
export function isValidUrl(url: string): boolean {
  try {
    createURL(url)
    return true
  }
  catch {
    return false
  }
}

/**
 * 获取 content-length
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
 * @returns 查询参数对象
 */
export function getUrlQuery(url: string): Record<string, string> {
  const query: Record<string, string> = {}
  let queryString = ''

  const urlObj = createURL(url, window.location.href)
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
 * @returns 路径部分数组
 */
export function getUrlPaths(url: string): string[] {
  let pathname = ''

  const urlObj = createURL(url, window.location.href)
  pathname = urlObj.pathname

  return pathname.split('/').filter(segment => segment !== '')
}

/**
 * 获取URL的主机名
 * @param url URL字符串
 * @returns 主机名
 */
export function getHostname(url: string): string {
  const urlObj = createURL(url, window.location.href)
  return urlObj.hostname
}

/**
 * 获取URL的协议
 * @param url URL字符串
 * @returns 协议 (不带冒号)
 */
export function getProtocol(url: string): string {
  const urlObj = createURL(url, window.location.href)
  return urlObj.protocol.replace(':', '')
}

/**
 * 获取URL的端口
 * @param url URL字符串
 * @returns 端口 (如果没有明确指定则返回空字符串)
 */
export function getPort(url: string): string {
  const urlObj = createURL(url, window.location.href)
  return urlObj.port
}

/**
 * 创建URL对象（跨环境兼容）
 */
export function createURL(url: string, base?: string): URL {
  /** 优先使用全局URL（浏览器和现代Node.js都支持） */
  if (typeof URL !== 'undefined') {
    return new URL(url, base)
  }
  /** 兼容旧版Node.js */
  if (typeof require !== 'undefined') {
    // eslint-disable-next-line ts/no-require-imports
    const { URL } = require('node:url')
    return new URL(url, base)
  }
  throw new Error('URL is not supported in this environment')
}
