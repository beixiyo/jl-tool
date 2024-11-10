import type { OnUpdate } from '@/types'
import type { PropMap } from '@/types/tools'
import { numFixed } from '@/tools/tools'
import { TRANSFORM_KEYS } from '@/constants/animate'


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
}: SetValOpts<T, any>
) {
  if (onUpdate) {
    onUpdate(diffProps as PropMap<T>, progress, target)
    return
  }
  if (callback) {
    callback(diffProps as PropMap<T>, progress, target)
  }

  for (const k in diffProps) {
    if (
      !Object.hasOwnProperty.call(diffProps, k) ||
      (enableTransform && TRANSFORM_KEYS.includes(k))
    ) continue

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
      target[k as any] = value + unit
    }
    else if (optUnit != null) {
      target[k as any] = value + optUnit
    }
    else if (rawElUnit != null) {
      target[k as any] = value + rawElUnit
    }
    else {
      target[k as any] = target instanceof CSSStyleDeclaration
        ? value + 'px'
        : value
    }
  }

  /** 
   * transform 的属性要特殊处理
   */
  if (enableTransform) {
    let transformVal = ''

    Object.keys(diffProps)
      .filter((k) => TRANSFORM_KEYS.includes(k))
      .forEach((k) => {
        const
          { initVal, diffVal, unit: transformUnit = '' } = diffProps[k],
          value = initVal + progress * diffVal

        transformVal += `${k}(${value}${transformUnit}) `
      });

    (target as any).transform = transformVal
  }
}


type SetValOpts<T, P> = {
  /** 目标对象 */
  target: T
  /** 最终值对象和目标的差值 */
  diffProps: any
  /**  进度百分比 `0 ~ 1` */
  progress: number
  /**
   * 单位
   * 动画单位优先级 : `finalProps` > `opt.unit` > `rawEl`
   */
  optUnit?: string
  /**
   * 更改的回调函数
   */
  onUpdate?: OnUpdate<T, P>
  /**
   * 每次更新值的回调
   */
  callback?: OnUpdate<T, P>
  /**
   * 开启解析 transform
   * @default true
   */
  enableTransform?: boolean
  /** 精度 */
  precision?: number | undefined
}