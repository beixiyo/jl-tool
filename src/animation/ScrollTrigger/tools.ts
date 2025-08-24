import type { PositionOffset, PositionValue, ScrollTriggerProp, ScrollTriggerPropValue, TriggerPosition, TriggerPositionObj } from './types'
import { getWinHeight, getWinWidth } from '@/domTools/size'
import { isFn } from '@/shared'

/**
 * 解析位置值
 * @param value 位置值
 * @param total 总尺寸
 * @returns 解析后的像素值
 */
export function parsePositionValue(
  value: PositionValue,
  total: number,
): number {
  if (value === 'top') {
    return 0
  }
  if (value === 'center') {
    return total / 2
  }
  if (value === 'bottom') {
    return total
  }

  if (value.endsWith('px')) {
    return Number.parseFloat(value)
  }
  if (value.endsWith('%')) {
    return (Number.parseFloat(value) / 100) * total
  }

  return 0
}

/**
 * 解析偏移值
 * @param offset 偏移值
 * @param total 总尺寸
 * @returns 解析后的像素值
 */
export function parseOffset(offset: PositionOffset | undefined | null, total: number): number {
  if (offset == undefined)
    return 0

  if (typeof offset === 'number') {
    return offset
  }

  if (offset.endsWith('px')) {
    return Number.parseFloat(offset)
  }
  if (offset.endsWith('%')) {
    return (Number.parseFloat(offset) / 100) * total
  }
  if (offset.startsWith('+=')) {
    return Number.parseFloat(offset.slice(2))
  }
  if (offset.startsWith('-=')) {
    return -Number.parseFloat(offset.slice(2))
  }

  return 0
}

/**
 * 解析触发位置配置
 * @param position 位置配置
 * @returns 解析后的标准配置对象
 */
export function normalizeTriggerPosition(position: TriggerPosition | undefined): TriggerPositionObj {
  if (!position) {
    /** 默认配置 */
    return { trigger: 'top', scroller: 'bottom' }
  }

  /** 兼容 "top 80%" 字符串写法，空格分隔两个位置值 */
  if (typeof position === 'string') {
    const parts = position.trim().split(/\s+/)
    if (parts.length === 2) {
      return {
        trigger: parts[0] as PositionValue,
        scroller: parts[1] as PositionValue,
      }
    }
  }

  if (Array.isArray(position)) {
    return {
      trigger: position[0],
      scroller: position[1],
      offset: position[2],
    }
  }

  return position as TriggerPositionObj
}

export function normalizeProps(props: ScrollTriggerProp[]) {
  const fromProps = props.length === 1
    ? {}
    : props[0]
  const toProps = props.length === 1
    ? props[0]
    : props[1]

  const allPropKeys = new Set([...Object.keys(fromProps), ...Object.keys(toProps)])

  return {
    fromProps,
    toProps,
    allPropKeys,
  }
}

export function getPropVal(prop: ScrollTriggerPropValue, index: number) {
  return isFn(prop)
    ? prop(index)
    : prop
}

/**
 * 获取DOM元素
 * @param selector 选择器或DOM元素
 * @returns DOM元素或null
 */
export function getElement(selector: string | HTMLElement | Window | undefined | null): HTMLElement | Window | null {
  if (!selector)
    return window
  if (selector === window)
    return window
  if (selector instanceof HTMLElement)
    return selector

  try {
    /** 只有在selector为字符串时才调用querySelector */
    if (typeof selector === 'string') {
      return document.querySelector(selector) as HTMLElement | null
    }
    return null
  }
  catch (e) {
    console.error('Invalid selector', e)
    return null
  }
}

/**
 * 计算元素在指定容器中的位置
 * @param element 元素
 * @param container 容器
 * @param triggerPosition 触发元素上的位置
 * @param scrollerPosition 滚动容器上的位置
 * @param offset 偏移量
 * @param direction 方向
 * @returns 计算后的位置
 */
