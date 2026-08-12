import { isObj } from '@/shared/is'

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
  map: WeakMap<object, any> = new WeakMap(),
  opts: DeepCloneOpts = {},
): T {
  const { useStructuredClone = false } = opts
  if (typeof structuredClone !== 'undefined' && useStructuredClone) {
    return structuredClone(data)
  }

  if (!isObj(data))
    return data

  if (map.has(data))
    return map.get(data)

  if (data instanceof WeakMap || data instanceof WeakSet || data instanceof Promise) {
    throw new TypeError(`deepClone does not support ${data.constructor.name}`)
  }

  if (data instanceof Date) {
    const target = new Date(data.getTime())
    map.set(data, target)
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  if (data instanceof RegExp) {
    const target = new RegExp(data.source, data.flags)
    target.lastIndex = data.lastIndex
    map.set(data, target)
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  if (data instanceof Map) {
    const target = new Map()
    map.set(data, target)
    data.forEach((value, key) => {
      target.set(
        deepClone(key, map, opts),
        deepClone(value, map, opts),
      )
    })
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  if (data instanceof Set) {
    const target = new Set()
    map.set(data, target)
    data.forEach((value) => {
      target.add(deepClone(value, map, opts))
    })
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  if (data instanceof ArrayBuffer) {
    const target = data.slice(0)
    map.set(data, target)
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  if (isSharedArrayBuffer(data)) {
    const target = data.slice(0)
    map.set(data, target)
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  if (ArrayBuffer.isView(data)) {
    const buffer = deepClone(data.buffer, map, opts)
    const target = data instanceof DataView
      ? new DataView(buffer, data.byteOffset, data.byteLength)
      : new (data.constructor as any)(buffer, data.byteOffset, (data as any).length)
    map.set(data, target)
    cloneEnumerableProperties(data, target, map, opts)
    return target as T
  }

  const target = Array.isArray(data)
    ? []
    : Object.create(Object.getPrototypeOf(data))
  map.set(data, target)
  cloneEnumerableProperties(data, target, map, opts)

  return target as T
}

function isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
  return typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer
}

/** 克隆对象自身的可枚举字符串键和 Symbol 键 */
function cloneEnumerableProperties(
  source: object,
  target: any,
  map: WeakMap<object, any>,
  opts: DeepCloneOpts,
) {
  const keys = [
    ...Object.keys(source),
    ...Object.getOwnPropertySymbols(source)
      .filter(symbol => Object.prototype.propertyIsEnumerable.call(source, symbol)),
  ]

  keys.forEach((key) => {
    target[key] = deepClone((source as any)[key], map, opts)
  })
}

export type DeepCloneOpts = {
  /**
   * 是否使用 structuredClone，如果不支持深克隆会报错
   * @default false
   */
  useStructuredClone?: boolean
}
