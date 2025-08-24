import { isPureNum } from '@/shared/is'
import { getWinHeight, getWinWidth } from './size'

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
 * 使用 getComputedStyle 获取样式表属性 如果单位是 px ，则会去除单位
 * @param el 元素
 * @param attr 样式属性键值
 * @param pseudoElt 伪元素
 */
export function getStyle(el: HTMLElement, attr: string, pseudoElt?: string): string {
  const val = window.getComputedStyle(el, pseudoElt).getPropertyValue(attr)

  if (val.endsWith('px')) {
    return `${Number.parseFloat(val)}`
  }
  return val
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
