/**
 * 判断是否能强转成数字
 * @param value 判断的值
 * @param enableParseFloat 默认 false，是否使用 parseFloat，这会把 '10px' 也当成数字
 */
export function isPureNum(value: string | number, enableParseFloat = false) {
  let num: number
  if (enableParseFloat) {
    num = Number.parseFloat(`${value}`)
  }
  else {
    num = Number(value)
  }

  if (typeof num === 'number' && !Number.isNaN(num)) {
    return true
  }

  return false
}

export const isStr = (data: any): data is string => typeof data === 'string'
export const isNum = (data: any): data is number => typeof data === 'number'
export const isBool = (data: any): data is boolean => typeof data === 'boolean'

export const isFn = (data: any): data is Function => typeof data === 'function'

/**
 * typeof data === 'object' && data !== null
 */
export const isObj = (data: any): data is object => typeof data === 'object' && data !== null
export const isArr = <T>(data: any): data is Array<T> => Array.isArray(data)

/** Object.is */
export const isSame = (a: any, b: any) => Object.is(a, b)
