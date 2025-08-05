import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEnv, loadEnv } from '@/env'

// Mock fs 模块
vi.mock('node:fs')
const mockFs = vi.mocked(fs)

// Mock isNode 常量，让它在测试中返回 true
vi.mock('@/constants', () => ({
  isNode: true,
}))

// Mock console 方法
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

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

describe('loadEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    /** 重置环境变量 */
    process.env = {}
  })

  it('应该成功加载 .env 文件', () => {
    const envContent = `
# 这是注释
KEY1=value1
KEY2=value2
KEY3=value with spaces
KEY4=value=with=equals
`
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(envContent)

    loadEnv('.env')

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    expect(process.env.KEY3).toBe('value with spaces')
    expect(process.env.KEY4).toBe('value=with=equals')
    expect(mockConsoleLog).toHaveBeenCalledWith('[loadEnv]: 已加载 .env')
  })

  it('应该忽略注释和空行', () => {
    const envContent = `
# 这是注释
KEY1=value1

   # 另一个注释
KEY2=value2

`
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(envContent)

    loadEnv('.env')

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    expect(Object.keys(process.env)).toHaveLength(2)
  })

  it('应该处理不存在的文件', () => {
    mockFs.existsSync.mockReturnValue(false)

    loadEnv('.env')

    expect(mockFs.readFileSync).not.toHaveBeenCalled()
    expect(mockConsoleLog).not.toHaveBeenCalled()
  })

  it('应该处理文件读取错误', () => {
    const error = new Error('文件读取失败')
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockImplementation(() => {
      throw error
    })

    loadEnv('.env')

    expect(mockConsoleError).toHaveBeenCalledWith('加载 .env 文件失败:', error)
  })

  it('应该处理格式不正确的行', () => {
    const envContent = `
KEY1=value1
INVALID_LINE_WITHOUT_EQUALS
KEY2=value2
=VALUE_WITHOUT_KEY
KEY3=
`
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(envContent)

    loadEnv('.env')

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    // KEY3 应该被忽略因为值为空
    expect(process.env.KEY3).toBeUndefined()
    /** 无效行应该被忽略 */
    expect(process.env.INVALID_LINE_WITHOUT_EQUALS).toBeUndefined()
  })

  it('应该正确处理带有空格的键值', () => {
    const envContent = `
  KEY1  =  value1
KEY2=value2
`
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(envContent)

    loadEnv('.env')

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
  })
})
