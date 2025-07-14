import type { SetValOpts } from './types'
import type { PropMap } from '@/types/tools'
import { TRANSFORM_KEYS } from '@/constants/animate'
import { numFixed } from '@/tools/tools'

/**
 * ### 根据进度更新动画值
 *
 * - 如果 target 是 *CSSStyleDeclaration* 并且
 * - 不是 *transform* 属性 并且
 * - 样式表和 *finalProps* 都没有单位，则使用 `px` 作为 `CSS` 单位
 */
export function setVal<T>({
  target,
  diffProps,
  progress,
  optUnit,
  onUpdate,
  callback,
  precision,
  enableTransform = true,
}: SetValOpts<T, any>) {
  if (onUpdate) {
    onUpdate(diffProps as PropMap<T>, progress, target)
    return
  }
  if (callback) {
    callback(diffProps as PropMap<T>, progress, target)
  }

  for (const k in diffProps) {
    if (
      !Object.hasOwnProperty.call(diffProps, k)
      || (enableTransform && TRANSFORM_KEYS.includes(k))
    ) {
      continue
    }

    const { initVal, diffVal, unit, rawElUnit } = diffProps[k]
    let value = initVal + progress * diffVal
    if (precision != undefined) {
      value = numFixed(value, precision)
    }

    /**
     * 动画备选单位(该参数对*transform*无效，优先级: `finalProps` > `opt.unit` > `rawEl`
     * 如果
     * - 如果 target 是 *CSSStyleDeclaration* 并且
     * - 不是 *transform* 属性 并且
     * - 样式表和 *finalProps* 都没有单位，则使用 `px` 作为 `CSS` 单位
     */
    if (unit != null) {
      // @ts-ignore
      target[k] = value + unit
    }
    else if (optUnit != null) {
      // @ts-ignore
      target[k] = value + optUnit
    }
    else if (rawElUnit != null) {
      // @ts-ignore
      target[k] = value + rawElUnit
    }
    else {
      // @ts-ignore
      target[k] = target instanceof CSSStyleDeclaration
        ? `${value}px`
        : value
    }
  }

  /**
   * transform 的属性要特殊处理
   */
  if (enableTransform) {
    let transformVal = ''

    Object.keys(diffProps)
      .filter(k => TRANSFORM_KEYS.includes(k))
      .forEach((k) => {
        const
          { initVal, diffVal, unit: transformUnit = '' } = diffProps[k]
        const value = initVal + progress * diffVal

        transformVal += `${k}(${value}${transformUnit}) `
      });

    (target as any).transform = transformVal
  }
}