export function getElementPosition(
  element: HTMLElement,
  container: HTMLElement | Window,
  triggerPosition: PositionValue,
  scrollerPosition: PositionValue,
  offset: PositionOffset | undefined,
  direction: 'vertical' | 'horizontal',
): number {
  const rect = element.getBoundingClientRect()
  const isVertical = direction === 'vertical'

  let containerSize: number
  let scrollPos: number
  let containerStart = 0 // 滚动容器的起始位置（相对于文档）

  if (container === window) {
    containerSize = isVertical
      ? getWinHeight()
      : getWinWidth()
    scrollPos = isVertical
      ? window.scrollY
      : window.scrollX
  }
  else {
    const c = container as HTMLElement
    const containerRect = c.getBoundingClientRect()
    containerSize = isVertical
      ? c.clientHeight
      : c.clientWidth
    scrollPos = isVertical
      ? c.scrollTop
      : c.scrollLeft
    containerStart = isVertical
      ? containerRect.top + window.scrollY
      : containerRect.left + window.scrollX
  }

  const elementSize = isVertical
    ? rect.height
    : rect.width

  // 1. 计算触发元素在文档中的绝对位置
  const elementAbsoluteStart = (isVertical
    ? rect.top
    : rect.left) + scrollPos
    - (container === window
      ? 0
      : containerStart - (isVertical
        ? window.scrollY
        : window.scrollX))

  // 2. 计算触发点在文档中的绝对位置
  const triggerPointAbsolute = elementAbsoluteStart + parsePositionValue(triggerPosition, elementSize)

  // 3. 计算滚动容器对齐点相对于容器顶部的位置
  const scrollerPointOffset = parsePositionValue(scrollerPosition, containerSize)

  // 4. 计算最终的滚动位置
  /** 目标滚动位置 = 触发点的绝对位置 - 滚动容器对齐点偏移 - 容器的文档起始位置 */
  let finalScrollPos = triggerPointAbsolute - scrollerPointOffset - containerStart

  // 5. 应用自定义偏移量
  const offsetValue = parseOffset(offset, containerSize)
  finalScrollPos += offsetValue

  return finalScrollPos
}

/**
 * 应用CSS样式到元素
 * @param element 目标元素
 * @param styles 样式对象
 */
export function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(element.style, styles)
}

/**
 * 创建并添加标记元素
 * @param startPos 开始位置
 * @param endPos 结束位置
 * @param options 标记选项
 * @returns 标记元素数组
 */
export function createMarkers(
  startPos: number,
  endPos: number,
  options: {
    startColor?: string
    endColor?: string
    fontSize?: string
    indent?: number
    direction?: 'vertical' | 'horizontal'
    container?: HTMLElement
  } = {},
): HTMLElement[] {
  const {
    startColor = '#75C900',
    endColor = '#D4145A',
    fontSize = '10px',
    indent = 0,
    direction = 'vertical',
    container = document.body,
  } = options

  const startMarker = document.createElement('div')
  const endMarker = document.createElement('div')
  const markerStyles = {
    position: 'absolute',
    zIndex: '1000',
    padding: '4px',
    fontSize,
    fontWeight: 'bold',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
  } as Partial<CSSStyleDeclaration>

  /** 开始标记 */
  applyStyles(startMarker, {
    ...markerStyles,
    ...(direction === 'vertical'
      ? { top: `${startPos}px`, left: `${indent}px` }
      : { top: `${indent}px`, left: `${startPos}px` }),
    backgroundColor: startColor,
  })
  startMarker.textContent = 'start'

  /** 结束标记 */
  applyStyles(endMarker, {
    ...markerStyles,
    ...(direction === 'vertical'
      ? { top: `${endPos}px`, left: `${indent}px` }
      : { top: `${indent}px`, left: `${endPos}px` }),
    backgroundColor: endColor,
  })
  endMarker.textContent = 'end'

  container.appendChild(startMarker)
  container.appendChild(endMarker)

  return [startMarker, endMarker]
}
