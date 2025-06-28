import { isNode } from '@/shared'
import { isPureNum, isStr } from '@/shared/is'
import { judgeImgLoad } from './eventTools'

/** 获取浏览器内容宽度 */
export function getWinWidth() {
  return isNode
    ? 0
    : window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth
}
/** 获取浏览器内容高度 */
export function getWinHeight() {
  return isNode
    ? 0
    : window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight
}

/** 把 `http` 协议转换成当前协议 */
export function matchProtocol(url: string) {
  const proto = window.location.protocol
  return url.replace(/(http:|https:)/, proto)
}

/**
 * 根据原始设计稿宽度 等比例转换大小
 * @param px 像素大小
 * @param designSize 设计稿大小 默认`1920`
 * @param type 根据什么缩放 默认是宽度
 */
export function adaptPx(px: number | string, designSize = 1920, type: 'height' | 'width' = 'width') {
  if (['%', 'vw', 'vh'].includes(String(px))) {
    return px as string
  }

  px = Number.parseFloat(String(px))
  const size = type === 'width'
    ? getWinWidth()
    : getWinHeight()

  return `${size / designSize * px}px`
}

/** 处理 `CSS` 单位，如果可以转换成数字，则添加 px */
export function handleCssUnit(value: string | number) {
  if (isPureNum(value)) {
    return `${value}px`
  }
  return value
}

/**
 * 将像素值转换为`vw`或`vh`单位，如果传入百分比值，则直接返回
 * @param px - 要转换的像素值或百分比值
 * @param designSize 设计稿大小 默认为1920像素
 * @param unit 尺寸单位 默认为`vw`
 * @returns 转换后的值 带有指定单位
 */
export function pxToVw(
  px: number | string,
  designSize = 1920,
  unit: 'vw' | 'vh' = 'vw',
) {
  if (['%', 'vw', 'vh'].includes(String(px))) {
    return px
  }

  px = Number.parseFloat(String(px))
  return (px / designSize) * 100 + unit
}

/**
 * 获取样式表属性 如果单位是 px ，则会去除单位
 * @param el 元素
 * @param attr 样式属性键值
 * @param pseudoElt 伪元素
 */
export function getStyle(el: HTMLElement, attr: string, pseudoElt?: string) {
  const val = window.getComputedStyle(el, pseudoElt).getPropertyValue(attr)

  if (val.endsWith('px')) {
    return Number.parseFloat(val)
  }
  return val
}

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

/**
 * 节流
 * @param delay 延迟时间（ms）
 */
export function throttle<P extends any[]>(
  fn: (...args: P) => any,
  delay = 80,
  options: ThrottleOpts = {},
) {
  let st = 0
  let timer: number | null = null
  const { makeSureNotToMissTask = true } = options

  /**
   * 确保不会因为节流而丢失最后一个任务
   */
  function runMissTask(fn: Function) {
    if (!makeSureNotToMissTask)
      return

    clear()
    timer = window.setTimeout(() => {
      fn()
    }, delay)
  }

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return function (this: any, ...args: P) {
    clear()
    const now = Date.now()

    if (now - st > delay) {
      st = now
      return fn.apply(this, args)
    }
    else {
      runMissTask(() => fn.apply(this, args))
    }
  }
}

/**
 * 防抖
 * @param delay 延迟时间（ms），@default 200
 */
export function debounce<P extends any[]>(
  fn: (...args: P) => any,
  delay = 200,
) {
  let id: number

  return function (this: any, ...args: P) {
    id && clearTimeout(id)
    id = window.setTimeout(() => {
      return fn.apply(this, args)
    }, delay)
  }
}

/**
 * 用 requestAnimationFrame 节流，只有一帧内执行完毕，才会继续执行
 * @param fn 可以是异步函数
 */
export function rafThrottle<P extends any[]>(
  fn: (...args: P) => any,
) {
  let lock = false

  return function (this: any, ...args: P) {
    if (lock)
      return
    lock = true

    window.requestAnimationFrame(async () => {
      await fn.apply(this, args)
      lock = false
    })
  }
}

