import { describe, expect, it } from 'vitest'
import { deepCompare } from '@/deep'

/** 第一个元素，代表期望比较结果 */
const testCases = [
  /** 基本类型 */
  [true, null, null], // 0
  [true, undefined, undefined], // 1
  [true, true, true], // 2
  [true, false, false], // 3
  [true, 42, 42], // 4
  [true, 'hello', 'hello'], // 5

  /** 特殊值 */
  [true, Number.NaN, Number.NaN], // 6
  [true, Infinity, Infinity], // 7

  /** 对象 */
  [true, { a: 1, b: { c: 'nested' } }, { a: 1, b: { c: 'nested' } }], // 8
  [false, { a: 1, b: { c: 'nested' } }, { a: 1, b: { c: 'different' } }], // 9 false

  /** 数组 */
  [true, [1, 2, 3], [1, 2, 3]], // 10
  [false, [1, 2, 3], [1, 2, 4]], // 11 false

  // Symbol
  [false, Symbol('foo'), Symbol('foo')], // 12 false

  /** 函数 */
  [false, () => { }, () => { }], // 13 false

  /** 复杂对象                                                                                   // 14 */
  [
    true,
    { a: [1, 2, { b: 'nested' }], c: { d: 'hello', e: [null, { f: 'world' }] } },
    { a: [1, 2, { b: 'nested' }], c: { e: [null, { f: 'world' }], d: 'hello' } },
  ],

  /** 循环引用测试                                                                               // 15 */
  (() => {
    const obj: any = { a: 1 }
    const obj2: any = { a: 1 }

    obj2.self = obj
    obj.self = obj2
    return [false, obj, obj2]
  })(),

  [
    false, // 16 false
    { a: undefined, b: undefined },
    { a: null, b: undefined },
  ],
]

describe('深度比较测试', () => {
  testCases.forEach(([flag, v1, v2], i) => {
    const resFn = flag
      ? 'toBeTruthy'
      : 'toBeFalsy'

    it(`${i}`, () => {
      expect(deepCompare(v1, v2))[resFn]()
    })
  })
})

