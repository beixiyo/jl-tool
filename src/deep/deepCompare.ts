import { isObj } from '@/shared/is'
import { getType } from '@/tools/tools'

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
    return Object.is(a.getTime(), b.getTime())
  },
  /** RegExp 类型：比较模式、标志和当前匹配游标 */
  regexp: (a: RegExp, b: RegExp) => {
    return a.source === b.source
      && a.flags === b.flags
      && a.lastIndex === b.lastIndex
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
  const initialContext: CompareContext = {
    leftToRight: new Map(),
    rightToLeft: new Map(),
  }

  return compareValue(o1, o2, initialContext)

  function compareValue(a: any, b: any, context: CompareContext): boolean {
    /** 使用 Object.is 进行快速比较 */
    if (Object.is(a, b)) {
      return true
    }

    const type1 = getType(a)
    const type2 = getType(b)
    if (type1 !== type2) {
      return false
    }

    /** 自定义规则优先于内置的对象比较 */
    if ((comparers as any)[type1]) {
      return (comparers as any)[type1](a, b)
    }

    if (!isObj(a) || !isObj(b)) {
      return false
    }

    /** 这些类型没有可枚举内容，不同实例无法通过结构可靠比较 */
    if (type1 === 'weakmap' || type1 === 'weakset' || type1 === 'promise') {
      return false
    }

    /** 保持既有契约：遇到循环引用或重复对象引用时返回 false */
    if (
      seen?.has(a)
      || seen?.has(b)
      || context.leftToRight.has(a)
      || context.rightToLeft.has(b)
    ) {
      return false
    }

    context.leftToRight.set(a, b)
    context.rightToLeft.set(b, a)

    if (a instanceof Map && b instanceof Map) {
      return compareMap(a, b, context)
    }
    if (a instanceof Set && b instanceof Set) {
      return compareSet(a, b, context)
    }
    if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
      return compareBytes(
        new Uint8Array(a),
        new Uint8Array(b),
      )
    }
    if (isSharedArrayBuffer(a) && isSharedArrayBuffer(b)) {
      return compareBytes(
        new Uint8Array(a),
        new Uint8Array(b),
      )
    }
    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      return a.constructor === b.constructor
        && compareBytes(
          new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
          new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
        )
    }
    if (a instanceof Error && b instanceof Error) {
      return a.name === b.name
        && a.message === b.message
        && compareValue(a.cause, b.cause, context)
        && compareProperties(a, b, context)
    }

    return compareProperties(a, b, context)
  }

  function compareMap(a: Map<any, any>, b: Map<any, any>, context: CompareContext) {
    if (a.size !== b.size)
      return false

    const unmatchedEntries = Array.from(b.entries())
    for (const [key, value] of a) {
      const matchIndex = unmatchedEntries.findIndex(([otherKey, otherValue]) => {
        const candidateContext = cloneContext(context)
        if (
          compareValue(key, otherKey, candidateContext)
          && compareValue(value, otherValue, candidateContext)
        ) {
          context.leftToRight = candidateContext.leftToRight
          context.rightToLeft = candidateContext.rightToLeft
          return true
        }
        return false
      })

      if (matchIndex < 0)
        return false

      unmatchedEntries.splice(matchIndex, 1)
    }

    return compareProperties(a, b, context)
  }

  function compareSet(a: Set<any>, b: Set<any>, context: CompareContext) {
    if (a.size !== b.size)
      return false

    const unmatchedValues = Array.from(b)
    for (const value of a) {
      const matchIndex = unmatchedValues.findIndex((otherValue) => {
        const candidateContext = cloneContext(context)
        if (compareValue(value, otherValue, candidateContext)) {
          context.leftToRight = candidateContext.leftToRight
          context.rightToLeft = candidateContext.rightToLeft
          return true
        }
        return false
      })

      if (matchIndex < 0)
        return false

      unmatchedValues.splice(matchIndex, 1)
    }

    return compareProperties(a, b, context)
  }

  function compareProperties(a: object, b: object, context: CompareContext) {
    const keys1 = getComparableKeys(a)
    const keys2 = getComparableKeys(b)
    if (keys1.length !== keys2.length) {
      return false
    }

    return keys1.every((key) => {
      return keys2.includes(key)
        && compareValue((a as any)[key], (b as any)[key], context)
    })
  }

  function getComparableKeys(value: object) {
    const allKeys = Object.keys(value).concat(Object.getOwnPropertySymbols(value) as any)
    const ignores = config?.ignores || []

    return allKeys.filter((key) => {
      return typeof key !== 'string' || !ignores.includes(key)
    })
  }
}

function isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
  return typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer
}

function compareBytes(a: Uint8Array, b: Uint8Array) {
  return a.byteLength === b.byteLength
    && a.every((value, index) => value === b[index])
}

function cloneContext(context: CompareContext): CompareContext {
  return {
    leftToRight: new Map(context.leftToRight),
    rightToLeft: new Map(context.rightToLeft),
  }
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

type CompareContext = {
  leftToRight: Map<object, object>
  rightToLeft: Map<object, object>
}
