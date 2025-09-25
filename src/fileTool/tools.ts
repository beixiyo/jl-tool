import { getUrlContentLen, isValidUrl, matchProtocol } from '../tools/urlTools'

/**
 * 用 `Blob` 下载
 * @param data 数据
 * @param fileName 文件名
 * @param opts 下载选项
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // 基础用法
 * const textData = 'Hello, World!'
 * downloadByData(textData, 'hello.txt')
 *
 * const jsonData = JSON.stringify({ name: 'John', age: 30 })
 * downloadByData(jsonData, 'data.json', { mimeType: 'application/json' })
 * ```
 *
 * @example
 * ```ts
 * // 下载二进制数据
 * const buffer = new ArrayBuffer(8)
 * downloadByData(buffer, 'data.bin')
 *
 * // 下载 Blob 数据
 * const blob = new Blob(['Binary data'], { type: 'application/octet-stream' })
 * downloadByData(blob, 'file.bin')
 * ```
 */
export function downloadByData(
  data: Blob | ArrayBuffer | string,
  fileName = 'download',
  opts?: DownloadOptions,
) {
  let blob: Blob
  if (data instanceof Blob) {
    blob = data
  }
  else if (data instanceof ArrayBuffer) {
    blob = new Blob([data])
  }
  else if (typeof data === 'string') {
    blob = new Blob([data], { type: opts?.mimeType ?? 'text/plain' })
  }
  else {
    throw new TypeError('不支持的数据类型，仅支持 Blob, ArrayBuffer, 或 string')
  }

  return downloadByUrl(URL.createObjectURL(blob), fileName, {
    needClearObjectURL: true,
    ...opts,
  })
}

/**
 * 用 url 下载
 * @param url 链接
 * @param fileName 文件名
 * @param options 下载选项
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // 基础用法
 * await downloadByUrl('https://example.com/file.pdf', 'document.pdf')
 * await downloadByUrl('https://example.com/image.jpg', 'photo.jpg')
 * ```
 *
 * @example
 * ```ts
 * // 带选项的下载
 * await downloadByUrl('http://example.com/file.txt', 'data.txt', {
 *   matchProto: true, // 匹配当前协议
 *   needClearObjectURL: true // 自动清理对象URL
 * })
 * ```
 */
export async function downloadByUrl(
  url: string,
  fileName = 'download',
  options?: Omit<DownloadOptions, 'mimeType'>,
) {
  const {
    matchProto = false,
    needClearObjectURL = false,
  } = options || {}

  if (matchProto) {
    url = matchProtocol(url)
  }

  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', fileName)

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  if (needClearObjectURL) {
    /** 解决移动端无法下载问题 */
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 500)
  }
}

/**
 * Blob 转 Base64
 * @param blob Blob 对象
 * @returns Promise<string> Base64 字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
 * const base64 = await blobToBase64(blob)
 * console.log(base64) // data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==
 * ```
 *
 * @example
 * ```ts
 * // 处理图片文件
 * const fileInput = document.querySelector('input[type="file"]')
 * fileInput.addEventListener('change', async (e) => {
 *   const file = e.target.files[0]
 *   if (file) {
 *     const base64 = await blobToBase64(file)
 *     console.log('图片Base64:', base64)
 *   }
 * })
 * ```
 */
export function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader()

    fr.onload = function () {
      resolve(this.result as string)
    }
    fr.onerror = function (error) {
      reject(error)
    }
    fr.readAsDataURL(blob)
  })
}

/**
 * Base64 转 Blob
 * @param base64Str base64 字符串
 * @param mimeType 文件类型，默认 application/octet-stream
 * @returns Blob 对象
 *
 * @example
 * ```ts
 * // 基础用法
 * const base64 = 'SGVsbG8sIFdvcmxkIQ==' // "Hello, World!" 的 Base64
 * const blob = base64ToBlob(base64, 'text/plain')
 * console.log(blob) // Blob 对象
 * ```
 *
 * @example
 * ```ts
 * // 处理图片 Base64
 * const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
 * const blob = base64ToBlob(imageBase64, 'image/png')
 *
 * // 创建下载链接
 * const url = URL.createObjectURL(blob)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'image.png'
 * a.click()
 * ```
 */
