/** 验证普通记录对象与可等待值的公共类型判断契约 */
import { isPromiseLike, isRecord } from '@/shared/is'
import { runInNewContext } from 'node:vm'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'

describe('isPromiseLike', () => {
  it('识别跨上下文 Promise 与对象/函数形式的 thenable，检测时不执行 then', () => {
    const then = vi.fn()
    const values: unknown[] = [
      Promise.resolve(1),
      runInNewContext('Promise.resolve(1)'),
      { then },
      Object.assign(() => {}, { then }),
    ]

    for (const value of values) {
      expect(isPromiseLike(value)).toBe(true)
      if (isPromiseLike(value)) {
        expectTypeOf(value).toEqualTypeOf<PromiseLike<unknown>>()
      }
    }
    expect(then).not.toHaveBeenCalled()
  })

  it('排除空值、普通值及具有非函数 then 的对象', () => {
    for (const value of [null, undefined, 1, 'then', {}, () => {}, { then: 123 }, { then: undefined }]) {
      expect(isPromiseLike(value)).toBe(false)
    }
  })
})

describe('isRecord', () => {
  it('应该识别普通对象和无原型对象', () => {
    expect(isRecord({ name: 'jl-tool' })).toBe(true)
    expect(isRecord(Object.create(null))).toBe(true)
  })

  it('应该排除空值、数组和内建对象', () => {
    expect(isRecord(null)).toBe(false)
    expect(isRecord(undefined)).toBe(false)
    expect(isRecord([])).toBe(false)
    expect(isRecord(new Date())).toBe(false)
    expect(isRecord(new Map())).toBe(false)
    expect(isRecord(new Set())).toBe(false)
  })

  it('应该排除自定义类实例', () => {
    class User {}
    expect(isRecord(new User())).toBe(false)
  })

  it('类型收窄后可以按字符串键读取记录值', () => {
    const value: unknown = { enabled: true }
    if (isRecord(value)) expect(value.enabled).toBe(true)
  })
})
