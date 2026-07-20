/**
 * 支持嵌套与数组的流式 XML 解析器
 *
 * 面向 AI 流式输出设计：容忍不完整、畸形的 XML，边收边解析
 *
 * `append` 只负责喂数据，`getResult` 才做序列化。
 * 两者分离是因为序列化是整棵树的深拷贝，在每个 chunk 上重复执行会随流增长而恶化；
 * 拆开之后调用方按需付费，要每帧渲染就每帧取，只要最终结果就只在末尾取一次
 *
 * @example
 * ```typescript
 * const parser = new StreamXmlParser({ arrayTags: ['item'] })
 *
 * parser.append('<list><item>a</item>')
 * parser.getResult() // { list: { item: ['a'] } }
 *
 * parser.append('<item>b</item></list>')
 * parser.getResult() // { list: { item: ['a', 'b'] } }
 * ```
 *
 * @example
 * ```typescript
 * // 只关心最终结果时，end 会一并返回，无需再调 getResult
 * const parser = new StreamXmlParser()
 *
 * for await (const chunk of stream) {
 *   parser.append(chunk)
 * }
 * const result = parser.end()
 * ```
 *
 * @example
 * ```typescript
 * // 声明为数组的标签即使只出现一次也是数组，形状全程稳定
 * const parser = new StreamXmlParser({ arrayTags: ['step'] })
 *
 * parser.append('<step>只有一步</step>')
 * parser.getResult() // { step: ['只有一步'] }
 * ```
 *
 * @example
 * ```typescript
 * // 同名标签处于不同路径时，用 isArray 精细区分
 * const parser = new StreamXmlParser({
 *   isArray: (tag, stack) => tag === 'item' && stack.includes('list'),
 * })
 * ```
 */

import type { StreamXmlParserOpts, XmlNodeObject, XmlToken, XmlValue } from './types'
import { DEFAULT_ATTR_PREFIX, DEFAULT_MAX_DEPTH, DEFAULT_TEXT_KEY } from './constants'
import { XmlTokenizer } from './tokenizer'

export class StreamXmlParser {
  private readonly opts: NormalizedOpts
  private readonly arrayTags: Set<string>

  private tokenizer = new XmlTokenizer()
  private root: ElementNode = createNode()
  private stack: StackFrame[] = []

  /**
   * 超出最大深度后被忽略的标签名栈
   *
   * 这里必须记名字而非计数：畸形输入缺失结束标签时，
   * 纯计数器会把外层合法的结束标签也一并吃掉，栈永远清不干净，
   * 后续内容因深度仍然超限而被整段丢弃
   */
  private overflowTags: string[] = []

  /** 已发出的告警去重键，同一类问题只提示一次，避免畸形输入刷屏 */
  private warned = new Set<string>()

  constructor(opts: StreamXmlParserOpts = {}) {
    this.opts = {
      isArray: opts.isArray,
      parseAttrs: opts.parseAttrs ?? false,
      attrPrefix: opts.attrPrefix ?? DEFAULT_ATTR_PREFIX,
      textKey: opts.textKey ?? DEFAULT_TEXT_KEY,
      simplifyTextNode: opts.simplifyTextNode ?? true,
      maxDepth: opts.maxDepth ?? DEFAULT_MAX_DEPTH,
      /** 显式传 null 才静音，未传时默认输出到 console */
      logger: opts.logger === undefined
        ? console
        : opts.logger,
    }

    this.arrayTags = new Set(opts.arrayTags ?? [])
  }

  /**
   * 写入数据块
   *
   * 只做解析，不返回结果。需要结果时调用 {@link StreamXmlParser.getResult}
   *
   * @param chunk 输入的数据块，可以是任意位置被切断的片段
   */
  append(chunk: string): void {
    this.consume(this.tokenizer.push(chunk))
  }

  /**
   * 结束解析并返回最终结果
   *
   * 把缓冲区残留内容吐出，并自动闭合所有未闭合的标签
   * 流被中途截断时用它拿到最终结果
   *
   * 与 `append` 不同，这里直接返回结果：它只会被调用一次，不存在重复序列化的开销
   */
  end(): XmlNodeObject {
    this.consume(this.tokenizer.flush())

    if (this.stack.length) {
      this.warn('end-unclosed', 'Auto-closed unclosed tags at stream end', {
        tags: this.stack.map(frame => frame.name),
      })
      this.stack.length = 0
    }

    this.overflowTags.length = 0
    return this.getResult()
  }

  /**
   * 获取当前解析结果，不触发新的解析
   *
   * 每次调用都构造全新的对象，外部修改返回值不会污染解析器内部状态。
   * 未闭合的标签也会体现在结果里，其内容随数据到达持续增长
   */
  getResult(): XmlNodeObject {
    return toPlainObject(this.root, this.opts)
  }

  /**
   * 重置解析器，回到初始状态
   */
  reset(): void {
    this.tokenizer.reset()
    this.root = createNode()
    this.stack = []
    this.overflowTags = []
    this.warned.clear()
  }