export function base64ToBlob(
  base64Str: string,
  mimeType: string = 'application/octet-stream',
): Blob {
  /** 移除可能存在的 Data URL scheme */
  const base64Data = base64Str.includes(',')
    ? base64Str.split(',')[1]
    : base64Str

  /** 将Base64解码为二进制数据 */
  let byteCharacters
  try {
    byteCharacters = atob(base64Data) // atob 可能会因非 Base64 字符失败
  }
  catch (e) {
    console.error('Failed to decode base64 string:', e)
    throw new Error('Invalid base64 string for atob.')
  }

  /** 计算二进制数据的长度 */
  const byteArrays = new Uint8Array(byteCharacters.length)

  /** 将字符转换为字节并放入 Uint8Array */
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays[i] = byteCharacters.charCodeAt(i)
  }

  return new Blob([byteArrays], { type: mimeType })
}

/**
 * HTTP(S) URL 转 Blob
 * @param url 资源链接
 * @returns Promise<Blob> Blob 对象
 *
 * @example
 * ```ts
 * // 基础用法
 * const blob = await urlToBlob('https://example.com/image.jpg')
 * console.log(blob.type) // 'image/jpeg'
 * console.log(blob.size) // 文件大小
 * ```
 *
 * @example
 * ```ts
 * // 下载并处理文件
 * try {
 *   const blob = await urlToBlob('https://example.com/data.json')
 *   const text = await blob.text()
 *   const data = JSON.parse(text)
 *   console.log(data)
 * } catch (error) {
 *   console.error('下载失败:', error)
 * }
 * ```
 */
