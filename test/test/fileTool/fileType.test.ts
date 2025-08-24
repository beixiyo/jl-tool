import { describe, expect, it } from 'vitest'
import { detectFileType, detectImgType, normalizeToUint8Array } from '@/fileTool/fileType'

describe('fileType', () => {
  describe('detectFileType', () => {
    it('应该正确识别文本文件', async () => {
      const result = await detectFileType('Hello World')
      expect(result.isText).toBe(true)
      expect(result.isImage).toBe(false)
      expect(result.isCompressed).toBe(false)
      expect(result.mimeType).toBe('text/plain')
    })

    it('应该处理字符串输入', async () => {
      const result = await detectFileType('Some text content')
      expect(result.isText).toBe(true)
      expect(result.mimeType).toBe('text/plain')
    })

    it('应该处理 Uint8Array 输入', async () => {
      const textBytes = new TextEncoder().encode('Hello World')
      const result = await detectFileType(textBytes)
      expect(result.isText).toBe(true)
      expect(result.mimeType).toBe('text/plain')
    })
  })

  describe('detectImgType', () => {
    it('应该返回 null 对于空数组', () => {
      const result = detectImgType(new Uint8Array())
      expect(result).toBeNull()
    })

    it('应该返回 null 对于短数组', () => {
      const result = detectImgType(new Uint8Array([1, 2, 3]))
      expect(result).toBeNull()
    })

    it('应该返回 null 对于非 Uint8Array', () => {
      // @ts-ignore - 测试错误输入
      const result = detectImgType([1, 2, 3, 4])
      expect(result).toBeNull()
    })
  })

  describe('normalizeToUint8Array', () => {
    it('应该处理 Uint8Array 输入', async () => {
      const input = new Uint8Array([1, 2, 3, 4])
      const result = await normalizeToUint8Array(input)
      expect(result).toEqual(input)
    })

    it('应该处理 ArrayBuffer 输入', async () => {
      const buffer = new ArrayBuffer(4)
      const result = await normalizeToUint8Array(buffer)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(4)
    })

    it('应该处理字符串输入', async () => {
      const result = await normalizeToUint8Array('Hello')
      expect(result).toEqual(new TextEncoder().encode('Hello'))
      expect(result.length).toBe(5)
    })

    it('应该抛出错误对于不支持的输入类型', async () => {
      // @ts-ignore - 测试错误输入
      await expect(normalizeToUint8Array(123)).rejects.toThrow('Unsupported input type')
    })
  })
})
