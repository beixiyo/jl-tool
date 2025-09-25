import { isObj, isStr } from '@/shared/is'

let id = 0

/**
 * 获取自增唯一 ID
 * @returns 自增的唯一 ID 字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * const id1 = uniqueId() // '0'
 * const id2 = uniqueId() // '1'
 * const id3 = uniqueId() // '2'
 * ```
 *
 * @example
 * ```ts
 * // 用于生成唯一标识符
 * const userId = `user_${uniqueId()}`
 * console.log(userId) // 'user_3'
 * ```
 */
export const uniqueId = () => (id++).toString()

/**
 * 获取数据类型
 * @param data 需要检测的数据
 * @returns 数据类型的字符串，如 'string', 'number', 'object', 'array' 等
 *
 * @example
 * ```ts
 * // 基础用法
 * getType('hello') // 'string'
 * getType(123) // 'number'
 * getType([]) // 'array'
 * getType({}) // 'object'
 * getType(null) // 'null'
 * getType(undefined) // 'undefined'
 * ```
 *
 * @example
 * ```ts
 * // 用于类型判断
 * const data = [1, 2, 3]
 * if (getType(data) === 'array') {
 *   console.log('这是一个数组')
 * }
 * ```
 */
export const getType = (data: any) => (Object.prototype.toString.call(data) as string).slice(8, -1).toLowerCase()

/**
 * 生成随机字符串
 * @returns 长度为 10 的随机字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * const str1 = randomStr() // 'a1b2c3d4e5'
 * const str2 = randomStr() // 'f6g7h8i9j0'
 * ```
 *
 * @example
 * ```ts
 * // 用于生成临时文件名
 * const tempFile = `temp_${randomStr()}.txt`
 * console.log(tempFile) // 'temp_k1l2m3n4o5.txt'
 * ```
 */
export const randomStr = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

/**
 * 摄氏度转华氏度
 * @param celsius 摄氏度数值
 * @returns 华氏度数值
 *
 * @example
 * ```ts
 * // 基础用法
 * celsiusToFahrenheit(0) // 32
 * celsiusToFahrenheit(25) // 77
 * celsiusToFahrenheit(100) // 212
 * ```
 *
 * @example
 * ```ts
 * // 温度转换应用
 * const tempC = 20
 * const tempF = celsiusToFahrenheit(tempC)
 * console.log(`${tempC}°C = ${tempF}°F`) // '20°C = 68°F'
 * ```
 */
export const celsiusToFahrenheit = (celsius: number) => celsius * 9 / 5 + 32

/**
 * 华氏度转摄氏度
 * @param fahrenheit 华氏度数值
 * @returns 摄氏度数值
 *
 * @example
 * ```ts
 * // 基础用法
 * fahrenheitToCelsius(32) // 0
 * fahrenheitToCelsius(77) // 25
 * fahrenheitToCelsius(212) // 100
 * ```
 *
 * @example
 * ```ts
 * // 温度转换应用
 * const tempF = 68
 * const tempC = fahrenheitToCelsius(tempF)
 * console.log(`${tempF}°F = ${tempC}°C`) // '68°F = 20°C'
 * ```
 */
export const fahrenheitToCelsius = (fahrenheit: number) => (fahrenheit - 32) * 5 / 9

/**
 * 限制函数调用次数
 * @param fn 需要限制调用次数的函数
 * @param options 配置选项
 * @param options.maxCount 最大调用次数，默认 1
 * @param options.returnLastResult 无法调用时是否返回上一次的结果，默认 true
 * @returns 包装后的函数
 *
 * @example
 * ```ts
 * // 基础用法 - 只允许调用一次
 * const expensiveOperation = once(() => {
 *   console.log('执行昂贵操作')
 *   return 'result'
 * })
 *
 * expensiveOperation() // 'result' - 正常执行
 * expensiveOperation() // 'result' - 返回上次结果
 * expensiveOperation() // 'result' - 返回上次结果
 * ```
 *
 * @example
 * ```ts
 * // 允许调用多次
 * const limitedFn = once(() => {
 *   console.log('执行操作')
 *   return Math.random()
 * }, { maxCount: 3, returnLastResult: false })
 *
 * limitedFn() // 0.123 - 正常执行
 * limitedFn() // 0.456 - 正常执行
 * limitedFn() // 0.789 - 正常执行
 * limitedFn() // undefined - 超过限制次数
 * ```
 */
