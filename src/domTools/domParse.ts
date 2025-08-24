/**
 * @deprecated 请使用 `extractDOMText` 代替
 * 解析出 `HTML` 的所有字符串
 */
export function HTMLToStr(HTMLStr: string) {
  const p = new DOMParser()
  const doc = p.parseFromString(HTMLStr, 'text/html')
  return doc.body.textContent
}

/**
 * 递归解析 DOM 树中所有包含编码 HTML 的节点
 *
 * 这个函数的主要功能是：
 * 1. 处理包含编码 HTML 内容的 DOM 元素（如 \x3C 编码的 < 符号）
 * 2. 递归地解码所有编码内容，直到没有更多需要解析的节点
 * 3. 在启用了 CSP 和 Trusted Types 的环境中安全地工作
 * 4. 最终提取出纯文本内容
 *
 * 适用场景：
 * - Chrome 扩展的 Content Script 环境
 * - 处理 LLM 平台（如 ChatGPT、Gemini）的动态内容
 * - WebComponent 中的编码 HTML 内容
 * - 启用了严格 CSP 策略的现代网站
 *
 * @param htmlStr - 包含一个或多个内嵌编码 HTML 的 WebComponent 或元素的 HTML 字符串
 * @param encodingPatterns - 自定义编码模式映射，默认为常见的 HTML 编码，如 \x3C -> <, \x3E -> >
 * @returns 完全解析后提取出的纯文本内容
 *
 * @example
 * ```typescript
 * // 处理包含编码 HTML 的内容
 * const html = '<div>\\x3Cspan\\x3EHello\\x3C/span\\x3E</div>'
 * const result = extractTextRecursively(html)
 * console.log(result) // 输出: "Hello"
 *
 * // 处理正常 DOM（与 DOMParser.textContent 结果一致）
 * const normalHtml = '<div><p>Hello <strong>World</strong></p></div>'
 * const result2 = extractTextRecursively(normalHtml)
 * console.log(result2) // 输出: "Hello World"
 * ```
 */
