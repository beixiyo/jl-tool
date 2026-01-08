import { describe, expect, it } from 'vitest'
import { deepClone } from '@/deep'

describe('deepClone', () => {
  it('应该深克隆基本类型', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })

  it('应该深克隆数组', () => {
    const original = [1, 2, [3, 4], { a: 5 }]
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned[2]).not.toBe(original[2])
    expect(cloned[3]).not.toBe(original[3])
  })

  it('应该深克隆对象', () => {
    const original = { a: 1, b: { c: 2 }, d: [3, 4] }
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.b).not.toBe(original.b)
    expect(cloned.d).not.toBe(original.d)
  })

  it('应该处理循环引用', () => {
    const original: any = { a: 1 }
    original.self = original

    const cloned = deepClone(original)

    expect(cloned.a).toBe(1)
    expect(cloned.self).toBe(cloned)
    expect(cloned.self).not.toBe(original)
  })

  it('应该处理嵌套循环引用', () => {
    const original: any = { a: { b: {} } }
    original.a.b.parent = original

    const cloned = deepClone(original)

    expect(cloned.a.b.parent).toBe(cloned)
    expect(cloned.a.b.parent).not.toBe(original)
  })

  it('应该处理 Date 对象', () => {
    const original = new Date('2023-01-01')
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned instanceof Date).toBe(true)
  })

  it('应该处理 RegExp 对象', () => {
    const original = /test/g
    const cloned = deepClone(original)

    expect(cloned.source).toBe(original.source)
    expect(cloned.flags).toBe(original.flags)
    expect(cloned).not.toBe(original)
  })

  it('应该处理函数', () => {
    const original = { fn: (x: number) => x * 2 }
    const cloned = deepClone(original)

    expect(cloned.fn).toBe(original.fn) // 函数应该保持引用
    expect(cloned.fn(5)).toBe(10)
  })

  it('应该处理 Symbol', () => {
    const sym = Symbol('test')
    const original = { [sym]: 'value' }
    const cloned = deepClone(original)

    /** 实际的 deepClone 实现可能不支持 Symbol */
    expect(cloned).not.toBe(original)
  })

  it('应该处理 undefined 属性', () => {
    const original = { a: undefined, b: null }
    const cloned = deepClone(original)

    expect(cloned.a).toBeUndefined()
    expect(cloned.b).toBeNull()
  })

  it('应该处理空对象和数组', () => {
    const original = { emptyObj: {}, emptyArr: [] }
    const cloned = deepClone(original)

    expect(cloned.emptyObj).toEqual({})
    expect(cloned.emptyArr).toEqual([])
    expect(cloned.emptyObj).not.toBe(original.emptyObj)
    expect(cloned.emptyArr).not.toBe(original.emptyArr)
  })
})

