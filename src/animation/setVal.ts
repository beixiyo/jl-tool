import { TRANSFORM_KEYS } from '@/config/config'
import { OnUpdate } from '@/types'
import { PropMap } from '@/types/tools'
import { numFixed } from '..'


/**
 * 根据进度更新动画值
 * @param target 目标对象
 * @param diffProps 最终值对象和目标的差值
 * @param progress 进度百分比 `0 ~ 1`
 * @param optUnit 单位; 动画单位优先级 : `finalProps` > `opt.unit` > `rawEl`;
 *
 * 如果 ***target 是 CSSStyleDeclaration*** 并且  
 * ***不是 transform*** 属性 并且  
 * ***样式表和 finalProps 都没有单位***，则使用 `px` 作为 `CSS` 单位
 * @param onUpdate 更改的回调函数
 * @param enableTransform 开启解析`transform` 默认`true`
 */
export function setVal<T, P>(
    target: T,
    diffProps: any,
    progress: number,
    optUnit: string | null,
    onUpdate?: OnUpdate<T, P>,
    enableTransform = true,
    precision?: number | undefined
) {
    if (onUpdate) {
        onUpdate(diffProps as PropMap<P>, progress, target, optUnit)
        return
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

        /** 动画备选单位(该参数对*transform*无效，优先级: `finalProps` > `opt.unit` > `rawEl`;
         * 如果
         * ***target是CSSStyleDeclaration***并且
         * ***不是transform***并且
         * ***样式表和finalProps都没有单位***，则使用`px` */
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

    /** transform 的属性要特殊处理 */
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