export async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`)
  }
  return response.blob()
}

/**
 * 检查文件大小是否超过限制
 * @param files 文件数据或 URL，可以是单个文件或数组
 * @param maxSize 最大大小（字节），默认 100MB，即 1024 * 1024 * 100
 * @returns 返回文件总大小
 *
 * @example
 * ```ts
 * // 基础用法
 * const files = [file1, file2, file3]
 * try {
 *   const totalSize = await checkFileSize(files, 50 * 1024 * 1024) // 50MB
 *   console.log(`文件总大小: ${totalSize} 字节`)
 * } catch (error) {
 *   console.error('文件过大:', error.message)
 * }
 * ```
 *
 * @example
 * ```ts
 * // 检查单个文件
 * const file = new Blob(['content'], { type: 'text/plain' })
 * const size = await checkFileSize(file, 1024) // 1KB 限制
 * console.log(`文件大小: ${size} 字节`)
 * ```
 *
 * @example
 * ```ts
 * // 检查 URL 文件
 * const urls = ['https://example.com/file1.pdf', 'https://example.com/file2.pdf']
 * const totalSize = await checkFileSize(urls, 10 * 1024 * 1024) // 10MB
 * ```
 */
export async function checkFileSize(
  files: (Blob | ArrayBuffer | string)[] | (Blob | ArrayBuffer | string),
  maxSize = 1024 * 1024 * 100,
) {
  const fileArray = Array.isArray(files)
    ? files
    : [files]
  let totalSize = 0

  for (const file of fileArray) {
    let size: number

    if (file instanceof Blob) {
      size = file.size
    }
    else if (file instanceof ArrayBuffer) {
      size = file.byteLength
    }
    else if (typeof file === 'string') {
      const isUrl = isValidUrl(file)
      if (isUrl) {
        size = await getUrlContentLen(file)
      }
      else {
        size = file.length
      }
    }
    else {
      throw new TypeError('不支持的文件类型')
    }

    totalSize += size

    /** 每次累加后立即检查是否超出限制 */
    if (totalSize > maxSize) {
      throw new Error(`文件总大小超过限制：${(totalSize / 1024 / 1024).toFixed(2)}MB，最大允许${(maxSize / 1024 / 1024).toFixed(2)}MB`)
    }
  }

  return totalSize
}

/**
 * 从文件路径/URL中提取文件名和后缀
 * @param path 文件路径或URL
 * @param decode 是否解码文件名和后缀，默认 false
 *
 * @example
 * - getFilenameAndExt('C:\Documents\file.doc') => {"name":"file","ext":"doc"}
 * - getFilenameAndExt('https://site.com/app.js#version=1.0') => {"name":"app","ext":"js"}
 * - getFilenameAndExt('README') => {"name":"README","ext":""}
 * - getFilenameAndExt('/home/user/.env') => {"name":"","ext":"env"}
 * - getFilenameAndExt('.gitignore') => {"name":"","ext":"gitignore"}
 * - getFilenameAndExt('my file@home.json') => {"name":"my file@home","ext":"json"}
 * - getFilenameAndExt('https://site.com/测试%20文件.测试', true) => {"name":"测试 文件","ext":"测试"}
 */
export function getFilenameAndExt(
  path: string,
  decode = false,
): { name: string, ext: string } {
  const normalizedPath = path.replace(/\\/g, '/')

  const decodeRes = (name: string, ext: string) => decode
    ? {
        name: decodeURIComponent(name),
        ext: decodeURIComponent(ext),
      }
    : {
        name,
        ext,
      }

  /** 处理URL情况（如 https://example.com/file.txt） */
  let filename: string
  try {
    const url = new URL(normalizedPath)
    filename = url.pathname.split('/').pop() || ''
  }
  catch {
    /** 非URL，当作普通路径处理（如 /path/to/file.txt） */
    filename = normalizedPath.split('/').pop() || '' // 兼容Windows和Linux路径分隔符
  }

  /** 分离文件名和后缀 */
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return decodeRes(filename, '')
  }

  return decodeRes(
    filename.slice(0, lastDotIndex),
    filename.slice(lastDotIndex + 1).toLowerCase(),
  )
}

const textDecoderMap: Record<string, TextDecoder> = {}

function getTextDecoder(encode = 'utf-8') {
  /** 尝试从缓存获取 */
  let textDecoder = textDecoderMap[encode]

  /** 如果缓存中没有，则创建新的并存入缓存 */
  if (!textDecoder) {
    try {
      textDecoder = new TextDecoder(encode)
      textDecoderMap[encode] = textDecoder // 仅在新建时存入缓存
    }
    catch (error) {
      console.error(`创建 TextDecoder 时出错，编码 "${encode}" 可能不受支持:`, error)
      throw new Error(`不支持的编码或创建解码器失败: ${encode}`)
    }
  }

  return textDecoder
}

/**
 * 二进制数据 ArrayBuffer 转字符串
 * @param buffer 要转换的数据
 * @param encode 目标字符串的编码格式，默认 'utf-8'
 * @returns 返回解码后的字符串
 */
export function dataToStr(
  buffer: AllowSharedBufferSource,
  encode = 'utf-8',
  options?: TextDecodeOptions,
): string {
  try {
    const textDecoder = getTextDecoder(encode) // 获取解码器，这里可能抛出错误
    return textDecoder.decode(buffer, options)
  }
  catch (error) {
    console.error(`dataToStr 执行失败 (编码: ${encode}):`, error)
    throw error
  }
}

interface DownloadOptions {
  /**
   * 是否匹配协议，比如把 http 匹配为当前站的协议
   * @default false
   */
  matchProto?: boolean
  /**
   * 是否自动清除通过 `URL.createObjectURL` 创建的链接 (仅对 blob: URL 有效)
   */
  needClearObjectURL?: boolean
  /**
   * 文件类型，仅对 blob: URL 有效
   * @default 'text/plain'
   */
  mimeType?: string
}
