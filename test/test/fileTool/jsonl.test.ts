import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  appendToJsonlFile,
  everyWithJsonlFile,
  filterJsonlFile,
  findIndexWithJsonlFile,
  findWithJsonlFile,
  jsonlToJson,
  jsonToJsonl,
  mapJsonlFile,
  readJsonlFile,
  someWithJsonlFile,
} from '@/fileTool/jsonl'

/** 创建临时测试目录 */
const testDir = join(__dirname, 'temp')
const testFile = join(testDir, 'test.jsonl')

/** 测试数据 */
const testData = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
]

/** 模拟 shared 模块，使 checkIsBrowser 返回 false */
vi.mock('@/shared', async () => {
  const actual = await vi.importActual('@/shared')
  return {
    ...actual,
    checkIsBrowser: () => false,
  }
})

describe('jSONL 工具函数测试', () => {
  /** 在所有测试之前创建测试目录 */
  beforeAll(async () => {
    try {
      await fs.mkdir(testDir, { recursive: true })
    }
    catch (error) {
      /** 目录可能已存在 */
    }
  })

  /** 在每个测试之前清理测试文件 */
  beforeEach(async () => {
    try {
      await fs.unlink(testFile)
    }
    catch (error) {
      /** 文件可能不存在 */
    }
  })

  /** 在所有测试之后清理测试目录 */
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    }
    catch (error) {
      /** 目录可能已被删除 */
    }
  })

  describe('jsonToJsonl', () => {
    it('应该将 JSON 对象数组转换为 JSONL 字符串', () => {
      const result = jsonToJsonl(testData)
      const expected = '{"id":1,"name":"Alice","age":30}\n{"id":2,"name":"Bob","age":25}\n{"id":3,"name":"Charlie","age":35}'
      expect(result).toBe(expected)
    })

    it('应该处理空数组', () => {
      const result = jsonToJsonl([])
      expect(result).toBe('')
    })
  })

  describe('jsonlToJson', () => {
    it('应该将 JSONL 字符串转换为 JSON 对象数组', () => {
      const jsonlString = '{"id":1,"name":"Alice","age":30}\n{"id":2,"name":"Bob","age":25}\n{"id":3,"name":"Charlie","age":35}'
      const result = jsonlToJson(jsonlString)
      expect(result).toEqual(testData)
    })

    it('应该过滤空行', () => {
      const jsonlString = '{"id":1,"name":"Alice","age":30}\n\n{"id":2,"name":"Bob","age":25}\n \n{"id":3,"name":"Charlie","age":35}'
      const result = jsonlToJson(jsonlString)
      expect(result).toEqual(testData)
    })

    it('应该处理空字符串', () => {
      const result = jsonlToJson('')
      expect(result).toEqual([])
    })
  })

  describe('readJsonlFile', () => {
    it('应该逐行读取 JSONL 文件', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      console.log('Writing to file:', testFile)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 验证文件是否写入成功 */
      const content = await fs.readFile(testFile, 'utf-8')
      console.log('File content:', content)

      /** 读取并验证结果 */
      const result = []
      for await (const obj of readJsonlFile(testFile)) {
        result.push(obj)
      }
      console.log('Read result:', result)
      expect(result).toEqual(testData)
    })

    it('应该过滤空行', async () => {
      /** 准备包含空行的测试文件 */
      const jsonlString = '{"id":1,"name":"Alice","age":30}\n\n{"id":2,"name":"Bob","age":25}\n \n{"id":3,"name":"Charlie","age":35}'
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 读取并验证结果 */
      const result = []
      for await (const obj of readJsonlFile(testFile)) {
        result.push(obj)
      }
      expect(result).toEqual(testData)
    })
  })

  describe('appendToJsonlFile', () => {
    it('应该将 JSON 对象数组追加到 JSONL 文件', async () => {
      /** 首次写入 */
      console.log('Writing to file:', testFile)
      await appendToJsonlFile([testData[0], testData[1]], testFile)

      /** 追加更多数据 */
      await appendToJsonlFile([testData[2]], testFile)

      /** 验证结果 */
      const content = await fs.readFile(testFile, 'utf-8')
      const expected = '{"id":1,"name":"Alice","age":30}\n{"id":2,"name":"Bob","age":25}\n{"id":3,"name":"Charlie","age":35}'
      expect(content).toBe(expected)
    })

    it('应该自动创建不存在的目录和文件', async () => {
      const newFile = join(testDir, 'new-dir', 'new-file.jsonl')

      /** 确保目录和文件不存在 */
      try {
        await fs.rm(join(testDir, 'new-dir'), { recursive: true, force: true })
      }
      catch (error) {
        /** 目录可能不存在 */
      }

      /** 写入数据 */
      await appendToJsonlFile(testData, newFile)

      /** 验证文件已创建并包含正确内容 */
      const content = await fs.readFile(newFile, 'utf-8')
      const expected = jsonToJsonl(testData)
      expect(content).toBe(expected)
    })
  })

  describe('mapJsonlFile', () => {
    it('应该对 JSONL 文件中的每一行应用映射函数', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 应用映射函数 */
      const result = await mapJsonlFile(testFile, (obj: typeof testData[0]) => ({
        id: obj.id,
        name: obj.name,
      }))

      /** 验证结果 */
      const expected = testData.map(obj => ({
        id: obj.id,
        name: obj.name,
      }))
      expect(result).toEqual(expected)
    })
  })

  describe('filterJsonlFile', () => {
    it('应该对 JSONL 文件中的每一行应用过滤函数', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 应用过滤函数 */
      const result = await filterJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 30)

      /** 验证结果 */
      const expected = testData.filter(obj => obj.age > 30)
      expect(result).toEqual(expected)
    })
  })

  describe('findWithJsonlFile', () => {
    it('应该在 JSONL 文件中查找第一个满足条件的对象', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 查找对象 */
      const result = await findWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 30)

      /** 验证结果 */
      const expected = testData.find(obj => obj.age > 30)
      expect(result).toEqual(expected)
    })

    it('如果没有找到满足条件的对象，应该返回 undefined', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 查找不存在的对象 */
      const result = await findWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 50)

      /** 验证结果 */
      expect(result).toBeUndefined()
    })
  })

  describe('findIndexWithJsonlFile', () => {
    it('应该在 JSONL 文件中查找第一个满足条件的对象的索引', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 查找索引 */
      const result = await findIndexWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 30)

      /** 验证结果 */
      const expected = testData.findIndex(obj => obj.age > 30)
      expect(result).toBe(expected)
    })

    it('如果没有找到满足条件的对象，应该返回 -1', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 查找不存在的对象的索引 */
      const result = await findIndexWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 50)

      /** 验证结果 */
      expect(result).toBe(-1)
    })
  })

  describe('everyWithJsonlFile', () => {
    it('应该检查 JSONL 文件中是否所有对象都满足条件', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 检查所有对象是否都满足条件 */
      const result1 = await everyWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 20)
      expect(result1).toBe(true)

      const result2 = await everyWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 30)
      expect(result2).toBe(false)
    })
  })

  describe('someWithJsonlFile', () => {
    it('应该检查 JSONL 文件中是否存在满足条件的对象', async () => {
      /** 准备测试文件 */
      const jsonlString = jsonToJsonl(testData)
      await fs.writeFile(testFile, jsonlString, 'utf-8')

      /** 检查是否存在满足条件的对象 */
      const result1 = await someWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 30)
      expect(result1).toBe(true)

      const result2 = await someWithJsonlFile(testFile, (obj: typeof testData[0]) => obj.age > 50)
      expect(result2).toBe(false)
    })
  })
})
