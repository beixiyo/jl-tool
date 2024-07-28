import { isNode } from '@/shared'
import { isPureNum } from '@/shared/is'
import { judgeImgLoad } from './eventTools'


/** 获取浏览器内容宽度 */
export function getWinWidth() {
    return isNode
        ? 0
        : window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth
}
/** 获取浏览器内容高度 */
export function getWinHeight() {
    return isNode
        ? 0
        : window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight
}

/**
 * 将鼠标的坐标转换为在一个特定范围内的坐标
 * 
 * @example
 * ```ts
 * // 范围在 [-1, 1]
 * calcDOMCoord(e, innerWidth, innerHeight, 1, false)
 * 
 * // 范围在 [-1, 1]，y 轴反转
 * calcDOMCoord(e, innerWidth, innerHeight, 1, true)
 * 
 * // 范围在 [0, 1]
 * calcDOMCoord(e, innerWidth, innerHeight, false)
 * ```
 * 
 * @param point 鼠标的 x y 坐标
 * @param width 窗口的宽度，默认窗口宽度
 * @param height 窗口的高度，默认窗口高度
 * @param range 坐标转换的范围，默认为 1，表示范围在 `[-1, 1]`。如果传 false，则范围在 `[0, 1]`
 * @param isReverse 是否反转 y 坐标，默认 false，DOM 坐标的 y 轴和数学坐标系是相反的
 * @returns 返回一个包含 x 和 y 坐标的数组
 */
export function calcDOMCoord(
    point: Pick<MouseEvent, 'clientX' | 'clientY'>,
    width = getWinWidth(),
    height = getWinHeight(),
    range: number | false = 1,
    isReverse = false,
) {
    const { clientX, clientY } = point

    let x: number,
        y: number

    if (range === false) {
        x = clientX / width
        y = -clientY / height + 1

        if (isReverse) {
            y = clientY / height
        }
    }
    else {
        x = (clientX / width) * range * 2 - range
        y = -(clientY / height) * range * 2 + range

        if (isReverse) {
            y = (clientY / height) * range * 2 - range
        }
    }

    return [x, y] as const
}


/** 把`http`协议转换成当前站的 */
export const matchProtocol = (url: string) => {
    const proto = window.location.protocol
    return url.replace(/(http:|https:)/, proto)
}

/**
 * 根据原始设计稿宽度 等比例转换大小
 * @param px 像素大小
 * @param designSize 设计稿大小 默认`1920`
 * @param type 根据什么缩放 默认是宽度
 */
export const adaptPx = (
    px: number | string,
    designSize = 1920,
    type: 'height' | 'width' = 'width'
) => {
    if (['%', 'vw', 'vh'].includes(String(px))) {
        return px as string
    }

    px = parseFloat(String(px))
    const size = type === 'width'
        ? getWinWidth()
        : getWinHeight()

    return `${size / designSize * px}px`
}

/** 处理 `CSS` 单位，如果可以转换成数字，则添加 px */
export function handleCssUnit(value: string | number) {
    if (isPureNum(value)) {
        return value + 'px'
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
    unit: 'vw' | 'vh' = 'vw'
) {
    if (['%', 'vw', 'vh'].includes(String(px))) {
        return px
    }

    px = parseFloat(String(px))
    return (px / designSize) * 100 + unit
}

/**
 * 获取样式表属性 如果单位是 px ，则会去除单位
 * @param el 元素
 * @param attr 样式属性键值
 * @param pseudoElt 伪元素
 */
export const getStyle = (el: HTMLElement, attr: string, pseudoElt?: string) => {
    const val = window.getComputedStyle(el, pseudoElt).getPropertyValue(attr)

    if (val.endsWith('px')) {
        return parseFloat(val)
    }
    return val
}

/**
 * 节流
 * @param delay 延迟时间（ms），@default 200
 */
export function throttle<R, T, P extends any[]>(
    fn: (this: T, ...args: P) => R,
    delay = 200
) {
    let st = 0

    return function (this: T, ...args: P) {
        const now = Date.now()
        if (now - st > delay) {
            st = now
            return fn.apply(this, args) as R
        }
    }
}

/**
 * 防抖
 * @param delay 延迟时间（ms），@default 200
 */
export function debounce<R, T, P extends any[]>(
    fn: (this: T, ...args: P) => R,
    delay = 200
) {
    let id: number

    return function (this: T, ...args: P) {
        id && clearTimeout(id)
        id = window.setTimeout(() => {
            return fn.apply(this, args) as R
        }, delay)
    }
}

/** 设置 LocalStorage，无需手动转 JSON */
export function setLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value))
}
/** 获取 LocalStorage，无需手动解析 */
export function getLocalStorage<T>(key: string): T | null {
    const item = localStorage.getItem(key)
    if (item === 'undefined') {
        return null
    }

    return JSON.parse(item) as T
}

/** 获取选中的文本 */
export const getSelectedText = () => window.getSelection().toString()

/** 文本复制到剪贴板 */
export const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

/** 是否为深色模式 */
export const isDarkMode = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

/** 是否滑倒页面底部 */
export const isToBottom = () => getWinHeight() + window.scrollY >= document.documentElement.scrollHeight


/** 获取所有样式表 */
export const getAllStyle = async () => {
    const styleTxtArr = Array.from(document.querySelectorAll('style'))
        .map((item: HTMLElement) => item.outerHTML)

    const linkPromiseArr = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((item: HTMLLinkElement) => fetch(item.href).then(res => res.text()))

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
    href = location.href
) => {
    if (window.location.protocol === 'file:') return console.warn('请启动服务运行; please start server')

    const win = window.open(href, '_blank')
    const doc = win?.document
    if (!doc) return

    const _elStr = typeof el === 'string'
        ? el
        : el.outerHTML

    doc.head.innerHTML = styleStr ?? ''
    doc.body.innerHTML = _elStr
    doc.body.style.padding = '10px'

    // 定时器可以解决`window`因为开启深色模式打印的bug
    setTimeout(async () => {
        const loadDone = await judgeImgLoad(doc)

        if (!loadDone) {
            win.confirm('图片加载失败，是否继续打印') && win.print()
            return
        }

        win.print()
    })
}

/**
 * 检查并设置父元素的 `overflow: hidden`
 * @param el 当前元素
 */
export const setParentOverflow = (el: HTMLElement) => {
    const parent = el.parentNode as HTMLElement,
        overflow = window.getComputedStyle(parent).overflow

    if (overflow !== 'hidden') {
        parent.style.overflow = 'hidden'
    }
}

/** 解析出`HTML`的所有字符串 */
export const HTMLToStr = (HTMLStr: string) => {
    const p = new DOMParser()
    const doc = p.parseFromString(HTMLStr, 'text/html')
    return doc.body.textContent
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
