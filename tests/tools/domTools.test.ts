import { expect, it } from 'vitest'
import { handleCssUnit } from '@/domTools'

it('处理 CSS 单位测试', () => {
  expect(handleCssUnit('10px')).toBe('10px')
  expect(handleCssUnit('10')).toBe('10px')

  expect(handleCssUnit('xixi')).toBe('xixi')
})
