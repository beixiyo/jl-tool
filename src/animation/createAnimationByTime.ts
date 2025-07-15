import type { AnimationHandle, CreateAnimationByTimeConfig } from './types'
import { CSS_DEFAULT_VAL, TRANSFORM_UNIT_MAP, WITHOUT_UNITS } from '@/constants'
import { applyAnimation } from './applyAnimation'
import { genTimeFunc } from './timeFunc'

/**
 * 补间动画函数
 *
 * 支持两种模式:
 * 1. DOM元素：自动处理CSS样式，包括transform属性
 * 2. 普通对象：直接修改对象属性值
 *
 * 示例：
 * ```ts
 * // DOM元素动画
 * createAnimationByTime({
 *   target: document.querySelectorAll('.box'),
 *   to: { x: 100, opacity: 0.3 },
 *   duration: 1000,
 *   ease: 'easeOut',
 * })
 *
 * // 普通对象动画
 * const obj = { count: 0, alpha: 1 }
 * createAnimationByTime({
 *   target: obj,
 *   to: { count: 100, alpha: 0 },
 *   duration: 1000,
 * })
 * ```
 */
export function createAnimationByTime<T = any>(cfg: CreateAnimationByTimeConfig<T>): AnimationHandle {
  const {
    target,
    to,
    duration,
    ease = 'linear',
    onUpdate,
    onComplete,
  } = cfg

  const easingFn = genTimeFunc(ease)

  /** 检查是否为DOM元素 */
  const isDOMTarget = isDOM(target)

  if (isDOMTarget) {
    // DOM元素动画处理
    return animateDOM(
      target as HTMLElement | HTMLElement[] | NodeList | CSSStyleDeclaration,
      to,
      duration,
      easingFn,
      onUpdate,
      onComplete,
    )
  }
  else {
    /** 普通对象动画处理 */
    return animateObject(
      target as T | T[],
      to,
      duration,
      easingFn,
      onUpdate,
      onComplete,
    )
  }
}

/**
 * 处理DOM元素动画
 */
function animateDOM(
  target: HTMLElement | HTMLElement[] | NodeList | CSSStyleDeclaration,
  to: Partial<Record<string, number>>,
  duration: number,
  easingFn: (p: number) => number,
  onUpdate?: (progress: number) => void,
  onComplete?: () => void,
): AnimationHandle {
  /* 目标可能是多种形式，统一转为 元素和样式对象的数组 */
  const targets = normalizeTargets(target)
  if (targets.length === 0) {
    throw new Error('[createAnimationByTime] 无有效 DOM target')
  }

  /** 为每个目标存储起始值和差值 */
  const targetData = targets.map(({ element, style }) => {
    const startVals: Record<string, number> = {}
    const diffVals: Record<string, number> = {}
    const units: Record<string, string> = {}

    /** 获取计算后的样式，以便更准确地获取当前值和单位 */
    const computedStyle = element instanceof HTMLElement
      ? getComputedStyle(element)
      : null

    Object.keys(to).forEach((prop) => {
      const endVal = to[prop]!
      const [startVal, unit] = getStartValAndUnit(style, computedStyle, prop)

      startVals[prop] = startVal
      diffVals[prop] = endVal - startVal
      units[prop] = unit
    })

    return { style, startVals, diffVals, units }
  })

  const startTime = performance.now()

  const stop = applyAnimation(() => {
    const elapsed = performance.now() - startTime
    let rawProgress = elapsed / duration
    if (rawProgress >= 1) {
      rawProgress = 1
    }

    const progress = easingFn(rawProgress)

    /* 更新所有元素样式，每个元素使用自己的起始值和差值 */
    targetData.forEach(({ style, startVals, diffVals, units }) => {
      applyStyles(style, progress, startVals, diffVals, units)
    })

    onUpdate?.(progress)

    if (rawProgress >= 1) {
      onComplete?.()
      return 'stop'
    }
  })

  return { stop }
}

/**
 * 处理普通对象动画
 */