export function once<Args extends any[], R>(
  fn: (...args: Args) => R,
  options?: OnceOpts,
): (...args: Args) => R | undefined {
  const {
    maxCount = 1,
    returnLastResult = true,
  } = options || {}

  let count = 0
  let lastResult: R | undefined

  return function (this: any, ...args: Args) {
    if (count++ >= maxCount) {
      if (returnLastResult) {
        return lastResult
      }
      else {
        lastResult = undefined
        return undefined
      }
    }

    lastResult = fn.apply(this, args)
    return lastResult
  }
}

/**
 * 获取随机范围数值
 * @param min 最小值
 * @param max 最大值（不包含）
 * @param enableFloat 是否返回浮点数，默认 false
 * @returns 指定范围内的随机数
 *
 * @example
 * ```ts
 * // 基础用法 - 整数
 * getRandomNum(1, 10) // 1-9 之间的整数
 * getRandomNum(0, 100) // 0-99 之间的整数
 * ```
 *
 * @example
 * ```ts
 * // 浮点数
 * getRandomNum(0, 1, true) // 0-1 之间的浮点数
 * getRandomNum(1.5, 5.5, true) // 1.5-5.5 之间的浮点数
 * ```
 *
 * @example
 * ```ts
 * // 实际应用
 * const randomAge = getRandomNum(18, 65) // 随机年龄
 * const randomPrice = getRandomNum(10, 100, true) // 随机价格
 * console.log(`年龄: ${randomAge}, 价格: ${randomPrice.toFixed(2)}`)
 * ```
 */
export function getRandomNum(min: number, max: number, enableFloat = false) {
  const r = Math.random()

  if (!enableFloat) {
    return Math.floor(r * (max - min) + min)
  }

  if (r < 0.01)
    return min
  return r * (max - min) + min
}

/**
 * 深拷贝对象
 * @param data 需要深拷贝的数据
 * @param map 用于处理循环引用的 WeakMap，内部使用
 * @param opts 配置选项
 * @param opts.useStructuredClone 是否使用 structuredClone，默认 false
 * @returns 深拷贝后的数据
 *
 * @example
 * ```ts
 * // 基础用法
 * const obj = { a: 1, b: { c: 2 } }
 * const cloned = deepClone(obj)
 * cloned.b.c = 3
 * console.log(obj.b.c) // 2 - 原对象未改变
 * console.log(cloned.b.c) // 3 - 拷贝对象已改变
 * ```
 *
 * @example
 * ```ts
 * // 处理循环引用
 * const obj: any = { name: 'test' }
 * obj.self = obj // 循环引用
 * const cloned = deepClone(obj)
 * console.log(cloned.self === cloned) // true - 循环引用被正确处理
 * ```
 *
 * @example
 * ```ts
 * // 使用 structuredClone（如果支持）
 * const data = { date: new Date(), regex: /test/gi }
 * const cloned = deepClone(data, new WeakMap(), { useStructuredClone: true })
 * console.log(cloned.date instanceof Date) // true
 * console.log(cloned.regex instanceof RegExp) // true
 * ```
 */
export function deepClone<T>(
  data: T,
  map = new WeakMap(),
  opts: DeepCloneOpts = {},
): T {
  const { useStructuredClone = false } = opts
  if (typeof structuredClone !== 'undefined' && useStructuredClone) {
    return structuredClone(data)
  }

  if (!isObj(data))
    return data
  if (data instanceof Date)
    return new Date(data) as T
  if (data instanceof RegExp)
    return new RegExp(data) as T

  if (map.has(data))
    return map.get(data)

  const tar = new (data as any).constructor()
  map.set(data, tar)
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key))
      continue
    tar[key] = deepClone(data[key], map)
  }

  return tar as T
}

