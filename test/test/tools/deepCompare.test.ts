import { describe, expect, it } from 'vitest'
import { deepCompare } from '@/tools/tools'

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
