/**
 * 单层 XML 流式解析器
 *
 * 支持实时解析不完整的 XML 标签，输出 JSON 格式，适用于 AI 输出解析。
 * 该解析器专门设计用于处理流式数据，能够逐步解析 XML 内容，无需等待完整的 XML 文档。
 *
 * @example
 * ```typescript
 * const parser = new StreamSingleXmlParser()
 *
 * // 模拟流式数据输入
 * const xmlChunks = [
 *   '<name>John',
 *   ' Doe</name><age>25</age><email',
 *   '>'
 * ]
 *
 * // 逐步解析数据块
 * for (const chunk of xmlChunks) {
 *   const result = parser.append(chunk)
 *   console.warn('当前解析结果:', result)
 * }
 *
 * // 最终结果: { name: 'John Doe', age: '25', email: '' }
 * ```
 *
 * @example
 * ```typescript
 * const parser = new StreamSingleXmlParser()
 *
 * // 模拟 AI 流式输出
 * const aiResponse = '<response>正在处理您的请求...</response><>processing'
 *
 * // 实时解析并更新 UI
 * const result = parser.append(aiResponse)
 * updateUI(result) // { response: '正在处理您的请求...', status: 'processing' }
 * ```
 *
 * @example
 * ```typescript
 * // 重置解析器状态
 * const parser = new StreamSingleXmlParser()
 *
 * parser.append('<name>Alice</name>')
 * console.warn(parser.getResult()) // { name: 'Alice' }
 *
 * parser.reset()
 * console.warn(parser.getResult()) // {}
 * ```
 */
export class StreamSingleXmlParser {
  private buffer: string = ''
  private result: Record<string, string> = {}
  private currentTag: string | null = null
  private isInsideContent: boolean = false
  private contentBuffer: string = ''

  /**
   * 处理输入的数据块
   *
   * 将新的数据块添加到解析器中，并尝试解析其中的 XML 标签。
   * 该方法支持增量解析，可以处理不完整的 XML 标签。
   *
   * @param chunk - 输入的数据块，可以是完整的 XML 标签或不完整的片段
   * @returns 当前已解析完成的标签及其内容的键值对对象
   *
   * @example
   * ```typescript
   * const parser = new StreamSingleXmlParser()
   *
   * // 输入不完整的数据
   * let result = parser.append('<name>John')
   * console.warn(result) // { "name": "John" } (标签未完成)
   *
   * // 继续输入数据
   * result = parser.append(' Doe</name>')
   * console.warn(result) // { "name": "John Doe" }
   * ```
   */
  append(chunk: string): Record<string, string> {
    this.buffer += chunk
    this.parseBuffer()

    return { ...this.result }
  }

  /**
   * 获取当前解析结果
   *
   * 返回当前已解析完成的所有标签及其内容的副本。
   * 该方法不会触发新的解析过程，只是返回当前状态。
   *
   * @returns 当前已解析完成的标签及其内容的键值对对象副本
   */
  getResult(): Record<string, string> {
    return { ...this.result }
  }

  /**
   * 重置解析器状态
   *
   * 清空所有内部状态，包括缓冲区、解析结果和当前解析状态。
   * 调用此方法后，解析器将回到初始状态，可以重新开始解析新的 XML 数据
   */
  reset(): void {
    this.buffer = ''
    this.result = {}
    this.currentTag = null
    this.isInsideContent = false
    this.contentBuffer = ''
  }