/**
 * 深度比较两个对象是否相等
 * @param o1 第一个对象
 * @param o2 第二个对象
 * @param seen 用于处理循环引用的 WeakMap，内部使用
 * @returns 是否相等
 *
 * @example
 * ```ts
 * // 基础用法
 * const obj1 = { a: 1, b: { c: 2 } }
 * const obj2 = { a: 1, b: { c: 2 } }
 * const obj3 = { a: 1, b: { c: 3 } }
 *
 * deepCompare(obj1, obj2) // true
 * deepCompare(obj1, obj3) // false
 * ```
 *
 * @example
 * ```ts
 * // 处理循环引用
 * const obj1: any = { name: 'test' }
 * obj1.self = obj1
 * const obj2: any = { name: 'test' }
 * obj2.self = obj2
 *
 * deepCompare(obj1, obj2) // true - 循环引用被正确处理
 * ```
 *
 * @example
 * ```ts
 * // 数组比较
 * const arr1 = [1, 2, { a: 3 }]
 * const arr2 = [1, 2, { a: 3 }]
 * const arr3 = [1, 2, { a: 4 }]
 *
 * deepCompare(arr1, arr2) // true
 * deepCompare(arr1, arr3) // false
 * ```
 */
export function deepCompare(o1: any, o2: any, seen = new WeakMap()) {
  if (Object.is(o1, o2)) {
    return true
  }

  /**
   * !isObj，说明是基本类型，上面直接比较过了
   * 主要是 WeakMap 的键不能是基本类型，为了避免报错
   */
  if (!isObj(o1) || !isObj(o2) || getType(o1) !== getType(o2)) {
    return false
  }

  /** 循环引用 */
  if (seen.has(o1) || seen.has(o2)) {
    return false
  }

  seen.set(o1, true)
  seen.set(o2, true)

  const keys1 = Object.keys(o1).concat(Object.getOwnPropertySymbols(o1) as any)
  const keys2 = Object.keys(o2).concat(Object.getOwnPropertySymbols(o2) as any)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    /**
     * 键不同或者值不同
     */
    // @ts-ignore
    if (!keys2.includes(key) || !deepCompare(o1[key], o2[key], seen)) {
      return false
    }
  }

  return true
}

/**
 * 截取字符串并添加占位符
 * @param str 需要截取的字符串
 * @param len 需要截取的长度
 * @param placeholder 补在后面的字符串，默认 '...'
 * @returns 截取后的字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * cutStr('这是一个很长的字符串', 5) // '这是一个...'
 * cutStr('短字符串', 10) // '短字符串' - 未超过长度
 * ```
 *
 * @example
 * ```ts
 * // 自定义占位符
 * cutStr('Hello World', 8, '...') // 'Hello...'
 * cutStr('测试文本', 3, '...') // '测试...'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 文本预览
 * const longText = '这是一篇很长的文章内容，需要截取显示'
 * const preview = cutStr(longText, 20)
 * console.log(preview) // '这是一篇很长的文章内容，需要截取显示'
 * ```
 */
export function cutStr(str: string, len: number, placeholder = '...') {
  const placeholderLen = placeholder.length
  if (len <= placeholderLen) {
    return str.slice(0, len)
  }

  const newStr = str.slice(0, len)

  return str.length > len
    ? str.slice(0, len - placeholderLen) + placeholder
    : newStr
}

/**
 * 将对象的空值填充为指定字符串
 * @param data 需要转换的对象
 * @param config 配置选项
 * @param config.padStr 要填补的字符串，默认 '--'
 * @param config.ignoreNum 是否忽略数字 0，默认 true
 * @returns 填充后的对象
 *
 * @example
 * ```ts
 * // 基础用法
 * const data = { name: 'John', age: 0, email: '', city: null, country: undefined }
 * const result = padEmptyObj(data)
 * console.log(result) // { name: 'John', age: 0, email: '--', city: '--', country: '--' }
 * ```
 *
 * @example
 * ```ts
 * // 自定义填充字符串
 * const data = { title: '', content: '   ', author: null }
 * const result = padEmptyObj(data, { padStr: '暂无' })
 * console.log(result) // { title: '暂无', content: '暂无', author: '暂无' }
 * ```
 *
 * @example
 * ```ts
 * // 不忽略数字 0
 * const data = { count: 0, total: 5, name: '' }
 * const result = padEmptyObj(data, { ignoreNum: false })
 * console.log(result) // { count: '--', total: 5, name: '--' }
 * ```
 */
