/**
 * 判断是否能强转成数字
 * @param value 判断的值
 * @param enableParseFloat 默认 false，是否使用 parseFloat，这会把 '10px' 也当成数字
 */
export function isPureNum(value: string | number, enableParseFloat = false): value is number {
    let num: number
    if (enableParseFloat) {
        num = parseFloat(value + '')
    }
    else {
        num = Number(value)
    }

    if (typeof num === 'number' && !Number.isNaN(num)) {
        return true
    }

    return false
}

export const isStr = (s: any) => typeof s === 'string'
export const isNum = (s: any) => typeof s === 'number'
export const isBool = (s: any) => typeof s === 'boolean'

export const isFn = (s: any) => typeof s === 'function'
export const isObj = (s: any) => typeof s === 'object' && s !== null
export const isArr = (s: any) => Array.isArray(s)

/** Object.is */
export const isSame = (a: any, b: any) => Object.is(a, b)
