/* eslint-disable no-sparse-arrays */

/** 图片魔数检测表 */
export const IMAGE_SIGNATURES: Record<ImageType, any[]> = {
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, , , , , 0x57, 0x45, 0x42, 0x50],
  ],
  'image/bmp': [[0x42, 0x4D]],
  'image/tiff': [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]],
}

/** 压缩包魔数检测表 */
export const COMPRESSION_SIGNATURES: Record<CompressedType, any[]> = {
  'application/zip': [
    [0x50, 0x4B, 0x03, 0x04], // 标准ZIP
    [0x50, 0x4B, 0x05, 0x06], // 空文档ZIP
    [0x50, 0x4B, 0x07, 0x08], // 分卷ZIP
  ],
  'application/x-rar-compressed': [
    [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00], // RAR4
    [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00], // RAR5
  ],
  'application/x-7z-compressed': [
    [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
  ],
  'application/x-tar': [
    [0x75, 0x73, 0x74, 0x61, 0x72], // ustar
  ],
  'application/gzip': [
    [0x1F, 0x8B, 0x08],
  ],
}

/**
 * 检测文件类型，目前仅仅支持图片、压缩包和文本文件
 */
export async function detectFileType(input: InputType): Promise<FileTypeResult> {
  /** 如果是字符串直接返回文本类型 */
  if (typeof input === 'string') {
    return {
      isText: true,
      isImage: false,
      isCompressed: false,
      mimeType: 'text/plain',
    }
  }

  /**
   * 统一转换为Uint8Array进行处理
   * 检测顺序：图片 > 压缩包 > 文本
   */
  const uint8Array = await normalizeToUint8Array(input)

  /** 首先检查常见图片文件的魔数(Magic Number) */
  const imageType = detectImgType(uint8Array)
  if (imageType) {
    return {
      isText: false,
      isImage: true,
      isCompressed: false,
      mimeType: imageType,
    }
  }

  const compressionType = detectCompressionType(uint8Array)
  if (compressionType) {
    return {
      isText: false,
      isImage: false,
      isCompressed: true,
      mimeType: compressionType,
    }
  }

  /** 检查是否为文本文件 */
  const isText = isLikelyText(uint8Array)

  return {
    isText,
    isImage: false,
    isCompressed: false,
    mimeType: isText
      ? 'text/plain'
      : null,
  }
}

/**
 * 将各种输入类型统一转换为Uint8Array
 */
export async function normalizeToUint8Array(input: InputType): Promise<Uint8Array> {
  if (input instanceof Uint8Array) {
    return input
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  }

  if (typeof input === 'string') {
    /** 如果是字符串，直接检查是否为文本 */
    return new TextEncoder().encode(input)
  }

  if (input instanceof Blob) {
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      /**
       * FileReader 兼容旧版 Node
       */
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(input)
    })
    return new Uint8Array(arrayBuffer)
  }

  throw new Error(`Unsupported input type: ${typeof input}`)
}

/**
 * 检测图片类型
 */
export function detectImgType(uint8Array: Uint8Array): ImageType | null {
  if (!(uint8Array instanceof Uint8Array) || uint8Array.length < 4) {
    return null
  }

  for (const [mimeType, signatures] of Object.entries(IMAGE_SIGNATURES)) {
    for (const signature of signatures) {
      let match = true
      for (let i = 0; i < signature.length; i++) {
        if (signature[i] !== undefined && uint8Array[i] !== signature[i]) {
          match = false
          break
        }
      }
      if (match)
        return mimeType as ImageType
    }
  }
  return null
}

/**
 * 检测压缩包类型
 */
export function detectCompressionType(uint8Array: Uint8Array): CompressedType | null {
  for (const [mimeType, signatures] of Object.entries(COMPRESSION_SIGNATURES)) {
    for (const signature of signatures) {
      if (uint8Array.length < signature.length)
        continue

      let match = true
      for (let i = 0; i < signature.length; i++) {
        if (uint8Array[i] !== signature[i]) {
          match = false
          break
        }
      }

      if (match)
        return mimeType as CompressedType
    }
  }
  return null
}

/**
 * 数据是否是文本
 */
export function isLikelyText(data: Uint8Array | string) {
  if (typeof data === 'string')
    return true

  if (!(data instanceof Uint8Array)) {
    throw new TypeError('Expected Uint8Array or string')
  }

  /** 检查UTF BOM */
  if (data.length >= 2) {
    // UTF-16 BE/LE
    if (data[0] === 0xFE && data[1] === 0xFF)
      return true // UTF-16 BE
    if (data[0] === 0xFF && data[1] === 0xFE)
      return true // UTF-16 LE

    // UTF-8 BOM
    if (data.length >= 3
      && data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) {
      return true
    }
  }

  const sampleSize = Math.min(512, data.length)
  let textChars = 0
  let totalChecked = 0

  for (let i = 0; i < sampleSize; i++) {
    const byte = data[i]

    // ASCII可打印字符
    if (byte >= 0x20 && byte <= 0x7E) {
      textChars++
      totalChecked++
      continue
    }

    /** 常见控制字符 */
    if (byte === 0x09 || byte === 0x0A || byte === 0x0D) {
      textChars++
      totalChecked++
      continue
    }

    // UTF-8多字节序列
    if (byte >= 0xC2 && byte <= 0xF4) {
      const seqLength = byte < 0xE0
        ? 2
        : byte < 0xF0
          ? 3
          : 4
      let valid = true

      for (let j = 1; j < seqLength && i + j < sampleSize; j++) {
        if ((data[i + j] & 0xC0) !== 0x80) {
          valid = false
          break
        }
      }

      if (valid) {
        textChars += seqLength
        i += seqLength - 1
        totalChecked += seqLength
        continue
      }
    }

    /** 其他情况认为是非文本 */
    totalChecked++
  }

  if (totalChecked < Math.min(32, data.length)) {
    return false
  }

  /** 允许少量非文本字符（如二进制文本混合格式） */
  return textChars / totalChecked > 0.85
}

export type FileTypeResult = {
  isText: boolean
  isImage: boolean
  mimeType: ImageType | CompressedType | 'text/plain' | null
  isCompressed: boolean
}

export type InputType = Blob | Uint8Array | ArrayBuffer | string | DataView

export type ImageType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'image/bmp'
  | 'image/tiff'

export type CompressedType =
  | 'application/zip'
  | 'application/x-rar-compressed'
  | 'application/x-7z-compressed'
  | 'application/x-tar'
  | 'application/gzip'
