import { isObj } from '@/shared/is'

/**
 * 深度合并对象
 * 将源对象的属性深度合并到目标对象中，保留目标对象中源对象未包含的属性
 *
 * @param target 目标对象
 * @param mergeSource 源对象（要合并的对象）
 * @returns 合并后的新对象
 *
 * @example
 * ```ts
 * const target = { a: 1, b: { c: 2, d: 3 } }
 * const mergeSource = { b: { c: 4 } }
 * deepMerge(target, mergeSource) // { a: 1, b: { c: 4, d: 3 } }
 * ```
 */
export function deepMerge<T extends Record<string, any>>(target: T, mergeSource: Partial<T>): T {
  const result = { ...target }

  for (const key in mergeSource) {
    /** 只检查自有属性，避免遍历原型链 */
    if (!Object.prototype.hasOwnProperty.call(mergeSource, key)) {
      continue
    }

    const sourceValue = mergeSource[key]

    /** 只跳过 undefined，null 是有效值应该被合并 */
    if (sourceValue === undefined) {
      continue
    }

    const targetValue = target[key]

    /** 处理对象类型的合并（排除数组和 null） */
    if (
      isObj(sourceValue)
      && !Array.isArray(sourceValue)
      && isObj(targetValue)
      && !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue)
    }
    else {
      /** 直接赋值（包括数组、基本类型、null） */
      result[key] = sourceValue as T[Extract<keyof T, string>]
    }
  }

  return result
}
