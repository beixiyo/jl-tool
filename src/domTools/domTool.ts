import { isStr } from '@/shared/is'
import { getWinHeight } from './size'

/**
 * 判断图片的 src 是否可用，可用则返回图片
 * @param imgOrUrl 图片或者图片的地址
 * @param setImg 图片加载前执行的回调函数
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

/** 获取选中的文本 */
export const getSelectedText = () => window.getSelection()?.toString()

/** 文本复制到剪贴板 */
export async function copyToClipboard(text: string) {
  try {
    const res = await navigator.clipboard.writeText(text)
    return res
  }
  catch (error) {
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
 * 是否滑倒页面底部
 * @param el 要判断的元素，默认是 `document.documentElement`
 * @param threshold 距离底部多少像素时触发，默认是 5
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
 * 使用 TreeWalker 根据文本内容查找元素对象
 * @param text - 要查找的文本内容
 * @returns 返回所有匹配的元素数组
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
 * 正则匹配移动设备 UA
 * @returns 是否为移动设备
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
