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

/**
 * 判断值是否为普通记录对象
 *
 * 数组、日期、集合和自定义类实例都不属于记录对象；无原型对象会被视为有效记录
 * @param value 待检测的值
 * @returns 值是可用字符串键访问的普通对象
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  if (!isObj(value) || Array.isArray(value))
    return false

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Object.is */
export const isSame = (a: any, b: any) => Object.is(a, b)
