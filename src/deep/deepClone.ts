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

export type DeepCloneOpts = {
  /**
   * 是否使用 structuredClone，如果不支持深克隆会报错
   * @default false
   */
  useStructuredClone?: boolean
}
