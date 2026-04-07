import { isStr } from '@/shared/is'
import { getWinHeight } from './size'

/**
 * 预加载图片：根据 URL 或已有 `HTMLImageElement` 判断是否加载成功
 * @param imgOrUrl 图片 URL 字符串，或已设置 `src` 的 `Image` 元素
 * @param setImg 在检测/加载前对元素做额外设置（如 `crossOrigin`）
 * @returns 成功返回该 `HTMLImageElement`，失败返回 `false`
 *
 * @example
 * ```ts
 * const img = await getImg('https://example.com/a.png', (el) => { el.crossOrigin = 'anonymous' })
 * if (img) document.body.append(img)
 * ```
 */
export function getImg(imgOrUrl: string | HTMLImageElement, setImg?: (img: HTMLImageElement) => void) {
  let img = imgOrUrl as HTMLImageElement
  if (isStr(imgOrUrl)) {
    img = new Image()
    img.src = imgOrUrl
  }
  setImg?.(img)

  return new Promise<false | HTMLImageElement>((resolve) => {
    if (img.complete && img.naturalWidth !== 0) {
      resolve(img)
    }

    img.onload = () => resolve(img)
    img.onerror = () => resolve(false)
  })
}

/**
 * 返回当前文档选区文本；无选区或未选中时多为 `undefined` / 空字符串
 * @returns 选中文本，可能为 `undefined`
 *
 * @example
 * ```ts
 * const text = getSelectedText()
 * if (text) await copyToClipboard(text)
 * ```
 */
export const getSelectedText = () => window.getSelection()?.toString()

/**
 * 将字符串写入系统剪贴板：优先 `navigator.clipboard`，失败时用隐藏 `textarea` + `execCommand('copy')`
 * @param text 要复制的纯文本
 * @returns `writeText` 的返回值；降级路径无明确返回值（失败时可能在控制台输出错误）
 *
 * @example
 * ```ts
 * await copyToClipboard('Hello')
 * ```
 */
export async function copyToClipboard(text: string) {
  try {
    const res = await navigator.clipboard.writeText(text)
    return res
  }
  catch {
    return fallback()
  }

  function fallback() {
    const textarea = document.createElement('textarea')
    textarea.value = text

    Object.assign(textarea.style, {
      transform: 'translate(-9999px, -9999px)',
      position: 'absolute',
      top: 0,
      left: 0,
    })

    document.body.appendChild(textarea)
    textarea.select()

    try {
      const successful = document.execCommand('copy')
      if (!successful) {
        console.error('复制失败')
      }
    }
    catch (err) {
      console.error('复制错误:', err)
    }
    finally {
      document.body.removeChild(textarea)
    }
  }
}

/**
 * 是否已滚动到容器底部（窗口或带滚动条的元素）
 * @param el 滚动容器；默认 `document.documentElement`（整页滚动）
 * @param threshold 距底部小于等于该像素值即视为到底，默认 `5`
 * @returns 已到底为 `true`
 *
 * @example
 * ```ts
 * window.addEventListener('scroll', () => {
 *   if (isToBottom()) loadMore()
 * })
 * ```
 */
export function isToBottom(el: HTMLElement = document.documentElement || document.body, threshold = 5): boolean {
  if ([document.documentElement, document.body].includes(el)) {
    const scrollY = window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop
    return getWinHeight() + scrollY + threshold >= document.documentElement.scrollHeight
  }

  const { scrollTop, scrollHeight, clientHeight } = el
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight

  return distanceFromBottom <= threshold
}

/**
 * 在 DOM 子树中按**元素 `textContent` 全量文本**精确匹配查找（非模糊搜索）
 * @param text 目标文本（会先 `trim`；空字符串直接返回 `[]`）
 * @param options 查找范围与匹配选项
 * @param options.multiple 是否收集全部匹配，默认只取第一个
 * @param options.caseSensitive 是否区分大小写，默认不区分
 * @param options.parentEl 搜索根节点，默认 `document.body`
 * @returns 匹配到的元素列表
 *
 * @example
 * ```ts
 * const [btn] = findElementsByText('提交', { parentEl: document.getElementById('form')! })
 * const all = findElementsByText('Item', { multiple: true, caseSensitive: true })
 * ```
 */
export function findElementsByText(
  text: string,
  options: FindByTextOptions = {},
): Element[] {
  const {
    multiple = false,
    caseSensitive = false,
    parentEl = document.body,
  } = options

  /** 空文本直接返回 */
  if (text.trim().length === 0)
    return []

  /** 创建文本匹配器 */
  const targetText = caseSensitive
    ? text
    : text.toLowerCase()
  const results: Element[] = []

  /** 递归遍历 DOM 树 */
  const walker = document.createTreeWalker(
    parentEl,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        /** 跳过不可见元素 */
        if ((node as Element).clientHeight === 0
          && (node as Element).clientWidth === 0) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    },
  )

  /** 遍历所有可见元素 */
  while (walker.nextNode()) {
    const element = walker.currentNode as Element

    /** 获取处理后的文本内容 */
    const elementText = caseSensitive
      ? element.textContent?.trim()
      : element.textContent?.toLowerCase().trim()

    /** 精确匹配逻辑 */
    if (elementText === targetText) {
      results.push(element)
      if (!multiple)
        break // 找到第一个匹配项时提前退出
    }
  }

  return results
}

/**
 * 根据 `navigator.userAgent` 粗略判断是否为常见移动浏览器（仅启发式，非能力检测）
 * @returns UA 命中常见移动模式时为 `true`
 *
 * @example
 * ```ts
 * if (isMobile()) import('./mobile-ui')
 * ```
 */
export function isMobile() {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(navigator.userAgent)
}

interface FindByTextOptions {
  /**
   * 是否查找多个匹配项
   * @default false
   */
  multiple?: boolean
  /**
   * 是否区分大小写
   * @default false
   */
  caseSensitive?: boolean
  /**
   * 父级元素
   * @default document.body
   */
  parentEl?: Element
}
