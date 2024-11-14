import { isObj, isStr } from '@/shared/is'


let id = 0

/**
 * 获取自增唯一 ID
 */
export const uniqueId = () => id++

/** 获取类型 */
export const getType = (data: any) => (Object.prototype.toString.call(data) as string).slice(8, -1).toLowerCase()

/** 随机长度为`10`的字符串 */
export const randomStr = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

/** 摄氏度转华氏度 */
export const celsiusToFahrenheit = (celsius: number) => celsius * 9 / 5 + 32
/** 华氏度转摄氏度 */
export const fahrenheitToCelsius = (fahrenheit: number) => (fahrenheit - 32) * 5 / 9

/**
 * 获取随机范围数值，不包含最大值
 * @param min 最小值
 * @param max 最大值
 * @param enableFloat 是否返回浮点数，默认 false
 */
export function getRandomNum(min: number, max: number, enableFloat = false) {
  const r = Math.random()

  if (!enableFloat) {
    return Math.floor(r * (max - min) + min)
  }

  if (r < .01) return min
  return r * (max - min) + min
}

/** 深拷贝 */
export function deepClone<T>(data: T, map = new WeakMap): T {
  if (!isObj(data)) return data
  if (data instanceof Date) return new Date(data) as T
  if (data instanceof RegExp) return new RegExp(data) as T

  if (map.has(data)) return map.get(data)

  const tar = new (data as any).constructor()
  map.set(data, tar)
  for (const key in data) {
    if (!data.hasOwnProperty(key)) continue
    tar[key] = deepClone(data[key], map)
  }

  return tar as T
}

/**
 * 深度比较对象 `Map | Set` 无法使用  
 * 支持循环引用比较
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
    if (!keys2.includes(key) || !deepCompare(o1[key], o2[key], seen)) {
      return false
    }
  }

  return true
}

/**
 * - 截取字符串，默认补 `...` 到后面
 * - 如果长度小于等于 `placeholder` 补充字符串的长度，则直接截取
 * @param str 字符串
 * @param len 需要截取的长度
 * @param placeholder 补在后面的字符串，默认`...`
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
 * - 把对象的空值转为指定字符串，默认 `--`，返回一个对象
 * - 空值包含 **空字符串、空格、null、undefined** 
 * - 默认不包含数值 0，可通过配置修改
 * 
 * @param data 需要转换的对象
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
    if (!Object.hasOwnProperty.call(data, k)) continue

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
  const reg = new RegExp(`${replaceStr}([a-z])`, 'ig')

  return key.replace(reg, (_, g1) => {
    return g1.toUpperCase()
  })
}

/** 柯里化 */
export function curry() {
  const fn = Array.prototype.slice.call(arguments, 0, 1)[0],
    argArr = Array.prototype.slice.call(arguments, 1)

  if (arguments.length >= fn.length) {
    return fn.apply(this, argArr)
  }

  return function curried(...args: any[]) {
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    }

    return function (...moreArgs: any[]) {
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
  if (!num) return ''
  if (!num.includes('.')) {
    return num + '.' + placeholder.repeat(precision)
  }

  const arr = num.split('.'),
    len = arr[1].length
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
 * 生成 iconfont 的类名
 * @param name icon 名字
 * @param prefix 前缀默认 iconfont
 * @param suffix 后缀默认 icon
 * @param connector 连接符默认 -
 * @returns iconfont icon-${name}
 */
export function genIcon(name: string, prefix = 'iconfont', suffix = 'icon', connector = '-') {
  return `${prefix} ${suffix}${connector}${name}`
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
    if (!Object.hasOwnProperty.call(data, k)) continue

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
    if (!Object.hasOwnProperty.call(data, k)) continue

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
  keys: K[]
) {
  const _data: any = {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k)) continue

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
  keys: K[]
) {
  const _data: any = {}

  for (const k in data) {
    if (!Object.hasOwnProperty.call(data, k)) continue

    if (!keys.includes(k as unknown as K)) {
      const item = data[k]
      _data[k] = item
    }
  }
  return _data as Omit<T, Extract<keyof T, K>>
}



// 递归树拍平简易写法
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