/**
 * 设置 LocalStorage，默认自动转 JSON
 * @param autoToJSON 是否自动 JSON.stringify
 * @param storage 存储对象，默认 localStorage
 */
export function setLocalStorage(
  key: string,
  value: any,
  autoToJSON = true,
  storage: Storage = localStorage,
) {
  return storage.setItem(
    key,
    autoToJSON
      ? JSON.stringify(value)
      : value,
  )
}
/**
 * 获取 LocalStorage，默认自动解析 JSON
 * ### 'undefined' 字符串会被转成 null
 * @param autoParseJSON 是否自动 JSON.parse，默认 true
 * @param storage 存储对象，默认 localStorage
 */
export function getLocalStorage<T>(
  key: string,
  autoParseJSON = true,
  storage: Storage = localStorage,
): T | null {
  const item = storage.getItem(key)
  if (item === 'undefined') {
    return null
  }

  return autoParseJSON
    // @ts-ignore
    ? JSON.parse(item) as T
    : (item as T)
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

/** 获取所有样式表 */
export async function getAllStyle() {
  const styleTxtArr = Array.from(document.querySelectorAll('style'))
    .map((item: HTMLElement) => item.outerHTML)

  const linkPromiseArr = (Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[])
    .map(item => fetch(item.href).then(res => res.text()))

  try {
    const linkArr = await Promise.all(linkPromiseArr)
    const linkToStyleArr = linkArr.map(i => `<style>${i}</style>`)

    return styleTxtArr.concat(linkToStyleArr).join('')
  }
  catch (error) {
    console.error(`getAllStyle：数据加载失败，${error}`)
  }
}

/**
 * 打印 必须启动一个服务器才能用; **建议使用事件交互，如按钮点击，否则可能打开多个窗口**
 * @param el 要打印的元素
 * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
 * @param href 打开的链接 默认使用`location.href`
 */
export const print: Print = (
  el: string | HTMLElement,
  styleStr: string | undefined,
  href = location.href,
) => {
  if (window.location.protocol === 'file:')
    return console.warn('请启动服务运行; please start server')

  const win = window.open(href, '_blank')
  const doc = win?.document
  if (!doc)
    return

  const _elStr = typeof el === 'string'
    ? el
    : el.outerHTML

  doc.head.innerHTML = styleStr ?? ''
  doc.body.innerHTML = _elStr
  doc.body.style.padding = '10px'

  /** 定时器可以解决`window`因为开启深色模式打印的bug */
  setTimeout(async () => {
    const loadDone = await judgeImgLoad(doc)

    if (!loadDone) {
      win.confirm('图片加载失败，是否继续打印') && win.print()
      return
    }

    win.print()
  })
}

/** 解析出 `HTML` 的所有字符串 */
export function HTMLToStr(HTMLStr: string) {
  const p = new DOMParser()
  const doc = p.parseFromString(HTMLStr, 'text/html')
  return doc.body.textContent
}

/**
 * 根据文本内容查找元素对象
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

interface Print {
  /**
   * 打印 必须启动一个服务器才能用; ***建议使用事件交互，如按钮点击，否则可能打开多个窗口***
   * @param el 要打印的元素
   * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
   * @param href 打开的链接 默认使用`location.href`
   */
  (el: HTMLElement, styleStr: string | undefined, href?: string): void
  /**
   * 打印 必须启动一个服务器才能用; ***建议使用事件交互，如按钮点击，否则可能打开多个窗口***
   * @param elStr 要打印的元素字符串
   * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
   * @param href 打开的链接 默认使用`location.href`
   */
  (elStr: string, styleStr: string | undefined, href?: string): void
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

type ThrottleOpts = {
  /**
   * 确保不会因为节流而丢失最后一个任务
   * @default true
   */
  makeSureNotToMissTask?: boolean
}