  /**
   * 解析缓冲区内容
   *
   * 内部方法，用于解析缓冲区中的 XML 内容。
   * 该方法会逐步处理缓冲区中的标签，支持不完整标签的增量解析。
   *
   * @private
   */
  private parseBuffer(): void {
    let i = 0
    while (i < this.buffer.length) {
      if (!this.isInsideContent) {
        /** 寻找开始标签 */
        const tagStart = this.buffer.indexOf('<', i)
        if (tagStart === -1) {
          /** 没有找到标签，可能是纯文本内容 */
          if (this.isInsideContent && this.currentTag) {
            const text = this.buffer.substring(i)
            this.contentBuffer += text
            /** 设置当前内容 */
            this.result[this.currentTag] = this.contentBuffer
          }
          break
        }

        const tagEnd = this.buffer.indexOf('>', tagStart)
        if (tagEnd === -1) {
          /**
           * 标签不完整，等待更多数据
           * 如果有未完成的标签，设置当前内容
           */
          if (this.currentTag && this.contentBuffer) {
            this.result[this.currentTag] = this.contentBuffer
          }
          break
        }

        const tagContent = this.buffer.substring(tagStart + 1, tagEnd)

        /** 检查是否是自闭合标签 */
        if (tagContent.endsWith('/')) {
          const tagName = tagContent.slice(0, -1)
          if (tagName) {
            this.result[tagName] = ''
            console.warn(`✅ 自闭合标签完成: ${tagName}`)
          }
          this.buffer = this.buffer.substring(tagEnd + 1)
          i = 0
          continue
        }

        /** 检查是否是结束标签 */
        if (tagContent.startsWith('/')) {
          const endTag = tagContent.substring(1)
          if (this.currentTag === endTag) {
            /** 找到匹配的结束标签 */
            this.result[this.currentTag] = this.contentBuffer
            console.warn(`✅ 标签完成: ${this.currentTag} = "${this.contentBuffer}"`)
            this.currentTag = null
            this.isInsideContent = false
            this.contentBuffer = ''
            this.buffer = this.buffer.substring(tagEnd + 1)
            i = 0
            continue
          }
        }
        else {
          /** 开始标签 */
          this.currentTag = tagContent
          this.isInsideContent = true
          this.contentBuffer = ''
          console.warn(`🏷️  标签开始: ${this.currentTag}`)
          this.buffer = this.buffer.substring(tagEnd + 1)
          i = 0
          continue
        }
      }
      else {
        /** 在内容中，寻找结束标签或自闭合标签 */
        const tagStart = this.buffer.indexOf('<', i)
        if (tagStart === -1) {
          /** 没有找到标签，所有内容都是文本 */
          const text = this.buffer.substring(i)
          this.contentBuffer += text
          console.warn(`📝 内容更新: "${text}" (累计: "${this.contentBuffer}")`)
          this.buffer = ''
          break
        }

        /** 检查是否是结束标签 */
        if (this.buffer[tagStart + 1] === '/') {
          const tagEnd = this.buffer.indexOf('>', tagStart)
          if (tagEnd === -1) {
            /** 结束标签不完整，等待更多数据 */
            const text = this.buffer.substring(i, tagStart)
            this.contentBuffer += text
            console.warn(`📝 内容更新: "${text}" (累计: "${this.contentBuffer}")`)
            break
          }

          const endTag = this.buffer.substring(tagStart + 2, tagEnd)
          if (this.currentTag === endTag) {
            /** 找到匹配的结束标签 */
            const text = this.buffer.substring(i, tagStart)
            this.contentBuffer += text

            this.result[this.currentTag] = this.contentBuffer
            console.warn(`✅ 标签完成: ${this.currentTag} = "${this.contentBuffer}"`)
            this.currentTag = null
            this.isInsideContent = false
            this.contentBuffer = ''
            this.buffer = this.buffer.substring(tagEnd + 1)
            i = 0
            continue
          }
        }

        /** 检查是否是自闭合标签 */
        const tagEnd = this.buffer.indexOf('>', tagStart)
        if (tagEnd !== -1) {
          const tagContent = this.buffer.substring(tagStart + 1, tagEnd)
          if (tagContent.endsWith('/')) {
            const tagName = tagContent.slice(0, -1)
            if (tagName === this.currentTag) {
              /** 找到匹配的自闭合标签 */
              const text = this.buffer.substring(i, tagStart)
              this.contentBuffer += text

              this.result[this.currentTag] = this.contentBuffer
              console.warn(`✅ 自闭合标签完成: ${this.currentTag} = "${this.contentBuffer}"`)
              this.currentTag = null
              this.isInsideContent = false
              this.contentBuffer = ''
              this.buffer = this.buffer.substring(tagEnd + 1)
              i = 0
              continue
            }
          }
        }
        else {
          /** 标签不完整，等待更多数据 */
          const text = this.buffer.substring(i, tagStart)
          this.contentBuffer += text
          console.warn(`📝 内容更新: "${text}" (累计: "${this.contentBuffer}")`)
          break
        }

        i++
      }
    }

    /** 如果有未完成的标签，设置当前内容 */
    if (this.currentTag) {
      this.result[this.currentTag] = this.contentBuffer
    }
  }
}
