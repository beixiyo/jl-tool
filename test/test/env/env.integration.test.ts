// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv } from '#/env'

describe('loadEnv 集成测试', () => {
  const testDir = join(process.cwd(), 'test-temp')
  const testEnvFile = join(testDir, '.env')
  const testEnvDevFile = join(testDir, '.env.development')
  const originalEnv = process.env
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    // 创建测试目录
    if (!existsSync(testDir)) {
      require('node:fs').mkdirSync(testDir, { recursive: true })
    }

    // 重置环境变量
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // 清理测试文件
    try {
      if (existsSync(testEnvFile)) unlinkSync(testEnvFile)
      if (existsSync(testEnvDevFile)) unlinkSync(testEnvDevFile)
      if (existsSync(testDir)) require('node:fs').rmdirSync(testDir)
    } catch (error) {
      // 忽略清理错误
    }

    // 恢复环境变量
    process.env = originalEnv
    process.env.NODE_ENV = originalNodeEnv
  })

  it('应该成功加载 .env 文件', () => {
    const envContent = `
# 这是注释
KEY1=value1
KEY2=value2
KEY3=value with spaces
KEY4=value=with=equals
`
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envPath: testEnvFile })

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    expect(process.env.KEY3).toBe('value with spaces')
    expect(process.env.KEY4).toBe('value=with=equals')
  })

  it('应该忽略注释和空行', () => {
    const envContent = `
# 这是注释
KEY1=value1

   # 另一个注释
KEY2=value2

`
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envPath: testEnvFile })

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    expect(Object.keys(process.env).filter(key => key.startsWith('KEY'))).toHaveLength(2)
  })

  it('应该处理格式不正确的行', () => {
    const envContent = `
KEY1=value1
INVALID_LINE_WITHOUT_EQUALS
KEY2=value2
=VALUE_WITHOUT_KEY
KEY3=
`
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envPath: testEnvFile })

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    // KEY3 应该被忽略因为值为空
    expect(process.env.KEY3).toBeUndefined()
    // 无效行应该被忽略
    expect(process.env.INVALID_LINE_WITHOUT_EQUALS).toBeUndefined()
  })

  it('应该正确处理带有空格的键值', () => {
    const envContent = `
  KEY1  =  value1
KEY2=value2
`
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envPath: testEnvFile })

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
  })

  it('应该正确解析引号内容', () => {
    const envContent = `
  KEY1  =  'value1'
  KEY2="value2"
KEY3=value3
 KEY4=' value4"
   KEY5=  value5
`
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envPath: testEnvFile })

    expect(process.env.KEY1).toBe('value1')
    expect(process.env.KEY2).toBe('value2')
    expect(process.env.KEY3).toBe('value3')
    expect(process.env.KEY4).toBe(`' value4"`)
    expect(process.env.KEY5).toBe('value5')
  })

  it('应该支持配置对象参数', () => {
    const envContent = 'KEY1=value1'
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envPath: '.env', envDir: testDir })

    expect(process.env.KEY1).toBe('value1')
  })

  it('应该支持绝对路径', () => {
    const envContent = 'KEY1=value1'
    writeFileSync(testEnvFile, envContent)

    loadEnv(testEnvFile)

    expect(process.env.KEY1).toBe('value1')
  })

  it('应该根据 NODE_ENV 自动选择文件', () => {
    process.env.NODE_ENV = 'development'

    const envContent = 'KEY1=dev_value'
    writeFileSync(testEnvDevFile, envContent)

    loadEnv({ envDir: testDir })

    expect(process.env.KEY1).toBe('dev_value')
  })

  it('应该在环境特定文件不存在时回退到默认文件', () => {
    process.env.NODE_ENV = 'production'

    const envContent = 'KEY1=default_value'
    writeFileSync(testEnvFile, envContent)

    loadEnv({ envDir: testDir })

    expect(process.env.KEY1).toBe('default_value')
  })

  it('应该处理不存在的文件', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    loadEnv({ envPath: 'nonexistent.env', envDir: testDir })

    // 当文件不存在时，应该没有输出任何日志
    expect(consoleSpy).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
