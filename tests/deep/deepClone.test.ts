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
    original.lastIndex = 2
    const cloned = deepClone(original)

    expect(cloned.source).toBe(original.source)
    expect(cloned.flags).toBe(original.flags)
    expect(cloned.lastIndex).toBe(2)
    expect(cloned).not.toBe(original)
  })

  it('应该深克隆 Map、Set 及其共享引用', () => {
    const shared = { id: 1 }
    const original = new Map<any, any>()
    original.set(shared, new Set([shared]))
    original.set('self', original)

    const cloned = deepClone(original)
    const [clonedKey, clonedSet] = cloned.entries().next().value

    expect(cloned).not.toBe(original)
    expect(clonedKey).not.toBe(shared)
    expect(clonedKey).toEqual(shared)
    expect(clonedSet).toBeInstanceOf(Set)
    expect(clonedSet.has(clonedKey)).toBe(true)
    expect(cloned.get('self')).toBe(cloned)
  })

  it('应该保留二进制对象类型、内容和 DataView 偏移量', () => {
    const buffer = new ArrayBuffer(8)
    const bytes = new Uint8Array(buffer)
    bytes.set([1, 2, 3, 4, 5, 6, 7, 8])
    const original = {
      buffer,
      typed: new Uint16Array(buffer, 2, 2),
      view: new DataView(buffer, 1, 4),
    }

    const cloned = deepClone(original)

    expect(cloned.buffer).toBeInstanceOf(ArrayBuffer)
    expect(cloned.buffer).not.toBe(buffer)
    expect(Array.from(new Uint8Array(cloned.buffer))).toEqual(Array.from(bytes))
    expect(cloned.typed).toBeInstanceOf(Uint16Array)
    expect(Array.from(cloned.typed)).toEqual(Array.from(original.typed))
    expect(cloned.typed).not.toBe(original.typed)
    expect(cloned.view).toBeInstanceOf(DataView)
    expect(cloned.view.byteOffset).toBe(1)
    expect(cloned.view.byteLength).toBe(4)
    expect(cloned.typed.buffer).toBe(cloned.buffer)
    expect(cloned.view.buffer).toBe(cloned.buffer)
    expect(Array.from(new Uint8Array(cloned.view.buffer, cloned.view.byteOffset, cloned.view.byteLength)))
      .toEqual(Array.from(new Uint8Array(original.view.buffer, original.view.byteOffset, original.view.byteLength)))
  })

  it('不应该为带内部槽的对象创建不可用的伪实例', () => {
    expect(() => deepClone(new WeakMap())).toThrow(TypeError)
    expect(() => deepClone(new WeakSet())).toThrow(TypeError)
    expect(() => deepClone(Promise.resolve(1))).toThrow(TypeError)
  })

  it.runIf(typeof SharedArrayBuffer !== 'undefined')('应该克隆 SharedArrayBuffer 的内容', () => {
    const original = new SharedArrayBuffer(2)
    new Uint8Array(original).set([1, 2])

    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(Array.from(new Uint8Array(cloned))).toEqual([1, 2])
  })

  it('应该处理函数', () => {
    const original = { fn: (x: number) => x * 2 }
    const cloned = deepClone(original)

    expect(cloned.fn).toBe(original.fn) // 函数应该保持引用
    expect(cloned.fn(5)).toBe(10)
  })

  it('应该处理 Symbol', () => {
    const sym = Symbol('test')
    const original = { [sym]: { value: 1 } }
    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(cloned[sym]).toEqual({ value: 1 })
    expect(cloned[sym]).not.toBe(original[sym])
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
