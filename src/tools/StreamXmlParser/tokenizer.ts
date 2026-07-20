/**
 * 流式 XML 分词器
 *
 * 只在 token 完整时才产出，残缺的尾部原样留在缓冲区等待后续数据
 * 这条约束是流式解析的正确性核心：把半截标签（如 `</`）当成文本产出，
 * 或是产出后没有截断缓冲区导致下次重复累加，都是这类解析器的经典 bug
 */

import type { XmlToken } from './types'
import { ATTR_RE, TAG_NAME_RE } from './constants'

export class XmlTokenizer {
  private buffer = ''

  /**
   * 写入数据块，返回本次可以确定的完整 token
   *
   * 无法确定的尾部（不完整的标签、未闭合的注释）会留在缓冲区
   */
  push(chunk: string): XmlToken[] {
    this.buffer += chunk
    return this.drain()
  }

  /**
   * 流结束，把缓冲区残留的内容作为文本吐出
   *
   * 截断的标签宁可暴露成文本，也不静默丢弃
   */
  flush(): XmlToken[] {
    const tokens = this.drain()

    if (this.buffer) {
      tokens.push({ type: 'text', value: this.buffer })
      this.buffer = ''
    }

    return tokens
  }

  reset(): void {
    this.buffer = ''
  }

  /**
   * 扫描缓冲区，产出所有完整 token 并截断已消费的部分
   */
  private drain(): XmlToken[] {
    const tokens: XmlToken[] = []
    const buf = this.buffer
    let pos = 0

    while (pos < buf.length) {
      const lt = buf.indexOf('<', pos)

      /** 没有标签起始符，剩下全是文本 */
      if (lt === -1) {
        pushText(tokens, buf.slice(pos))
        pos = buf.length
        break
      }

      /** 标签之前的文本先产出 */
      if (lt > pos) {
        pushText(tokens, buf.slice(pos, lt))
        pos = lt
      }

      /** 注释整体跳过 */
      if (buf.startsWith('<!--', lt)) {
        const end = buf.indexOf('-->', lt + 4)
        if (end === -1)
          break

        pos = end + 3
        continue
      }

      /** CDATA 内容按纯文本处理 */
      if (buf.startsWith('<![CDATA[', lt)) {
        const end = buf.indexOf(']]>', lt + 9)
        if (end === -1)
          break

        pushText(tokens, buf.slice(lt + 9, end))
        pos = end + 3
        continue
      }

      const gt = findTagEnd(buf, lt)
      /** 标签不完整，保留到下次 */
      if (gt === -1)
        break

      const raw = buf.slice(lt + 1, gt)

      /** DOCTYPE 与处理指令跳过 */
      if (raw.startsWith('!') || raw.startsWith('?')) {
        pos = gt + 1
        continue
      }

      const token = parseTag(raw)

      /** 不像标签，例如 `1 < 2`，把尖括号当普通文本 */
      if (!token) {
        pushText(tokens, '<')
        pos = lt + 1
        continue
      }

      tokens.push(token)
      pos = gt + 1
    }

    this.buffer = buf.slice(pos)
    return tokens
  }
}

/**
 * 寻找标签的结束符，跳过引号包裹的区间
 *
 * XML 规范允许属性值里出现未转义的 `>`（只有 `<` 与 `&` 必须转义），
 * 若直接 `indexOf('>')` 会把 `<cond expr="a > b">` 截断成半个标签，
 * 属性内容随后污染文本值——这是合规输入被解错，不是容错问题
 *
 * 引号未闭合时返回 -1，缓冲区继续等待后续数据，流式语义与 `>` 未到达时一致。
 * 代价是 `<a x=">` 这类畸形会一直滞留到 `flush()` 才作为文本吐出，可以接受
 */
function findTagEnd(buf: string, from: number): number {
  let quote = ''

  for (let i = from + 1; i < buf.length; i++) {
    const ch = buf[i]

    if (quote) {
      if (ch === quote)
        quote = ''
    }
    else if (ch === '"' || ch === '\'') {
      quote = ch
    }
    else if (ch === '>') {
      return i
    }
  }

  return -1
}

/**
 * 合并相邻文本，减少下游节点的字符串拼接次数
 */
function pushText(tokens: XmlToken[], value: string): void {
  if (!value)
    return

  const last = tokens[tokens.length - 1]
  if (last?.type === 'text') {
    last.value += value
    return
  }

  tokens.push({ type: 'text', value })
}

/**
 * 解析尖括号内的原始内容，非法标签返回 null 交由调用方按文本处理
 */
function parseTag(raw: string): XmlToken | null {
  if (!raw)
    return null

  /**
   * 结束标签
   *
   * 与开始标签对称，只取首个空白之前的名字。
   * 若在这里要求整体合法，`</user name>` 会被判为文本导致标签永不闭合，
   * 后续的兄弟节点会被错误地挂到未闭合的标签下
   */
  if (raw[0] === '/') {
    const name = raw.slice(1).trim().split(/\s/)[0]
    return TAG_NAME_RE.test(name)
      ? { type: 'close', name }
      : null
  }

  const selfClosing = raw.endsWith('/')
  const body = selfClosing
    ? raw.slice(0, -1)
    : raw

  const matched = body.match(/^\s*([^\s/>]+)/)
  if (!matched)
    return null

  const name = matched[1]
  if (!TAG_NAME_RE.test(name))
    return null

  return {
    type: 'open',
    name,
    attrs: parseAttrs(body.slice(matched[0].length)),
    selfClosing,
  }
}

/**
 * 解析属性串，支持双引号 / 单引号 / 无引号 / 无值四种写法
 */
function parseAttrs(input: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (!input.trim())
    return attrs

  ATTR_RE.lastIndex = 0
  let matched: RegExpExecArray | null

  while ((matched = ATTR_RE.exec(input)) !== null) {
    attrs[matched[1]] = matched[2] ?? matched[3] ?? matched[4] ?? ''
  }

  return attrs
}
