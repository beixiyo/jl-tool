import { describe, expect, it } from 'vitest'
import { createMapRange, mapRange } from '@/math/mapRange'

describe(
  '正向映射',
  () => {
    it('正常映射', () => {
      expect(mapRange(10, { input: [0, 100], output: [100, 1000] })).toBe(190)
    })

    it('不限制范围', () => {
      expect(mapRange(
        300,
        { input: [0, 100], output: [100, 200] },
        { clamp: false },
      )).toBe(400)
    })
  },
)

describe(
  '反向映射',
  () => {
    it('正常映射', () => {
      expect(mapRange(0, {
        input: [0, 50],
        output: [50, 0],
      })).toBe(50)

      expect(mapRange(50, {
        input: [0, 50],
        output: [50, 0],
      })).toBe(0)
    })
  },
)

it('创建映射器', () => {
  const mapper = createMapRange({ input: [0, 100], output: [100, 1000] }, { clamp: true })
  expect(mapper(10)).toBe(190)
  expect(mapper(200)).toBe(1000)
})