export function extractDOMText(
  htmlStr: string,
  encodingPatterns: Record<string, string> = {
    '\\x3C': '<', // < 符号
    '\\x3E': '>', // > 符号
  },
): string {
  // --- 第一步：设置 Trusted Types 安全策略 ---
  /**
   * 在启用了 CSP 的环境中，直接操作 innerHTML 会被阻止
   * Trusted Types 提供了一种安全的方式来创建和插入 HTML 内容
   */
  let policy: TrustedTypePolicy | undefined

  /** 检查浏览器是否支持 Trusted Types API */
  const trustedTypesWindow = window as TrustedTypesWindow
  if (trustedTypesWindow.trustedTypes?.createPolicy) {
    try {
      /**
       * 尝试创建名为 'recursive-html-parser' 的策略
       * 如果策略已存在，会抛出错误，所以使用 try-catch 处理
       */
      policy = trustedTypesWindow.trustedTypes.createPolicy('recursive-html-parser', {
        createHTML: (input: string): string => input,
      })
    }
    catch (error) {
      /**
       * 如果创建失败（通常是因为策略已存在），则使用默认策略
       * 或者创建一个新的默认策略
       */
      policy = trustedTypesWindow.trustedTypes.defaultPolicy
        || trustedTypesWindow.trustedTypes.createPolicy('default', {
          createHTML: (s: string): string => s,
        })
    }
  }

  /**
   * 封装一个兼容函数，在支持和不支持 Trusted Types 的环境下都能工作
   *
   * @param html - 要处理的 HTML 字符串
   * @returns 受信任的 HTML 对象或原始字符串
   */
  const createTrustedHTML = (html: string): string | TrustedHTML => {
    return policy
      ? policy.createHTML(html)
      : html
  }

  // --- 第二步：初始 DOM 解析 ---
  /**
   * 使用 DOMParser 将 HTML 字符串解析为 DOM 文档对象
   * 这样可以在内存中操作 DOM 结构，而不影响实际页面
   */
  const parser = new DOMParser()
  const doc = parser.parseFromString(createTrustedHTML(htmlStr) as string, 'text/html')

  // --- 第三步：递归"解包"循环 ---
  /**
   * 这个循环会一直运行，直到 DOM 树中再也找不到需要被解析的编码内容为止
   * 每次循环都会：
   * 1. 查找包含编码内容的节点
   * 2. 解码并替换该节点的内容
   * 3. 重新开始搜索（因为替换可能产生新的需要解析的节点）
   */
  while (true) {
    let nodeToExpand: Element | null = null

    /**
     * 遍历文档中的所有元素，查找需要展开的节点
     * querySelectorAll('*') 按照深度优先遍历顺序返回元素
     */
    const allElements: NodeListOf<Element> = doc.body.querySelectorAll('*')

    for (const element of allElements) {
      /**
       * 关键的识别逻辑：
       * 1. !element.firstElementChild：元素没有子元素节点（只有文本内容）
       * 2. element.textContent.includes('\\x3C')：文本内容包含编码的 < 符号
       *
       * 这个条件确保我们只处理包含编码 HTML 的文本节点
       */
      if (!element.firstElementChild && element.textContent?.includes('\\x3C')) {
        nodeToExpand = element
        break // 找到一个就立即处理，然后重新开始搜索
      }
    }

    /**
     * 如果在整个文档中都没有找到需要展开的节点，说明处理完成，退出循环
     */
    if (!nodeToExpand) {
      break
    }

    // --- 第四步：解码并替换节点内容 ---

    // a. 获取编码的 HTML 字符串
    const encodedContent: string = nodeToExpand.textContent || ''

    // b. 解码：将 \x3C 替换为 < 符号
    let decodedHtml: string = encodedContent
    Object.entries(encodingPatterns).forEach(([k, v]) => {
      decodedHtml = decodedHtml.replace(k, v)
    })

    // c. 将解码后的 HTML 设置回该节点，浏览器会自动解析它
    /**
     * 使用 innerHTML 替换原来的文本内容
     * 这一步是关键，它把字符串变成了真正的 DOM 节点
     * 浏览器会自动解析 HTML 并创建相应的 DOM 结构
     */
    nodeToExpand.innerHTML = createTrustedHTML(decodedHtml) as string
  }

  // --- 第五步：返回最终结果 ---
  /**
   * 当循环结束后，doc.body 中所有的编码内容都已被解析成真实的 DOM
   * 现在可以安全地获取最终的纯文本内容
   *
   * textContent 会递归地获取所有子节点的文本内容，忽略 HTML 标签
   * trim() 去除首尾的空白字符
   */
  return doc.body.textContent?.trim() || ''
}

/**
 * Trusted Types 策略接口定义
 * 用于在启用了 CSP (Content Security Policy) 的环境中安全地创建 HTML
 */
interface TrustedTypePolicy {
  /**
   * 创建受信任的 HTML 字符串
   * @param input - 输入的 HTML 字符串
   * @returns 受信任的 HTML 对象
   */
  createHTML: (input: string) => TrustedHTML
}

/**
 * 受信任的 HTML 类型
 * 这是浏览器原生类型，用于表示经过安全验证的 HTML 内容
 */
interface TrustedHTML {
  toString: () => string
}

/**
 * 扩展的 Window 接口，包含 Trusted Types API
 */
interface TrustedTypesWindow extends Window {
  /**
   * Trusted Types API 对象
   */
  trustedTypes?: {
    /**
     * 创建新的 Trusted Types 策略
     * @param name - 策略名称
     * @param rules - 策略规则
     * @returns 创建的策略对象
     */
    createPolicy: (
      name: string,
      rules: { createHTML: (input: string) => string | TrustedHTML }
    ) => TrustedTypePolicy

    /**
     * 默认策略
     */
    defaultPolicy?: TrustedTypePolicy
  }
}