export function padEmptyObj<T extends object>(data: T, config?: {
  /** 要填补的字符串，默认 -- */
  padStr?: string
  /** 忽略数字 0，默认 true */
  ignoreNum?: boolean
}) {
  const _data = {} as any
  const { padStr = '--', ignoreNum = true } = config || {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k))
      continue

    const item = data[k] as any

    if (isStr(item) && item.trim() === '') {
      _data[k] = padStr
      continue
    }

    if (ignoreNum) {
      /** 排除空字符强转 0 */
      if (
        item != null
        && Number(item) === 0
      ) {
        _data[k] = item
        continue
      }
    }

    _data[k] = item || padStr
  }

  return _data as T
}

/**
 * 蛇形转驼峰 也可以指定转换其他的
 *
 * @example
 * ```ts
 * toCamel('test_a') => 'testA'
 * toCamel('test/a', '/') => 'testA'
 * ```
 *
 * @param key 需要转换的字符串
 * @param replaceStr 默认是 `_`，也就是蛇形转驼峰
 */
export function toCamel(key: string, replaceStr = '_') {
  const reg = new RegExp(`${replaceStr}([a-z])`, 'gi')

  return key.replace(reg, (_, g1) => {
    return g1.toUpperCase()
  })
}

/**
 * 柯里化函数
 * @param args 参数列表，第一个参数是函数，其余是预设参数
 * @returns 柯里化后的函数
 *
 * @example
 * ```ts
 * // 基础用法
 * const add = (a: number, b: number) => a + b
 * const add5 = curry(add, 5)
 * console.log(add5(3)) // 8
 * ```
 *
 * @example
 * ```ts
 * // 多参数柯里化
 * const multiply = (a: number, b: number, c: number) => a * b * c
 * const multiplyBy2 = curry(multiply, 2)
 * const multiplyBy2And3 = curry(multiply, 2, 3)
 *
 * console.log(multiplyBy2(4, 5)) // 40
 * console.log(multiplyBy2And3(4)) // 24
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 创建配置函数
 * const createRequest = (baseUrl: string, timeout: number) => (endpoint: string) => {
 *   return fetch(`${baseUrl}${endpoint}`, { timeout })
 * }
 *
 * const apiRequest = curry(createRequest, 'https://api.example.com', 5000)
 * const userRequest = apiRequest('/users')
 * ```
 */
export function curry(...args: any[]) {
  const fn = Array.prototype.slice.call(args, 0, 1)[0]
  const argArr = Array.prototype.slice.call(args, 1)

  if (arguments.length >= fn.length) {
    // @ts-ignore
    return fn.apply(this, argArr)
  }

  return function curried(...args: any[]) {
    if (args.length >= fn.length) {
      // @ts-ignore
      return fn.apply(this, args)
    }

    return function (...moreArgs: any[]) {
      // @ts-ignore
      return curried.apply(this, moreArgs.concat(args))
    }
  }
}

/**
 * 数字补齐精度
 * @param num 数字
 * @param precision 精度长度，默认 `2`
 * @param placeholder 补齐内容，默认 `0`
 * @returns 数字字符串
 *
 * @example
 * ```ts
 * padNum(1) => '1.00'
 * padNum(1, 3) => '1.000')
 * padNum(1, 3, '1') => '1.111'
 * ```
 */
export function padNum(num: string | number, precision = 2, placeholder = '0') {
  num = String(num)
  if (!num)
    return ''
  if (!num.includes('.')) {
    return `${num}.${placeholder.repeat(precision)}`
  }

  const arr = num.split('.')
  const len = arr[1].length
  if (len < precision) {
    return num + placeholder.repeat(precision - len)
  }
  return num
}

/**
 * 解决 Number.toFixed 计算错误
 * @example
 * ```ts
 * 1.335.toFixed(2) => '1.33'
 * numFixed(1.335) => 1.34
 * ```
 *
 * @param num 数值
 * @param precision 精度，默认 2
 */
export function numFixed(num: number | string, precision = 2) {
  num = Number(num)
  const scale = 10 ** precision
  return Math.round(num * scale) / scale
}

