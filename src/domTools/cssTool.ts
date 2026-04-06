import { isPureNum } from '@/shared/is'
import { getWinHeight, getWinWidth } from './size'

/**
 * 按设计稿宽度（或高度）将数值像素换算为当前视口下的 `px` 字符串；`%` / `vw` / `vh` 原样返回
 * @param px 设计稿上的数值或带单位的字符串
 * @param designSize 设计稿基准尺寸，默认 `1920`（与 `type` 对应宽或高）
 * @param type 按视口宽或高比例缩放，默认 `'width'`
 * @returns 形如 `'12.34px'` 的字符串
 *
 * @example
 * ```ts
 * adaptPx(100, 1920) // 当前宽 / 1920 * 100 + 'px'
 * adaptPx('50vw') // '50vw'
 * ```
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

/**
 * 纯数字（或可解析为纯数字的字符串）补 `px`，否则原样返回（用于内联样式拼接）
 * @param value 数值或已带单位的字符串
 *
 * @example
 * ```ts
 * handleCssUnit(12)   // '12px'
 * handleCssUnit('1em') // '1em'
 * ```
 */
export function handleCssUnit(value: string | number) {
  if (isPureNum(value)) {
    return `${value}px`
  }
  return value
}

/**
 * 将设计稿像素换算为 `vw` 或 `vh`；`%` / `vw` / `vh` 字符串原样返回
 * @param px 设计稿像素值或已带单位的字符串
 * @param designSize 设计稿基准边长，默认 `1920`
 * @param unit 输出为 `vw` 或 `vh`，默认 `vw`
 * @returns 形如 `5.208333333333334vw` 的字符串
 *
 * @example
 * ```ts
 * pxToVw(100, 1920)    // 按 1920 设计宽换算
 * pxToVw(100, 1080, 'vh')
 * ```
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
 * 读取计算样式：通过 `getComputedStyle` 取属性值；若为 `px` 则去掉单位只返回数字字符串
 * @param el 目标元素
 * @param attr CSS 属性名（建议 kebab-case，如 `'font-size'`）
 * @param pseudoElt 伪元素选择器，如 `'::before'`
 * @returns 属性值字符串；`px` 时为无单位数字字符串
 *
 * @example
 * ```ts
 * const w = getStyle(el, 'width')      // 如 '120' 表示 120px
 * const c = getStyle(el, 'content', '::before')
 * ```
 */
export function getStyle(el: HTMLElement, attr: string, pseudoElt?: string): string {
  const val = window.getComputedStyle(el, pseudoElt).getPropertyValue(attr)

  if (val.endsWith('px')) {
    return `${Number.parseFloat(val)}`
  }
  return val
}

/**
 * 收集当前文档中 `<style>` 内联与 `<link rel="stylesheet">` 的 CSS 文本，拼成一段 HTML 片段（供打印等场景注入）
 * @returns 多个 `<style>...</style>` 拼接字符串；拉取外链失败时 `undefined` 并在控制台报错
 *
 * @example
 * ```ts
 * const css = await getAllStyle()
 * print(document.getElementById('report')!, css)
 * ```
 */
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
