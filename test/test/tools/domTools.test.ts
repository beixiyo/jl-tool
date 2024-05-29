import { handleCssUnit } from '@/tools/domTools'
import { expect, test } from 'vitest'


test('处理 CSS 单位测试', () => {
    expect(handleCssUnit('10px')).toBe('10px')
    expect(handleCssUnit('10')).toBe('10px')

    expect(handleCssUnit('xixi')).toBe('xixi')
})