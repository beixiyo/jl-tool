import { mimeFromExt } from './constants'
import { detectFileType } from './fileType'

/**
 * 获取资源的 MIME 类型（兼容 HTTP/HTTPS 和 Base64 DataURL）
 * @param url HTTP 地址或 Base64 DataURL
 * @returns 返回 MIME 类型（如 "image/png"），失败返回 "unknown"
 */
export async function getMimeType(url: string): Promise<MimeType> {
  /** 如果是 Base64 DataURL，直接解析 */
  if (url.startsWith('data:')) {
    try {
      const mimeMatch = url.split('data:')[1].split(';')[0].trim() as MimeType
      return mimeMatch || 'unknown'
    }
    catch (error) {
      console.warn('Failed to parse data URL:', error)
    }
  }

  /** 如果是 HTTP/HTTPS 资源 */
  try {
    /** 优先用 fetch + HEAD（节省流量） */
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
    if (response.ok) {
      const contentType = response.headers.get('Content-Type')
      if (contentType)
        return contentType.split(';')[0].trim() as MimeType // 移除 charset 等后缀
    }
  }
  catch (fetchError) {
    console.warn('Fetch HEAD failed, fallback to XHR:', fetchError)
  }

  // fetch 失败时降级到 XHR（兼容旧浏览器）
  try {
    const mime = await new Promise<string>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('HEAD', url)
      xhr.onload = () => {
        const contentType = xhr.getResponseHeader('Content-Type')
        resolve(contentType
          ? contentType.split(';')[0].trim()
          : 'unknown')
      }
      xhr.onerror = () => resolve('unknown')
      xhr.send()
    })

    if (mime === 'unknown') {
      throw new Error('unknown is inValidate, use getMimeTypeByMagicNumbers instead')
    }

    return mime as MimeType
  }
  catch (xhrError) {
    console.warn('XHR fallback failed:', xhrError)
  }

  try {
    const mime = await getMimeTypeByMagicNumbers(url)
    if (mime === 'unknown') {
      throw new Error('unknown is inValidate, next')
    }

    return mime.mimeType || 'unknown'
  }
  catch (error) {
    console.warn(error)
  }

  try {
    /** 通过扩展名推断类型 (跨域后备方案) */
    const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase()
    return mimeFromExt[extension as keyof typeof mimeFromExt] || 'unknown'
  }
  catch (error) {
    return 'unknown'
  }
}

/**
 * 通过前几个字节获取文件类型，目前仅仅支持图片、压缩包和文本文件
 */
export async function getMimeTypeByMagicNumbers(url: string) {
  try {
    const res = await fetch(url, {
      headers: { Range: 'bytes=0-24' }, // 仅下载前25字节
    })
    const buffer = await res.arrayBuffer()
    return detectFileType(buffer)
  }
  catch { }

  return 'unknown'
}

export type MimeType = MIMEType | 'unknown'
