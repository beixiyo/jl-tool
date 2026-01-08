import { getType } from '@/tools/tools'
import { isObj } from '@/shared/is'

/**
 * 默认比较规则
 */
const defaultComparers: Record<string, CustomComparer> = {
  /**
   * Date 类型：转为 timestamp 比较
   * 注意：getType 返回 'date'（小写），所以这里使用小写 key
   */
  date: (a: Date, b: Date) => {
    if (!(a instanceof Date) || !(b instanceof Date)) {
      return false
    }
    return a.getTime() === b.getTime()
  },
}

/**
 * 深度比较两个对象是否相等
 *
 * 支持基本类型、对象、数组、Date 等类型的深度比较，并能处理循环引用。
 * 可通过自定义比较规则扩展特定类型的比较逻辑。
 *
 * @param o1 第一个对象
 * @param o2 第二个对象
 * @param config 配置选项
 * @param seen 用于处理循环引用的 WeakMap（内部使用，通常不需要传递）
 * @returns 是否相等
 *
 * @example
 * // 比较嵌套对象
 * const obj1 = { user: { name: 'Alice', age: 30 }, tags: ['work', 'urgent'] }
 * const obj2 = { user: { name: 'Alice', age: 30 }, tags: ['work', 'urgent'] }
 * deepCompare(obj1, obj2) // true
 *
 * @example
 * // 比较数组
 * deepCompare([1, 2, { a: 3 }], [1, 2, { a: 3 }]) // true
 * deepCompare([1, 2, 3], [1, 2, 4]) // false
 *
 * @example
 * // Date 对象比较（默认支持）
 * const date1 = new Date('2024-01-01')
 * const date2 = new Date('2024-01-01')
 * deepCompare(date1, date2) // true（比较时间戳）
 *
 * @example
 * // 处理循环引用
 * const obj: any = { a: 1 }
 * obj.self = obj
 * const obj2: any = { a: 1 }
 * obj2.self = obj2
 * deepCompare(obj, obj2) // false（循环引用被视为不同）
 *
 * @example
 * // 使用自定义比较规则
 * deepCompare(
 *   { value: 'hello' },
 *   { value: 'HELLO' },
 *   {
 *     customComparers: {
 *       String: (a, b) => a.toLowerCase() === b.toLowerCase()
 *     }
 *   }
 * ) // true（忽略大小写）
 *
 * @example
 * // 忽略指定属性
 * deepCompare(
 *   { name: 'Alice', id: 1, timestamp: Date.now() },
 *   { name: 'Alice', id: 2, timestamp: Date.now() + 1000 },
 *   { ignores: ['id', 'timestamp'] }
 * ) // true（忽略 id 和 timestamp）
 */
export function deepCompare(
  o1: any,
  o2: any,
  config?: CompareConfig,
  seen?: WeakMap<object, boolean>,
): boolean {
  const comparers = { ...defaultComparers, ...config?.customComparers }
  seen = seen || new WeakMap()

  /** 使用 Object.is 进行快速比较 */
  if (Object.is(o1, o2)) {
    return true
  }

  /** 获取类型 */
  const type1 = getType(o1)
  const type2 = getType(o2)

  /** 类型不同，直接返回 false */
  if (type1 !== type2) {
    return false
  }

  /** 如果有自定义比较规则（包括默认规则），使用自定义规则 */
  if ((comparers as any)[type1]) {
    return (comparers as any)[type1](o1, o2)
  }

  /**
   * 基本类型比较（非对象类型）
   * 如果没有自定义比较规则，且是基本类型，说明不相等（Object.is 已经检查过了）
   */
  if (!isObj(o1) || !isObj(o2)) {
    return false
  }

  /** 处理循环引用 */
  if (seen.has(o1) || seen.has(o2)) {
    return false
  }

  seen.set(o1, true)
  seen.set(o2, true)

  /** 获取所有键（包括 Symbol） */
  const allKeys1 = Object.keys(o1).concat(Object.getOwnPropertySymbols(o1) as any)
  const allKeys2 = Object.keys(o2).concat(Object.getOwnPropertySymbols(o2) as any)

  /** 过滤掉需要忽略的键（只过滤字符串键，Symbol 键不忽略） */
  const ignores = config?.ignores || []
  const keys1 = allKeys1.filter((key) => {
    if (typeof key === 'string') {
      return !ignores.includes(key)
    }
    return true
  })
  const keys2 = allKeys2.filter((key) => {
    if (typeof key === 'string') {
      return !ignores.includes(key)
    }
    return true
  })

  if (keys1.length !== keys2.length) {
    return false
  }

  /** 递归比较每个属性 */
  for (const key of keys1) {
    // @ts-ignore
    if (!keys2.includes(key) || !deepCompare(o1[key], o2[key], config, seen)) {
      return false
    }
  }

  return true
}

/**
 * 自定义比较函数类型
 */
export type CustomComparer = (a: any, b: any) => boolean

/**
 * 常见的类型字面量键
 */
export type CommonTypeKey =
  | 'date'
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null'
  | 'undefined'
  | 'map'
  | 'set'
  | 'function'
  | 'asyncfunction'
  | 'regexp'
  | 'error'
  | 'promise'
  | 'symbol'
  | 'bigint'
  | (string & {})

/**
 * 比较配置选项
 */
export interface CompareConfig {
  /**
   * 自定义比较规则
   * key 为类型名称（如 'date', 'string'），value 为比较函数
   */
  customComparers?: Partial<Record<CommonTypeKey, CustomComparer>>
  /**
   * 需要忽略的属性名列表
   * 比较时会跳过这些属性，不参与比较
   */
  ignores?: string[]
}
