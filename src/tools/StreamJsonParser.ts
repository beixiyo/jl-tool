/**
 * 流式 JSON 解析器
 * 用于处理可能不完整的 JSON 数据流
 */
export class StreamJsonParser {
  private buffer: string = ''

  /**
   * 添加新的数据块到解析缓冲区
   * @param chunk 新接收的数据块
   * @param enableTryToRepair 是否尝试修复不完整的 JSON
   * @returns 如果数据可以被解析，返回解析后的对象；否则返回 null
   */
  append(chunk: string, enableTryToRepair = true): any | null {
    this.buffer += chunk

    try {
      /** 尝试直接解析 */
      const result = JSON.parse(this.buffer)
      /** 解析成功，清空缓冲区 */
      this.clear()
      return result
    }
    catch (error) {
      /** 解析失败，尝试修复和部分解析 */
      if (!enableTryToRepair) {
        return null
      }
      return this.tryToRepairAndParse()
    }
  }

  /**
   * 尝试修复不完整的 JSON 并解析
   * @returns 如果可以修复并解析，返回解析后的对象；否则返回 null
   */
  private tryToRepairAndParse(): any | null {
    /** 检查是否是一个可能的 JSON 对象开始 */
    if (!this.buffer.trim().startsWith('{') && !this.buffer.trim().startsWith('[')) {
      return null
    }

    try {
      /** 尝试修复并解析 JSON 对象 */
      const repaired = this.repairJson(this.buffer)
      if (repaired) {
        /** 不清空缓冲区，因为这只是一个临时修复 */
        return JSON.parse(repaired)
      }
    }
    catch (error) {
      /** 修复失败，继续等待更多数据 */
    }

    return null
  }

  /**
   * 尝试修复不完整的 JSON 字符串
   * @param json 不完整的 JSON 字符串
   * @returns 修复后的 JSON 字符串，如果无法修复则返回 null
   */
  private repairJson(json: string): string | null {
    /** 基本的括号和引号计数 */
    let braceCount = 0
    let bracketCount = 0
    let inString = false
    let escaped = false

    /** 检查每个字符 */
    for (let i = 0; i < json.length; i++) {
      const char = json[i]

      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\' && inString) {
        escaped = true
        continue
      }

      if (char === '"' && !escaped) {
        inString = !inString
        continue
      }

      if (!inString) {
        if (char === '{')
          braceCount++
        else if (char === '}')
          braceCount--
        else if (char === '[')
          bracketCount++
        else if (char === ']')
          bracketCount--
      }
    }

    /** 如果字符串未闭合，添加引号 */
    let repaired = json
    if (inString) {
      repaired += '"'
    }

    /** 闭合所有未闭合的对象 */
    while (braceCount > 0) {
      repaired += '}'
      braceCount--
    }

    /** 闭合所有未闭合的数组 */
    while (bracketCount > 0) {
      repaired += ']'
      bracketCount--
    }

    /** 检查修复后的 JSON 是否有效 */
    try {
      JSON.parse(repaired)
      return repaired
    }
    catch (error) {
      /** 如果仍然无效，返回 null */
      return null
    }
  }

  /**
   * 获取当前缓冲区内容
   * @returns 当前缓冲区的字符串
   */
  getBuffer(): string {
    return this.buffer
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = ''
  }
}
