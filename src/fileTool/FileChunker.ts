import { numFixed } from '../tools/tools'

/**
 * 文件分块处理器
 * @example
 * // 基本用法
 * const chunker = new FileChunker(file, { chunkSize: 1024 * 1024 })
 * const blob = chunker.next()
 * const done = chunker.done
 * const progress = chunker.progress
 *
 * @example
 * // 从指定偏移量开始
 * const chunker = new FileChunker(file, {
 *   chunkSize: 1024 * 1024,
 *   startOffset: 512 * 1024 // 从512KB处开始
 * })
 */
export class FileChunker {
  private offset: number = 0

  /**
   * 创建文件分块处理器
   * @param file 要分块的文件或Blob对象
   * @param options 配置选项
   * @param options.chunkSize 每个分块的大小(字节)
   * @param options.startOffset 起始偏移量(字节)，默认为0
   */
  constructor(
    private file: File | Blob,
    private options: {
      chunkSize: number
      startOffset?: number
    },
  ) {
    /** 初始化偏移量，确保不超过文件大小 */
    this.offset = Math.min(options.startOffset || 0, file.size)
  }

  /**
   * 获取下一块分片
   * @returns {Blob} 文件分片数据
   */
  next(): Blob {
    const end = Math.min(this.offset + this.options.chunkSize, this.file.size)
    const blob = this.file.slice(this.offset, end)
    this.offset = end
    return blob
  }

  /**
   * 是否已完成所有分块读取
   * @returns {boolean} 如果已读取完所有分块返回true，否则返回false
   */
  get done(): boolean {
    return this.offset >= this.file.size
  }

  /**
   * 获取当前读取进度(0-1之间的小数)
   * @returns {number} 当前进度(0-1)
   */
  get progress(): number {
    return numFixed(this.offset / this.file.size)
  }

  /**
   * 获取当前偏移量
   * @returns {number} 当前偏移量(字节)
   */
  get currentOffset(): number {
    return this.offset
  }
}