function animateObject<T = any>(
  target: T | T[],
  to: Partial<Record<string, number>>,
  duration: number,
  easingFn: (p: number) => number,
  onUpdate?: (progress: number) => void,
  onComplete?: () => void,
): AnimationHandle {
  const targets = Array.isArray(target)
    ? target
    : [target]
  if (targets.length === 0) {
    throw new Error('[createAnimationByTime] 无有效 target 对象')
  }

  /** 为每个目标对象存储起始值和差值 */
  const targetData = targets.map((obj) => {
    const startVals: Record<string, number> = {}
    const diffVals: Record<string, number> = {}

    Object.keys(to).forEach((prop) => {
      const endVal = to[prop]!
      const startVal = (obj as any)[prop] ?? 0

      startVals[prop] = startVal
      diffVals[prop] = endVal - startVal
    })

    return { obj, startVals, diffVals }
  })

  const startTime = performance.now()

  const stop = applyAnimation(() => {
    const elapsed = performance.now() - startTime
    let rawProgress = elapsed / duration
    if (rawProgress >= 1) {
      rawProgress = 1
    }

    const progress = easingFn(rawProgress)

    /* 更新所有目标对象，每个对象使用自己的起始值和差值 */
    targetData.forEach(({ obj, startVals, diffVals }) => {
      Object.keys(diffVals).forEach((prop) => {
        const startVal = startVals[prop]
        const diffVal = diffVals[prop]
        const value = startVal + diffVal * progress

        ;(obj as any)[prop] = value
      })
    })

    onUpdate?.(progress)

    if (rawProgress >= 1) {
      onComplete?.()
      return 'stop'
    }
  })

  return { stop }
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                           */
/* ------------------------------------------------------------------ */

/**
 * 检查目标是否为DOM元素
 */
function isDOM(obj: any): boolean {
  if (!obj)
    return false

  /** 检查是否为DOM元素或DOM相关对象 */
  if (
    obj instanceof HTMLElement
    || obj instanceof CSSStyleDeclaration
    || obj instanceof NodeList
  ) {
    return true
  }

  /** 检查数组中是否包含DOM元素 */
  if (Array.isArray(obj) && obj.length > 0) {
    return obj[0] instanceof HTMLElement
  }

  return false
}

/**
 * 规范化目标为元素和样式对象的数组
 */
function normalizeTargets(t: any): Array<{ element: HTMLElement | null, style: CSSStyleDeclaration }> {
  if (!t) {
    return []
  }

  if (t instanceof CSSStyleDeclaration) {
    /** 尝试获取元素引用 */
    const element = (t as any).ownerElement || null
    return [{ element, style: t }]
  }
  else if (t instanceof HTMLElement) {
    return [{ element: t, style: t.style }]
  }
  else if (t instanceof NodeList) {
    return Array.from(t).map(node => ({
      element: node as HTMLElement,
      style: (node as HTMLElement).style,
    }))
  }
  else if (Array.isArray(t)) {
    return t.map(el => ({
      element: el as HTMLElement,
      style: (el as HTMLElement).style,
    }))
  }
  else {
    return []
  }
}

/**
 * 获取样式起始值和单位
 * @returns [数值, 单位]
 */
function getStartValAndUnit(style: CSSStyleDeclaration, computedStyle: CSSStyleDeclaration | null, prop: string): [number, string] {
  /** 对于transform特殊属性，直接使用默认值和单位 */
  if (TRANSFORM_UNIT_MAP[prop] !== undefined) {
    return [CSS_DEFAULT_VAL[prop] || 0, TRANSFORM_UNIT_MAP[prop]]
  }

  /** 首先尝试从行内样式获取 */
  let currentValue = (style as any)[prop] || ''

  /** 如果行内样式为空且有计算样式，则使用计算样式 */
  if ((!currentValue || currentValue === '') && computedStyle) {
    currentValue = computedStyle[prop as any] || ''
  }

  /** 解析数值和单位 */
  const value = Number.parseFloat(currentValue)
  /** 如果能解析出数值，提取单位部分 */
  if (!Number.isNaN(value)) {
    const unit = currentValue.replace(/^[-\d.]+/, '')
    return [value, unit || getDefaultUnit(prop)]
  }

  /** 如果无法解析，使用默认值和单位 */
  return [CSS_DEFAULT_VAL[prop] || 0, getDefaultUnit(prop)]
}

/**
 * 获取属性的默认单位
 */
function getDefaultUnit(prop: string): string {
  if (WITHOUT_UNITS.has(prop)) {
    return ''
  }
  return 'px'
}

function applyStyles(
  style: CSSStyleDeclaration,
  progress: number,
  start: Record<string, number>,
  diff: Record<string, number>,
  units: Record<string, string>,
) {
  const transforms: string[] = []

  Object.keys(diff).forEach((prop) => {
    const startVal = start[prop]
    const diffVal = diff[prop]
    const value = startVal + diffVal * progress
    const unit = units[prop]

    switch (prop) {
      case 'x':
      case 'y':
      case 'z':
        transforms.push(`translate${prop.toUpperCase()}(${value}${unit})`)
        break
      case 'scale':
      case 'scaleX':
      case 'scaleY':
        transforms.push(`${prop}(${value})`)
        break
      case 'rotate':
      case 'rotateX':
      case 'rotateY':
      case 'rotateZ':
        transforms.push(`${prop}(${value}${unit})`)
        break
      default:
        try {
          // @ts-ignore
          style[prop] = `${value}${unit}`
        }
        catch (e) {
          console.warn(`无法设置样式属性: ${prop}`)
        }
        break
    }
  })

  if (transforms.length) {
    style.transform = transforms.join(' ')
  }
}
