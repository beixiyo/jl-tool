/**
 * 流式 XML 解析相关类型定义
 */

/**
 * 解析结果中的值
 *
 * - 叶子节点在开启 `simplifyTextNode` 时是字符串
 * - 含属性或子节点时是对象
 * - 被声明为数组的标签是数组
 */
export type XmlValue = string | XmlNodeObject | XmlValue[]

/**
 * 解析结果对象
 */
export interface XmlNodeObject {
  [key: string]: XmlValue
}

/**
 * 日志接收器，与 `WSLogger` 保持一致的形状
 */
export type XmlLogger = {
  warn: (message: string, context?: Record<string, unknown>) => void
}

/**
 * 流式 XML 解析器配置
 */
export type StreamXmlParserOpts = {
  /**
   * 声明哪些标签始终解析为数组
   *
   * 流式场景下无法预知某个标签后续是否会重复出现，
   * 若等到第二次出现才升级为数组，结果形状会在流中途变化，
   * 破坏增量渲染的消费方。声明后该标签从第一次出现即为数组，全程形状稳定
   *
   * @default []
   */
  arrayTags?: string[]
  /**
   * 更精细的数组判定，可根据标签所处路径决定
   *
   * 与 `arrayTags` 是或的关系，任一命中即为数组。
   * `tagStack` 是从根到父节点的祖先标签名，不含当前标签本身
   *
   * @default undefined
   */
  isArray?: (tagName: string, tagStack: string[]) => boolean
  /**
   * 是否解析标签属性，属性键会加上 `attrPrefix` 前缀
   *
   * @default false
   */
  parseAttrs?: boolean
  /**
   * 属性键前缀，用于与子节点键区分
   *
   * @default '@'
   */
  attrPrefix?: string
  /**
   * 文本内容的键名，仅在节点含属性时使用
   *
   * @default '#text'
   */
  textKey?: string
  /**
   * 叶子节点若既无属性又无子节点，是否直接简化为字符串
   *
   * 关闭后所有节点统一为对象，形状更稳定但更冗长
   *
   * @default true
   */
  simplifyTextNode?: boolean
  /**
   * 最大嵌套深度，超出的标签会被忽略，防止畸形输入撑爆内存
   *
   * @default 100
   */
  maxDepth?: number
  /**
   * 日志接收器
   *
   * 默认输出到 `console`。解析器发出的每条告警都对应着数据丢失或结构被改写，
   * 静默会让使用者在毫无察觉的情况下拿到残缺结果，
   * 因此这里不采用「库不应污染控制台」的惯例
   *
   * 同一类问题在一个实例内只提示一次，畸形输入不会刷屏。
   * 传 `null` 可完全静音
   *
   * @default console
   */
  logger?: XmlLogger | null
}

/**
 * 分词器产出的 token
 */
export type XmlToken =
  | { type: 'text', value: string }
  | { type: 'open', name: string, attrs: Record<string, string>, selfClosing: boolean }
  | { type: 'close', name: string }
