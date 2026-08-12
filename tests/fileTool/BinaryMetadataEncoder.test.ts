import { describe, expect, it } from 'vitest'
import { BinaryMetadataEncoder } from '@/fileTool/BinaryMetadataEncoder'

describe('binaryMetadataEncoder 测试', () => {
  /** 基本编码解码测试 */
  it('应正确编码和解码简单元数据和二进制数据', () => {
    /** 准备测试数据 */
    const metadata = { name: 'test.png', type: 'image/png', size: 1024 }
    const binaryData = new Uint8Array([1, 2, 3, 4, 5])

    /** 编码数据 */
    const encoded = BinaryMetadataEncoder.encode(metadata, binaryData)

    /** 解码数据 */
    const decoded = BinaryMetadataEncoder.decode<typeof metadata>(encoded)

    /** 验证元数据 */
    expect(decoded.metadata).toEqual(metadata)

    /** 验证二进制数据 */
    const decodedArray = new Uint8Array(decoded.buffer)
    expect(Array.from(decodedArray)).toEqual([1, 2, 3, 4, 5])
  })

  /** 测试不同长度类型 */
  it('应支持不同的元数据长度类型', () => {
    const metadata = { test: 'value' }
    const binaryData = new Uint8Array([10, 20, 30])

    /** 测试 Uint8 */
    const encodedUint8 = BinaryMetadataEncoder.encode(metadata, binaryData, 'Uint8')
    const decodedUint8 = BinaryMetadataEncoder.decode(encodedUint8, 'Uint8')
    expect(decodedUint8.metadata).toEqual(metadata)

    /** 测试 Uint16（默认） */
    const encodedUint16 = BinaryMetadataEncoder.encode(metadata, binaryData)
    const decodedUint16 = BinaryMetadataEncoder.decode(encodedUint16)
    expect(decodedUint16.metadata).toEqual(metadata)

    /** 测试 Uint32 */
    const encodedUint32 = BinaryMetadataEncoder.encode(metadata, binaryData, 'Uint32')
    const decodedUint32 = BinaryMetadataEncoder.decode(encodedUint32, 'Uint32')
    expect(decodedUint32.metadata).toEqual(metadata)
  })

  /** 测试复杂元数据 */
  it('应正确处理复杂元数据', () => {
    const complexMetadata = {
      name: 'complex.mp4',
      size: 1024 * 1024 * 10, // 10MB
      created: new Date().toISOString(),
      tags: ['video', 'sample', 'test'],
      metadata: {
        duration: 120,
        resolution: {
          width: 1920,
          height: 1080,
        },
      },
    }

    const binaryData = new Uint8Array(100).fill(99) // 填充一些数据

    const encoded = BinaryMetadataEncoder.encode(complexMetadata, binaryData)
    const decoded = BinaryMetadataEncoder.decode<typeof complexMetadata>(encoded)

    expect(decoded.metadata).toEqual(complexMetadata)
    expect(new Uint8Array(decoded.buffer)[0]).toBe(99) // 检查二进制数据的第一个字节
  })

  /** 测试元数据长度限制 */
  it('应在元数据太大时抛出错误', () => {
    /** 创建大量数据使元数据字符串超出 Uint8 范围 */
    const largeMetadata: Record<string, string> = {}
    for (let i = 0; i < 300; i++) {
      largeMetadata[`key${i}`] = `value${i}`.repeat(10)
    }

    const binaryData = new Uint8Array([1])

    /** 使用 Uint8 应该会抛出错误 */
    expect(() => {
      BinaryMetadataEncoder.encode(largeMetadata, binaryData, 'Uint8')
    }).toThrow(/Metadata too large/)

    /** 使用 Uint16 或 Uint32 应该可以处理 */
    const encoded = BinaryMetadataEncoder.encode(largeMetadata, binaryData, 'Uint32')
    const decoded = BinaryMetadataEncoder.decode(encoded, 'Uint32')
    expect(decoded.metadata).toEqual(largeMetadata)
  })

  /** 测试 ArrayBufferView 支持 */
  it('应支持 ArrayBufferView 作为输入', () => {
    const metadata = { test: 'arraybufferview' }
    const typedArray = new Int16Array([100, 200, 300, 400])

    const encoded = BinaryMetadataEncoder.encode(metadata, typedArray)
    const decoded = BinaryMetadataEncoder.decode(encoded)

    expect(decoded.metadata).toEqual(metadata)

    const decodedArray = new Int16Array(decoded.buffer)
    expect(Array.from(decodedArray)).toEqual([100, 200, 300, 400])
  })

  /** 测试 getMaxMetaLength 方法 */
  it('getMaxMetaLength 应返回正确的最大元数据长度', () => {
    expect(BinaryMetadataEncoder.getMaxMetaLength('Uint8')).toBe(255)
    expect(BinaryMetadataEncoder.getMaxMetaLength('Uint16')).toBe(65535)
    expect(BinaryMetadataEncoder.getMaxMetaLength('Uint32')).toBe(4294967295)

    /** 测试无效类型 */
    // @ts-expect-error 测试无效类型
    expect(() => BinaryMetadataEncoder.getMaxMetaLength('Invalid')).toThrow(/Unknown type/)
  })
})