  private consume(tokens: XmlToken[]): void {
    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          this.onText(token.value)
          break
        case 'open':
          this.onOpen(token.name, token.attrs, token.selfClosing)
          break
        case 'close':
          this.onClose(token.name)
          break
      }
    }
  }

  /**
   * 根层级的裸文本直接丢弃，避免夹杂叙述文字的长流无限占用内存
   *
   * 处于溢出区时同样丢弃，否则超深子树的文本会泄漏到最后一个有效的祖先节点上
   */
  private onText(value: string): void {
    if (this.overflowTags.length)
      return

    const current = this.stack[this.stack.length - 1]
    if (current)
      current.node.text += value
  }

  private onOpen(name: string, attrs: Record<string, string>, selfClosing: boolean): void {
    /** 已经处于溢出区，或本次将要超出深度限制 */
    if (this.overflowTags.length || this.stack.length >= this.opts.maxDepth) {
      if (!selfClosing)
        this.overflowTags.push(name)

      this.warn('max-depth', 'Max depth exceeded, tag ignored', {
        tag: name,
        maxDepth: this.opts.maxDepth,
      })
      return
    }

    const parent = this.stack[this.stack.length - 1]?.node ?? this.root
    const node = createNode()

    if (this.opts.parseAttrs)
      node.attrs = attrs

    const tagStack = this.stack.map(frame => frame.name)

    if (this.arrayTags.has(name) || this.opts.isArray?.(name, tagStack)) {
      const slot = parent.children[name]

      if (Array.isArray(slot))
        slot.push(node)
      else
        parent.children[name] = [node]
    }
    else {
      /**
       * 未声明为数组的标签重复出现时会静默覆盖，前一份数据就此丢失
       * 这正是 arrayTags 要防的情况，而忘记声明的人恰恰最需要提示，
       * 因此这里主动告警并指出解决办法
       */
      if (parent.children[name] !== undefined) {
        const path = [...tagStack, name].join('/')

        this.warn(
          `duplicate:${path}`,
          'Duplicate tag overwrote the previous one, declare it in arrayTags to keep every occurrence',
          { tag: name, path },
        )
      }

      parent.children[name] = node
    }

    if (!selfClosing)
      this.stack.push({ name, node })
  }

  /**
   * 结束标签的容错处理
   *
   * 向下寻找匹配的开始标签，顺带闭合中间遗漏的层级；
   * 完全找不到匹配则忽略这个游离的结束标签
   */
  private onClose(name: string): void {
    if (this.overflowTags.length) {
      const idx = this.overflowTags.lastIndexOf(name)

      /** 属于溢出区的标签，连同它内部未闭合的层级一起丢弃 */
      if (idx !== -1) {
        this.overflowTags.length = idx
        return
      }

      /**
       * 名字不在溢出栈里，说明这是外层正常标签的结束符
       * 溢出区内剩下的标签都是未闭合的，就此作废，然后走正常闭合逻辑
       */
      this.overflowTags.length = 0
    }

    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].name !== name)
        continue

      const unclosed = this.stack.length - 1 - i
      if (unclosed > 0) {
        this.warn(`auto-close:${name}`, 'Auto-closed unclosed tags', {
          tag: name,
          count: unclosed,
        })
      }

      this.stack.length = i
      return
    }

    this.warn(`unmatched:${name}`, 'Unmatched closing tag ignored', { tag: name })
  }

  /**
   * 发出告警，同一个 key 在一个实例内只提示一次
   *
   * 畸形输入可能反复触发同类问题（尤其是超深度），不去重会淹没控制台
   */
  private warn(key: string, message: string, context?: Record<string, unknown>): void {
    if (!this.opts.logger || this.warned.has(key))
      return

    this.warned.add(key)
    this.opts.logger.warn(message, context)
  }
}

/**
 * 把内部节点转换为对外的结果对象
 */
function toPlainObject(node: ElementNode, opts: NormalizedOpts): XmlNodeObject {
  const out: XmlNodeObject = {}

  for (const key of Object.keys(node.children)) {
    const slot = node.children[key]

    out[key] = Array.isArray(slot)
      ? slot.map(child => toPlainValue(child, opts))
      : toPlainValue(slot, opts)
  }

  return out
}

function toPlainValue(node: ElementNode, opts: NormalizedOpts): XmlValue {
  const childKeys = Object.keys(node.children)
  const attrKeys = opts.parseAttrs
    ? Object.keys(node.attrs)
    : []

  /** 纯文本叶子节点直接塌缩成字符串 */
  if (opts.simplifyTextNode && !childKeys.length && !attrKeys.length)
    return node.text

  const out: XmlNodeObject = {}

  for (const key of attrKeys) {
    out[opts.attrPrefix + key] = node.attrs[key]
  }

  /** 含子节点时丢弃裸文本，混合内容只保留结构 */
  if (!childKeys.length)
    out[opts.textKey] = node.text

  for (const key of childKeys) {
    const slot = node.children[key]

    out[key] = Array.isArray(slot)
      ? slot.map(child => toPlainValue(child, opts))
      : toPlainValue(slot, opts)
  }

  return out
}

function createNode(): ElementNode {
  return {
    attrs: {},
    text: '',
    children: {},
  }
}

/**
 * 内部节点，children 用普通对象保存以保留插入顺序
 */
type ElementNode = {
  attrs: Record<string, string>
  text: string
  children: Record<string, ElementNode | ElementNode[]>
}

type StackFrame = {
  name: string
  node: ElementNode
}

type NormalizedOpts = Required<Omit<StreamXmlParserOpts, 'arrayTags' | 'isArray' | 'logger'>>
  & Pick<StreamXmlParserOpts, 'isArray' | 'logger'>