describe('deepCompare 配置项测试', () => {
  describe('customComparers - 自定义比较规则', () => {
    it('应该支持字符串忽略大小写比较', () => {
      const obj1 = { value: 'hello' }
      const obj2 = { value: 'HELLO' }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, {
        customComparers: {
          string: (a, b) => a.toLowerCase() === b.toLowerCase(),
        },
      })).toBe(true)
    })

    it('应该支持数字容差比较', () => {
      const obj1 = { value: 100 }
      const obj2 = { value: 101 }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, {
        customComparers: {
          number: (a, b) => Math.abs(a - b) <= 2,
        },
      })).toBe(true)
    })

    it('应该支持覆盖默认的 Date 比较规则', () => {
      const date1 = new Date('2024-01-01T00:00:00.000Z')
      const date2 = new Date('2024-01-01T00:00:00.001Z')

      // 默认比较时间戳，应该相等
      expect(deepCompare(date1, date2)).toBe(false)

      // 自定义规则：只比较日期部分，忽略时间
      expect(deepCompare(date1, date2, {
        customComparers: {
          date: (a, b) => {
            return a.toDateString() === b.toDateString()
          },
        },
      })).toBe(true)
    })

    it('应该支持自定义数组比较规则', () => {
      const arr1 = [1, 2, 3]
      const arr2 = [3, 2, 1]

      expect(deepCompare(arr1, arr2)).toBe(false)
      expect(deepCompare(arr1, arr2, {
        customComparers: {
          array: (a, b) => {
            if (a.length !== b.length) return false
            const sortedA = [...a].sort()
            const sortedB = [...b].sort()
            return deepCompare(sortedA, sortedB)
          },
        },
      })).toBe(true)
    })

    it('应该支持嵌套对象中使用自定义比较规则', () => {
      const obj1 = {
        user: { name: 'Alice', email: 'ALICE@EXAMPLE.COM' },
        tags: ['work', 'urgent'],
      }
      const obj2 = {
        user: { name: 'Alice', email: 'alice@example.com' },
        tags: ['work', 'urgent'],
      }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, {
        customComparers: {
          string: (a, b) => a.toLowerCase() === b.toLowerCase(),
        },
      })).toBe(true)
    })

    it('应该支持多个自定义比较规则', () => {
      const obj1 = { str: 'HELLO', num: 100, date: new Date('2024-01-01T00:00:00.000Z') }
      const obj2 = { str: 'hello', num: 102, date: new Date('2024-01-01T00:00:00.500Z') }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, {
        customComparers: {
          string: (a, b) => a.toLowerCase() === b.toLowerCase(),
          number: (a, b) => Math.abs(a - b) <= 2,
          date: (a, b) => a.toDateString() === b.toDateString(),
        },
      })).toBe(true)
    })
  })

  describe('ignores - 忽略属性', () => {
    it('应该忽略单个属性', () => {
      const obj1 = { name: 'Alice', id: 1, age: 30 }
      const obj2 = { name: 'Alice', id: 2, age: 30 }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, { ignores: ['id'] })).toBe(true)
    })

    it('应该忽略多个属性', () => {
      const obj1 = { name: 'Alice', id: 1, timestamp: 1000, age: 30 }
      const obj2 = { name: 'Alice', id: 2, timestamp: 2000, age: 30 }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, { ignores: ['id', 'timestamp'] })).toBe(true)
    })

    it('应该忽略嵌套对象的属性', () => {
      const obj1 = {
        user: { name: 'Alice', id: 1, age: 30 },
        tags: ['work'],
      }
      const obj2 = {
        user: { name: 'Alice', id: 2, age: 30 },
        tags: ['work'],
      }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, { ignores: ['id'] })).toBe(true)
    })

    it('应该忽略数组中的对象属性', () => {
      const obj1 = {
        users: [
          { name: 'Alice', id: 1 },
          { name: 'Bob', id: 2 },
        ],
      }
      const obj2 = {
        users: [
          { name: 'Alice', id: 10 },
          { name: 'Bob', id: 20 },
        ],
      }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, { ignores: ['id'] })).toBe(true)
    })

    it('应该忽略多层嵌套对象的属性', () => {
      const obj1 = {
        level1: {
          level2: {
            level3: {
              value: 'test',
              id: 1,
            },
          },
        },
      }
      const obj2 = {
        level1: {
          level2: {
            level3: {
              value: 'test',
              id: 2,
            },
          },
        },
      }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, { ignores: ['id'] })).toBe(true)
    })

    it('应该同时支持忽略属性和自定义比较规则', () => {
      const obj1 = { name: 'Alice', id: 1, email: 'ALICE@EXAMPLE.COM', timestamp: 1000 }
      const obj2 = { name: 'Alice', id: 2, email: 'alice@example.com', timestamp: 2000 }

      expect(deepCompare(obj1, obj2)).toBe(false)
      expect(deepCompare(obj1, obj2, {
        ignores: ['id', 'timestamp'],
        customComparers: {
          string: (a, b) => a.toLowerCase() === b.toLowerCase(),
        },
      })).toBe(true)
    })

    it('应该只忽略字符串键，不忽略 Symbol 键', () => {
      const sym = Symbol('test')
      const obj1: any = { name: 'Alice', id: 1 }
      const obj2: any = { name: 'Alice', id: 2 }
      obj1[sym] = 'value1'
      obj2[sym] = 'value2'

      // 即使忽略了 id，Symbol 键不同也应该返回 false
      expect(deepCompare(obj1, obj2, { ignores: ['id'] })).toBe(false)

      // Symbol 键相同，忽略 id 后应该返回 true
      obj2[sym] = 'value1'
      expect(deepCompare(obj1, obj2, { ignores: ['id'] })).toBe(true)
    })

    it('应该处理忽略不存在的属性', () => {
      const obj1 = { name: 'Alice', age: 30 }
      const obj2 = { name: 'Alice', age: 30 }

      // 忽略不存在的属性不应该影响比较结果
      expect(deepCompare(obj1, obj2, { ignores: ['id', 'timestamp'] })).toBe(true)
    })
  })
})

