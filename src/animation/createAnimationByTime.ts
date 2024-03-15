import { AnimationOpt } from '@/types'
import { setVal } from './setVal'
import { genTimeFunc } from './timeFunc'
import { FinalProp, PropMap } from '@/types/tools'
import { applyAnimation } from './applyAnimation'
import { CSS_DEFAULT_VAL_KEYS, TRANSFORM_KEYS, TRANSFORM_UNIT_MAP, WITHOUT_UNITS } from '@/config/animate'


/**
 * 根据传入对象 随着时间推移 自动更新值
 * @param target 要修改的对象 如果是`CSSStyleDeclaration`对象 则单位默认为`px`
 * @param finalProps 要修改对象的最终属性值 不支持`transform`的复合属性
 * @param durationMS 动画持续时间
 * @param opt 配置项 可选参数; 动画单位优先级: `finalProps` > `opt.unit` > `rawEl(原始 DOM 的单位)`;
 *
 * 如果 ***target 是 CSSStyleDeclaration*** 并且  
 * ***不是 transform*** 属性 并且  
 * ***样式表和 finalProps 都没有单位***，则使用 `px` 作为 `CSS` 单位
 * @returns 返回一个停止动画函数
 */
export const createAnimationByTime = <T, P extends FinalProp>(
    target: T,
    finalProps: P,
    durationMS: number,
    opt?: AnimationOpt<T, P>
) => {
    durationMS < 1 && (durationMS = 1)

    const
        stTime = Date.now(),
        endTime = stTime + durationMS,
        enableTransform = opt?.transform,
        diffProps = getDiff<P>(target, finalProps, enableTransform),

        timeFunc = genTimeFunc(opt?.timeFunc),
        onUpdate = opt?.onUpdate,
        onEnd = opt?.onEnd,
        unit = opt?.unit

    return applyAnimation(() => {
        const curTime = Date.now()

        if (curTime >= endTime) {
            setVal<T, P>(target, diffProps, 1, unit, onUpdate, enableTransform)
            onEnd && onEnd(target, diffProps)
            return 'stop'
        }

        const
            _progress = (curTime - stTime) / durationMS,
            progress = timeFunc(_progress)

        setVal<T, P>(target, diffProps, progress, unit, onUpdate, enableTransform, opt?.precision)
    })
}


/**
 * 返回 初始值、初始值和最终值差值、单位
 * @param target 目标对象
 * @param finalProps 最终值对象
 */
function getDiff<P extends FinalProp>(
    target: any,
    finalProps: P,
    enableTransform: boolean
) {
    /** 要修改对象的原始`transform`值 */
    let originTransform: any = {}
    /** transform 的属性要特殊处理 这里解析所有`transform`的属性 */
    if (enableTransform) {
        originTransform = parseTransform(target, finalProps)
    }

    const res: any = {}
    for (const k in finalProps) {
        if (!Object.hasOwnProperty.call(finalProps, k)) continue

        /** 处理`transform`属性 */
        if ((enableTransform && TRANSFORM_KEYS.includes(k))) {
            const
                transformVal = originTransform[k],
                /** 优先级: `finalProps`指定的属性单位 > `target`原始样式表查到的单位 */
                unit = getUnit(finalProps[k], k) ?? getUnit(transformVal, k),
                initVal = parseFloat(transformVal),
                finalPropVal = parseFloat(finalProps[k]),
                diffVal = finalPropVal - initVal

            res[k] = { initVal, diffVal, unit }
            continue
        }
        /** 处理其他属性 */
        const
            finalPropVal = getDefaultVal(finalProps, k),
            initVal = getDefaultVal(target, k),
            diffVal = finalPropVal - initVal,
            unit = getUnit(finalProps[k], k),
            rawElUnit = getUnit(target[k], k)

        res[k] = { initVal, diffVal, unit, rawElUnit }
    }

    return res as PropMap<P>
}

/** 有些`CSS`属性默认是 1  但是从样式表拿到是空字串 比如`opacity` 该函数就是解决此问题的 */
function getDefaultVal(target: any, k: string) {
    if (!(target instanceof CSSStyleDeclaration)) {
        return parseFloat(target[k]) || 0
    }

    return CSS_DEFAULT_VAL_KEYS.includes(k)
        /** 有些`CSS`属性默认是 1  但是从样式表拿到是空字串 比如`opacity` */
        ? 1
        /** parseFloat是为了去处可能存在的`CSS`单位 */
        : parseFloat(target[k]) || 0
}


/**
 * 匹配`transform`的每个属性 如果是复合属性 则放入数组
 * @param cssText CSS transform 的内容
 */
function parseTransform(
    target: CSSStyleDeclaration,
    finalProps: any
): Record<string, string> {
    const transformRegex = /(\w+)\(([^)]+)\)/g
    const cssText = target.transform
    const transformValues = {}

    cssText.replace(transformRegex, (match, transformName, transformParams) => {
        const paramArr = transformParams
            .split(',')
            .map((param: string) => param.trim())

        transformValues[transformName] = paramArr.length === 1
            ? paramArr[0]
            : paramArr

        return match
    })

    /** 很大可能是空字符串 所以做个兜底 */
    Object.keys(finalProps)
        .filter((k) => TRANSFORM_KEYS.includes(k))
        .forEach((k) => {
            const item = transformValues[k]
            if (!item) {
                transformValues[k] = getDefaultVal(target, k)
            }
        })

    return transformValues
}

/**
 * 如果有`propName`则先查询默认值 否则返回解析的字符串
 * @param s 解析的字符串
 * @param propName 要从默认值映射表查询的键
 */
function getUnit(s: string, propName?: string): string | null {
    if (propName) {
        /** 没有单位的值 */
        if (WITHOUT_UNITS.includes(propName)) {
            return ''
        }

        const vUnit = /vw$|vh$/.exec(s)
        if (vUnit) {
            return vUnit[0]
        }

        /** transform 属性对应的默认单位 */
        let _unit = ''
        if ((_unit = TRANSFORM_UNIT_MAP[propName]) != undefined) {
            return _unit
        }
    }

    return /\D+$/.exec(s)?.[0] ?? null
}
