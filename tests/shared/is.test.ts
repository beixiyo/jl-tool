import { describe, expect, it } from 'vitest'
import { isRecord } from '@/shared/is'

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
    if (isRecord(value))
      expect(value.enabled).toBe(true)
  })
})
