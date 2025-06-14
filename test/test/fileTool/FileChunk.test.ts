import { describe, expect, it } from 'vitest'
import { FileChunker } from '@/fileTool'

/** 模拟一个 File/Blob 对象 */
function createMockFile(size: number): File {
  const blob = new Blob([new ArrayBuffer(size)], { type: 'application/octet-stream' })
  return new File([blob], 'testfile.bin')
}

describe('fileChunker', () => {
  const fileSize = 100 // 小文件方便测试
  const mockFile = createMockFile(fileSize)

  it('应该从起始位置开始分块', () => {
    const startOffset = 10
    const chunker = new FileChunker(mockFile, {
      chunkSize: 20,
      startOffset,
    })

    expect(chunker.currentOffset).toBe(startOffset)
  })

  it('应该正确处理分块', () => {
    const chunkSize = 45
    const chunker = new FileChunker(mockFile, { chunkSize })

    /** 第一次分块 */
    const chunk1 = chunker.next()
    expect(chunk1.size).toBe(chunkSize)
    expect(chunker.currentOffset).toBe(chunkSize)
    expect(chunker.progress).toBe(0.45) // 45/100

    /** 第二次分块 */
    const chunk2 = chunker.next()
    expect(chunk2.size).toBe(chunkSize)
    expect(chunker.currentOffset).toBe(chunkSize * 2)
    expect(chunker.progress).toBe(0.9) // 90/100

    /** 第三次分块 (不足一个完整块) */
    const chunk3 = chunker.next()
    expect(chunk3.size).toBe(10) // 100 - 90 = 10
    expect(chunker.currentOffset).toBe(fileSize)
    expect(chunker.progress).toBe(1) // 100/100
    expect(chunker.done).toBe(true)

    /** 已完成后再调用next应该返回空Blob */
    const chunk4 = chunker.next()
    expect(chunk4.size).toBe(0)
  })

  it('应该正确处理起始偏移量', () => {
    const startOffset = 80
    const chunkSize = 20
    const chunker = new FileChunker(mockFile, {
      chunkSize,
      startOffset,
    })

    /** 第一次分块 */
    const chunk1 = chunker.next()
    expect(chunk1.size).toBe(chunkSize)
    expect(chunker.currentOffset).toBe(startOffset + chunkSize) // 100
    expect(chunker.progress).toBe(1) // 100/100

    const chunk2 = chunker.next()
    expect(chunk2.size).toBe(0)
    expect(chunker.currentOffset).toBe(fileSize)
    expect(chunker.done).toBe(true)
  })

  it('起始偏移量超过文件大小时应该自动调整', () => {
    const chunker = new FileChunker(mockFile, {
      chunkSize: 10,
      startOffset: fileSize + 100, // 超过文件大小
    })

    expect(chunker.currentOffset).toBe(fileSize)
    expect(chunker.done).toBe(true)
  })

  it('进度应该正确计算', () => {
    const chunker = new FileChunker(mockFile, { chunkSize: 25 })

    chunker.next() // 25
    expect(chunker.progress).toBe(0.25)

    chunker.next() // 50
    expect(chunker.progress).toBe(0.5)

    chunker.next() // 75
    expect(chunker.progress).toBe(0.75)

    chunker.next() // 100
    expect(chunker.progress).toBe(1)
  })
})