/**
 * - 提取值在 extractArr 中的元素，返回一个对象
 * - 例如提取对象中所有空字符串
 *
 * @example
 * ```ts
 * filterVals(data, [''])
 * ```
 * @param data 一个对象
 * @param extractArr 提取的值
 */
export function filterVals<T>(data: T, extractArr: any[]) {
  const _data: Partial<T> = {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k))
      continue

    const item = data[k]
    if (extractArr.includes(item)) {
      _data[k] = item
    }
  }
  return _data
}

/**
 * - 排除值在 excludeArr 中的元素，返回一个对象
 * - 例如排除对象中所有空字符串
 *
 * @example
 * ```ts
 * excludeVals(data, [''])
 * ```
 * @param data 一个对象
 * @param excludeArr 排除的值
 */
export function excludeVals<T extends object>(data: T, excludeArr: any[]) {
  const _data: Partial<T> = {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k))
      continue

    const item = data[k]
    if (!excludeArr.includes(item)) {
      _data[k] = item
    }
  }
  return _data
}

/**
 * - 从 `keys` 数组中提取属性，返回一个对象
 * - 例如：从对象中提取 `name` 属性，返回一个对象
 * @example
 * ```ts
 * filterKeys(data, ['name'])
 * ```
 * @param data 目标对象
 * @param keys 需要提取的属性
 */
export function filterKeys<T extends object, K extends keyof T>(
  data: T,
  keys: K[],
) {
  const _data: any = {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k))
      continue

    if (keys.includes(k as unknown as K)) {
      const item = data[k]
      _data[k] = item
    }
  }
  return _data as Pick<T, Extract<keyof T, K>>
}

/**
 * - 从 `keys` 数组中排除属性，返回一个对象
 * - 例如：从对象中排除 `name` 属性，返回一个对象
 * @example
 * ```ts
 * excludeKeys(data, ['name'])
 * ```
 * @param data 目标对象
 * @param keys 需要提取的属性
 */
export function excludeKeys<T extends object, K extends keyof T>(
  data: T,
  keys: K[],
) {
  const _data: any = {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k))
      continue

    if (!keys.includes(k as unknown as K)) {
      const item = data[k]
      _data[k] = item
    }
  }
  return _data as Omit<T, Extract<keyof T, K>>
}

/**
 * 等待指定时间后返回 Promise
 *
 * @example
 * ```ts
 * await wait(2000)
 * ```
 *
 * @param durationMS 等待时间，默认 1000 毫秒
 */
export function wait(durationMS = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMS)
  })
}

export type DeepCloneOpts = {
  /**
   * 是否使用 structuredClone，如果不支持深克隆会报错
   * @default false
   */
  useStructuredClone?: boolean
}

export type OnceOpts = {
  /** 最大调用次数，默认 1 */
  maxCount?: number
  /**
   * 无法调用时，是否返回上一次的结果，默认 true
   * @default true
   */
  returnLastResult?: boolean
}

/** 递归树拍平简易写法 */
// export function dataToTree(data: TreeData[]) {
//     return data.filter(p => {
//         const children = data.filter(c => c.pid === p.id)
//         children.length && (p.children = children)
//         return p.pid === 0
//     })
// }
// function toTree(data: TreeData[], res = [], pid = 0) {
//     for (const item of data) {
//         if (item.pid === pid) {
//             const newItem = { ...item, children: [] }
//             res.push(newItem)
//             toTree(data, newItem.children, item.id)
//         }
//     }
//     return res
// }
// // 简化版
// function toTree(arr: TreeData[], pid = 0) {
//     return arr.filter(p => p.pid === pid).map(
//         item => ({
//             ...item,
//             children: toTree(arr, item.id)
//         })
//     )
// }

// export function deepClone<T>(source: T) {
//     const t = getType(source)
//     if (t !== 'object' && t !== 'array') {
//         return source
//     }

//     let target
//     if (t === 'object') {
//         target = {}
//         for (const key in source) {
//             source.hasOwnProperty(key)
//                 && (target[key] = deepClone(source[key]))
//         }
//     }
//     else {
//         target = []
//         for (let i = 0; i < source.length; i++) {
//             target[i] = deepClone(source[i])
//         }
//     }
//     return target
// }
