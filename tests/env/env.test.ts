// @vitest-environment node

import { getEnv } from '#/env'
import { normalizeConfig } from '#/env/normalize'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock console 方法
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { })

// Mock process.exit
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called')
})


describe('getEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    /** 重置环境变量 */
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('应该返回存在的环境变量', () => {
    process.env.TEST_VAR = 'test_value'
    const result = getEnv('TEST_VAR')
    expect(result).toBe('test_value')
  })

  it('应该返回默认值当环境变量不存在时', () => {
    delete process.env.TEST_VAR
    const result = getEnv('TEST_VAR', 'default_value')
    expect(result).toBe('default_value')
  })

  it('应该返回空字符串当环境变量和默认值都不存在时', () => {
    delete process.env.TEST_VAR
    const result = getEnv('TEST_VAR')
    expect(result).toBe('')
  })

  it('应该在必需变量缺失时调用 process.exit', () => {
    delete process.env.REQUIRED_VAR

    expect(() => {
      getEnv('REQUIRED_VAR', undefined, true)
    }).toThrow('process.exit called')

    expect(mockConsoleError).toHaveBeenCalledWith('[getEnv]: 环境变量 REQUIRED_VAR 未设置，这是必需的变量')
    expect(mockProcessExit).toHaveBeenCalledWith(1)
  })

  it('应该返回环境变量值而不是默认值当两者都存在时', () => {
    process.env.TEST_VAR = 'env_value'
    const result = getEnv('TEST_VAR', 'default_value')
    expect(result).toBe('env_value')
  })

  it('应该返回默认值当环境变量为空字符串时', () => {
    process.env.TEST_VAR = ''
    const result = getEnv('TEST_VAR', 'default_value')
    expect(result).toBe('default_value')
  })
})

describe('normalizeConfig', () => {
  it('应该返回默认配置当没有输入时', () => {
    const result = normalizeConfig()
    expect(result).toEqual({
      envPath: null,
      envDir: process.cwd()
    })
  })

  it('应该处理字符串输入作为 envPath', () => {
    const result = normalizeConfig('.env.local')
    expect(result).toEqual({
      envPath: '.env.local',
      envDir: process.cwd()
    })
  })

  it('应该处理配置对象输入', () => {
    const result = normalizeConfig({
      envPath: '.env.prod',
      envDir: '/custom/dir'
    })
    expect(result).toEqual({
      envPath: '.env.prod',
      envDir: '/custom/dir'
    })
  })

  it('应该处理部分配置对象输入', () => {
    const result = normalizeConfig({
      envPath: '.env.dev'
    })
    expect(result).toEqual({
      envPath: '.env.dev',
      envDir: process.cwd()
    })
  })

  it('应该处理只有 envDir 的配置对象', () => {
    const result = normalizeConfig({
      envDir: '/custom/dir'
    })
    expect(result).toEqual({
      envPath: null,
      envDir: '/custom/dir'
    })
  })
})

// 由于 loadEnv 函数使用了动态 require，很难在测试环境中 mock
// 我们创建一个单独的集成测试文件来测试 loadEnv 的实际功能
describe.skip('loadEnv 集成测试', () => {
  // 这些测试需要真实的文件系统，建议在集成测试中运行
  // 或者创建一个专门的测试环境文件
})