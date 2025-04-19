import { describe, it, expect } from 'vitest'
import { StreamJsonParser } from '@/tools/StreamJsonParser'

describe('StreamJsonParser', () => {

  it('应该能解析完整的 JSON', () => {
    const parser = new StreamJsonParser()
    const json = '{"name": "张三", "age": 18, "address": "北京市海淀区"}'

    const result = parser.append(json)

    expect(result).not.toBeNull()
    expect(result.name).toBe('张三')
    expect(result.age).toBe(18)
    expect(result.address).toBe('北京市海淀区')
  })

  it('应该能处理分块接收的 JSON', () => {
    const parser = new StreamJsonParser()

    // 第一块
    let result = parser.append('{"name": "李四", ')
    expect(result).toBeNull()

    // 第二块
    result = parser.append('"age": 25, ')
    expect(result).toBeNull()

    // 第三块 (完成 JSON)
    result = parser.append('"city": "上海"}')
    expect(result).not.toBeNull()
    expect(result.name).toBe('李四')
    expect(result.age).toBe(25)
    expect(result.city).toBe('上海')
  })

  it('应该能修复并解析不完整的 JSON', () => {
    const parser = new StreamJsonParser()

    // 不完整的 JSON
    const json = '{"name": "张三", "age": 18, "address": "北京市海'

    const result = parser.append(json)
    expect(result).not.toBeNull()
    expect(result.name).toBe('张三')
    expect(result.age).toBe(18)
    expect(result.address).toBe('北京市海')
  })

  it('应该能处理嵌套的 JSON', () => {
    const parser = new StreamJsonParser()

    // 第一块
    let result = parser.append('{"user": {"name": "王五", "contacts": [{"type": "email", "value": "wang@example.com"}, {"type": ')
    expect(result).toBeNull()

    // 第二块 (完成 JSON)
    result = parser.append('"phone", "value": "12345678"}]}, "status": "active"}')
    expect(result).not.toBeNull()
    expect(result.user.name).toBe('王五')
    expect(result.user.contacts.length).toBe(2)
    expect(result.status).toBe('active')
  })

  it('应该能处理数组 JSON', () => {
    const parser = new StreamJsonParser()

    // 不完整的数组 JSON
    const json = '[{"id": 1, "name": "产品1"}, {"id": 2, "name": "产品2"}, {"id": 3, "name": "产品'

    const result = parser.append(json)
    expect(result).not.toBeNull()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(3)
    expect(result[2].id).toBe(3)
  })

  it('应该能正确处理缓冲区', () => {
    const parser = new StreamJsonParser()

    // 添加不完整的 JSON
    parser.append('{"test": "value')

    // 检查缓冲区
    expect(parser.getBuffer()).toBe('{"test": "value')

    // 清空缓冲区
    parser.clear()
    expect(parser.getBuffer()).toBe('')
  })

  it('应该能处理非 JSON 开头的数据', () => {
    const parser = new StreamJsonParser()

    // 非 JSON 开头的数据
    const result = parser.append('这不是 JSON 数据')

    expect(result).toBeNull()
  })
})