import { handleCssUnit, calcDOMCoord } from '@/tools/domTools'
import { expect, test, describe } from 'vitest'


test('处理 CSS 单位测试', () => {
  expect(handleCssUnit('10px')).toBe('10px')
  expect(handleCssUnit('10')).toBe('10px')

  expect(handleCssUnit('xixi')).toBe('xixi')
})


describe('calcDOMCoord', () => {
  const innerWidth = 1000,
    innerHeight = 1000

  test('should convert mouse coordinates to [-1, 1] range', () => {
    const event = {
      clientX: 1000,
      clientY: 0,
    }
    const result = calcDOMCoord(event, innerWidth, innerHeight)
    expect(result).toEqual([1, 1])
  })

  test('should convert mouse coordinates to [-2, 2] range with y-axis reversed', () => {
    const event = {
      clientX: 500,
      clientY: 1000,
    }
    const result = calcDOMCoord(event, innerWidth, innerHeight, 2, true)
    expect(result).toEqual([0, 2])
  })

  test('should convert mouse coordinates to [0, 1] range', () => {
    const event = {
      clientX: 500,
      clientY: 500,
    }
    const result = calcDOMCoord(event, innerWidth, innerHeight, false)
    expect(result).toEqual([0.5, 0.5])
  })

  test('should convert mouse coordinates to [0, 1] range with y-axis reversed', () => {
    const event = {
      clientX: 500,
      clientY: 100,
    }
    const result = calcDOMCoord(event, innerWidth, innerHeight, false, true)
    expect(result).toEqual([0.5, 0.1])
  })
})