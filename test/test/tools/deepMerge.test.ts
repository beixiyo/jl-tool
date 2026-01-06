import { describe, expect, it } from 'vitest'
import { deepMerge } from '@/tools/tools'

describe('deepMerge', () => {
  it('应该深度合并嵌套对象', () => {
    const target = { a: 1, b: { c: 2, d: 3 } }
    const mergeSource = { b: { c: 4 } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: 4, d: 3 } })
    expect(result).not.toBe(target)
    expect(result.b).not.toBe(target.b)
  })

  it('应该保留目标对象中源对象未包含的属性', () => {
    const target = { a: 1, b: 2, c: { d: 3, e: 4 } }
    const mergeSource = { c: { d: 5 } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: 2, c: { d: 5, e: 4 } })
  })

  it('应该添加源对象中目标对象不存在的属性', () => {
    const target = { a: 1 }
    const mergeSource = { b: 2, c: { d: 3 } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: 2, c: { d: 3 } })
  })

  it('应该处理数组，直接替换而不是合并', () => {
    const target = { arr: [1, 2, 3], nested: { arr: [4, 5] } }
    const mergeSource = { arr: [6, 7], nested: { arr: [8] } }
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ arr: [6, 7], nested: { arr: [8] } })
    expect(result.arr).toBe(mergeSource.arr)
  })

  it('应该处理基本类型', () => {
    const target = { str: 'hello', num: 42, bool: true }
    const mergeSource = { str: 'world', num: 100 }
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ str: 'world', num: 100, bool: true })
  })

  it('应该处理 null 值', () => {
    const target = { a: 1, b: { c: 2 } }
    const mergeSource = { a: null, b: { c: null } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: null, b: { c: null } })
  })

  it('应该跳过 undefined 值', () => {
    const target = { a: 1, b: { c: 2 } }
    const mergeSource = { a: undefined, b: { c: undefined } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: 2 } })
  })

  it('应该处理多层嵌套对象', () => {
    const target = {
      level1: {
        level2: {
          level3: {
            a: 1,
            b: 2,
          },
          x: 10,
        },
        y: 20,
      },
    }
    const mergeSource = {
      level1: {
        level2: {
          level3: {
            a: 100,
          },
        },
      },
    } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            a: 100,
            b: 2,
          },
          x: 10,
        },
        y: 20,
      },
    })
  })

  it('应该处理空对象', () => {
    const target = { a: 1, b: {} }
    const mergeSource = { b: { c: 2 } }
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: 2 } })
  })

  it('应该处理源对象为空的情况', () => {
    const target = { a: 1, b: { c: 2 } }
    const mergeSource = {}
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: 2 } })
    expect(result).not.toBe(target)
  })

  it('应该处理混合类型属性', () => {
    const target = {
      obj: { a: 1 },
      arr: [1, 2],
      str: 'hello',
      num: 42,
      bool: true,
      nullVal: null,
    }
    const mergeSource = {
      obj: { b: 2 },
      arr: [3, 4],
      str: 'world',
      num: 100,
      bool: false,
      nullVal: null,
    } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({
      obj: { a: 1, b: 2 },
      arr: [3, 4],
      str: 'world',
      num: 100,
      bool: false,
      nullVal: null,
    })
  })

  it('应该不修改原始目标对象', () => {
    const target = { a: 1, b: { c: 2 } }
    const mergeSource = { b: { c: 3 } }
    const originalTarget = JSON.parse(JSON.stringify(target))

    deepMerge(target, mergeSource)

    expect(target).toEqual(originalTarget)
  })

  it('应该不修改原始源对象', () => {
    const target = { a: 1, b: { c: 2 } }
    const mergeSource = { b: { c: 3 } }
    const originalMergeSource = JSON.parse(JSON.stringify(mergeSource))

    deepMerge(target, mergeSource)

    expect(mergeSource).toEqual(originalMergeSource)
  })

  it('应该处理目标对象中不存在的嵌套属性', () => {
    const target = { a: 1 }
    const mergeSource = { b: { c: { d: 2 } } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: { d: 2 } } })
  })

  it('应该正确处理源对象中属性值为对象但目标对象中不存在的情况', () => {
    const target = { a: 1 }
    const mergeSource = { b: { c: 2 } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: 2 } })
  })

  it('应该正确处理源对象中属性值为对象但目标对象中为基本类型的情况', () => {
    const target = { a: 1, b: 'string' }
    const mergeSource = { b: { c: 2 } } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: { c: 2 } })
  })

  it('应该正确处理目标对象中属性值为对象但源对象中为基本类型的情况', () => {
    const target = { a: 1, b: { c: 2 } }
    const mergeSource = { b: 'string' } as any
    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: 'string' })
  })

  it('应该只遍历源对象的自有属性，不遍历原型链', () => {
    const target = { a: 1 }
    const mergeSource = Object.create({ inherited: 'should not be merged' }) as any
    mergeSource.b = 2

    const result = deepMerge(target, mergeSource)

    expect(result).toEqual({ a: 1, b: 2 })
    expect('inherited' in result).toBe(false)
  })
})

