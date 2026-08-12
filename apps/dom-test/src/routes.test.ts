import { describe, expect, it } from 'vitest'
import { ROUTE_META } from './routeMeta'

describe('Solid DOM test routes', () => {
  it('每个页面都使用唯一且隔离的测试路由', () => {
    const paths = ROUTE_META.map(item => item.path)

    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every(path => path.startsWith('/tests/'))).toBe(true)
  })

  it('每条路由都有首页展示所需的完整元数据', () => {
    expect(ROUTE_META.every(item => item.title && item.description && item.group)).toBe(true)
  })
})
