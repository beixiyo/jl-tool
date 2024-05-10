import { isNode } from '@/shared'
import { isPureNum } from '@/shared/is'
import { KeyCode } from '@/types'


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

/** 把`http`协议转换成当前站的 */
export const matchProtocol = (url: string) => {
    const proto = window.location.protocol
    return url.replace(/(http:|https:)/, proto)
}

/**
 * 用 `Blob` 下载
 * @param data 数据
 * @param filename 文件名
 */
export const downloadByData = (data: Blob, filename: string) => {
    const a = document.createElement("a")

    a.href = URL.createObjectURL(data)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
}

/**
 * 用链接下载
 * @param url 链接
 * @param fileName 文件名
 * @param matchProto 是否匹配协议，比如把 http 匹配为当前站的协议。默认 false
 */
export const downloadByUrl = async (url: string, fileName: string, matchProto = false) => {
    if (matchProto) {
        url = matchProtocol(url)
    }
    const a = document.createElement('a')
    const blob = await fetch(url).then(res => res.blob())

    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
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

/** 处理`CSS`单位 */
export function handleCssUnit(value: string | number) {
    if (isPureNum(value)) {
        return value + 'px'
    }
    return value
}

/**
 * 将像素值转换为`vw`或`vh`单位 如果传入百分比值 则直接返回
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


/** 节流 */
export function throttle<P extends any[], T, R>(
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

/** 防抖 */
export function debounce<P extends any[], T, R>(
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

/** 设置 LocalStorage，无需手动序列化 */
export function setLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value))
}
/** 获取 LocalStorage，无需手动反序列化 */
export function getLocalStorage<T>(key: string) {
    const item = localStorage.getItem(key)
    if (item == null) {
        return null
    }

    return JSON.parse(item)
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
    } catch (error) {
        alert('数据加载失败')
    }
}

/**
 * 打印 必须启动一个服务器才能用; ***建议使用事件交互，如按钮点击，否则可能打开多个窗口***
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
 * 判断页面所有图片是否加载完成
 * @param el 要判断的元素 默认 document
 * @returns 是否加载完成
 */
export const judgeImgLoad = (el = document): Promise<boolean> => {
    const imgArr = el.querySelectorAll('img')

    const promArr = Array.from(imgArr).map(
        img => new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
        })
    )

    return new Promise((resolve) => {
        Promise.all(promArr)
            .then(() => resolve(true))
            .catch(() => resolve(false))
    })
}

/**
 * 判断图片的 src 是否可用，可用则返回图片
 * @param src 图片
 */
export const getImg = (src: string) => {
    const img = new Image()
    img.src = src

    return new Promise<false | HTMLImageElement>((resolve) => {
        img.onload = () => resolve(img)
        img.onerror = () => resolve(false)
    })
}

/** Blob 转 Base64 */
export function blobToBase64(blob: Blob) {
    const fr = new FileReader()
    fr.readAsDataURL(blob)

    return new Promise<string>((resolve) => {
        fr.onload = function () {
            resolve(this.result as string)
        }
    })
}

/**
 * 返回一个双击键盘事件
 * @param code 上下左右
 * @param fn 双击后执行函数
 * @param gap 间隔时间
 */
export function doubleKeyDown<T, P, R>(
    code: KeyCode,
    fn: (this: T, ...args: P[]) => R,
    gap = 150
) {
    // 调用函数记录初始时间 你不可能立即点击 所以下面的判断进不去
    let st = Date.now()

    return (e: KeyboardEvent) => {
        if (e.code !== code) return

        const now = Date.now()
        // 第一次点击肯定超过了间隔时间 所以重新赋值`st` 下次按下按键 只要在间隔时间内就算双击
        if (now - st <= gap) {
            return fn.call(this, e) as R
        }
        st = now
    }
}

/**
 * 检查并设置父元素的`overflow: hidden`
 * @param el 当前元素
 */
export const setParentOverflow = (el: HTMLElement) => {
    const parent = el.parentNode as HTMLElement,
        overflow = window.getComputedStyle(parent).overflow

    if (overflow !== 'hidden') {
        parent.style.overflow = 'hidden'
    }
}


/** 全屏 若已全屏 则退出全屏 */
export const fullScreen = (dom?: HTMLElement) => {
    const
        doc = document as any,
        root = document.documentElement as any,
        rfs =
            root.requestFullscreen ||
            root.webkitRequestFullscreen ||
            root.mozRequestFullScreen ||
            root.msRequestFullscreen,
        efs =
            doc.exitFullscreen ||
            doc.webkitCancelFullScreen ||
            doc.webkitExitFullscreen ||
            doc.mozCancelFullScreen ||
            doc.msExitFullscreen

    if (!rfs) return

    const isFull =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement

    if (dom) {
        isFull
            ? efs.call(dom)
            : rfs.call(dom)
    }
    else {
        isFull
            ? efs.call(root)
            : rfs.call(root)
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
