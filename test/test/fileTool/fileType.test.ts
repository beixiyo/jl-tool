import { describe, expect, it } from 'vitest'
import { detectFileType } from '@/fileTool/fileType'

describe('detectFileType', () => {
  it('应该正确识别文本文件', async () => {
    const text = '这是一段测试文本'
    const result = await detectFileType(text)
    expect(result).toEqual({
      isText: true,
      isImage: false,
      isCompressed: false,
      mimeType: 'text/plain',
    })
  })

  it('应该正确识别Uint8Array输入的文本', async () => {
    const encoder = new TextEncoder()
    const result = await detectFileType(encoder.encode('Hello World'))
    expect(result.isText).toBe(true)
  })

  it('应该正确识别PNG图片', async () => {
    // PNG文件头
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    const result = await detectFileType(pngHeader)
    expect(result).toEqual({
      isText: false,
      isImage: true,
      isCompressed: false,
      mimeType: 'image/png',
    })
  })

  it('应该正确识别JPEG图片', async () => {
    // JPEG文件头
    const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
    const result = await detectFileType(jpegHeader)
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('应该正确处理Blob输入', async () => {
    const textBlob = new Blob(['测试文本'], { type: 'text/plain' })
    const result = await detectFileType(textBlob)

    expect(result).toEqual({
      isText: true,
      isImage: false,
      isCompressed: false,
      mimeType: 'text/plain',
    })
  })

  it('应该正确处理ArrayBuffer输入', async () => {
    const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38]).buffer // GIF头
    const result = await detectFileType(buffer)
    expect(result.mimeType).toBe('image/gif')
  })

  it('应该正确处理DataView输入', async () => {
    const buffer = new Uint8Array([0x52, 0x49, 0x46, 0x46]).buffer
    const dataView = new DataView(buffer)
    const result = await detectFileType(dataView)
    expect(result.isImage).toBe(false) // 不完整的WebP头
  })
})

describe('压缩文件检测', () => {
  it('应该识别ZIP文件', async () => {
    // ZIP文件头
    const zipHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x04])
    const result = await detectFileType(zipHeader)
    expect(result).toEqual({
      isText: false,
      isImage: false,
      isCompressed: true,
      mimeType: 'application/zip',
    })
  })

  it('应该识别RAR文件', async () => {
    // RAR5文件头
    const rarHeader = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00])
    const result = await detectFileType(rarHeader)
    expect(result.mimeType).toBe('application/x-rar-compressed')
  })

  it('应该识别7z文件', async () => {
    // 7z文件头
    const sevenZHeader = new Uint8Array([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])
    const result = await detectFileType(sevenZHeader)
    expect(result.isCompressed).toBe(true)
  })

  it('应该识别GZIP文件', async () => {
    // GZIP文件头
    const gzipHeader = new Uint8Array([0x1F, 0x8B, 0x08])
    const result = await detectFileType(gzipHeader)
    expect(result.mimeType).toBe('application/gzip')
  })

  it('应该正确处理混合类型', async () => {
    /** 前部分是ZIP头，后面是文本 */
    const mixedData = new Uint8Array([
      0x50,
      0x4B,
      0x03,
      0x04, // ZIP头
      0x48,
      0x65,
      0x6C,
      0x6C,
      0x6F, // Hello(文本)
    ])
    const result = await detectFileType(mixedData)
    expect(result.isCompressed).toBe(true) // 优先识别压缩格式
  })
})
