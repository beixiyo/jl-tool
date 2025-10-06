/**
 * @description JSONL 文件操作工具
 */

import { createRequire } from 'node:module'
import { checkIsBrowser } from '@/shared'

/**
 * 将 JSON 对象数组转换为 JSONL 字符串
 *
 * @example
 * ```ts
 * const jsonl = jsonToJsonl([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }])
 * console.log(jsonl)
 * // 输出: '{"id":1,"name":"John"}\n{"id":2,"name":"Jane"}'
 * ```
 *
 * @param jsonArray JSON 对象数组
 * @returns JSONL 字符串
 */
export function jsonToJsonl(jsonArray: any[]): string {
  return jsonArray
    .map(obj => JSON.stringify(obj))
    .join('\n')
    + (
      jsonArray.length > 0
        ? '\n'
        : ''
    )
}

/**
 * 将 JSONL 字符串转换为 JSON 对象数组
 *
 * @example
 * ```ts
 * const jsonl = '{"id":1,"name":"John"}\n{"id":2,"name":"Jane"}'
 * const json = jsonlToJson(jsonl)
 * console.log(json)
 * // 输出: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
 * ```
 *
 * @param jsonlString JSONL 字符串
 * @returns JSON 对象数组
 */
export function jsonlToJson<T>(jsonlString: string): T[] {
  return jsonlString
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line))
}

/**
 * 逐行读取 JSONL 文件的生成器函数
 *
 * 注意：为了确保文件资源被正确释放，请使用 `for await...of` 循环消费返回的迭代器。
 * 如果创建了迭代器但没有消费它，需要手动调用迭代器的 `return()` 方法来释放资源。
 *
 * @example
 * ```ts
 * for await (const obj of readJsonlFile('path/to/file.jsonl')) {
 *   console.log(obj) // 被解析的每一行 JSON 对象
 * }
 * ```
 *
 * @param filePath JSONL 文件路径
 * @yields 每一行被解析的 JSON 对象
 */
export async function* readJsonlFile<T>(filePath: string): AsyncGenerator<T, void, undefined> {
  if (checkIsBrowser()) {
    return
  }

  /** 使用 createRequire 以兼容 ESM 和 CJS 模式 */
  let fs: typeof import('node:fs')
  let readline: typeof import('node:readline')

  if (typeof require !== 'undefined') {
    // CJS 环境，直接使用 require
    fs = require('node:fs') as typeof import('node:fs')
    readline = require('node:readline') as typeof import('node:readline')
  }
  else {
    // ESM 环境，使用 createRequire 创建 require 函数
    const require = createRequire(import.meta.url)
    fs = require('node:fs') as typeof import('node:fs')
    readline = require('node:readline') as typeof import('node:readline')
  }

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  try {
    for await (const line of rl) {
      if (line.trim() !== '') {
        yield JSON.parse(line)
      }
    }
  }
  finally {
    rl.close()
    fileStream.destroy()
  }
}

/**
 * 将 JSON 对象数组推入 JSONL 文件，并自动创建潜在的不存在的文件
 * @param jsonArray JSON 对象数组
 * @param filePath 输出文件路径
 */
export async function appendToJsonlFile(jsonArray: any[], filePath: string): Promise<void> {
  if (checkIsBrowser()) {
    return
  }

  /** 使用 createRequire 以兼容 ESM 和 CJS 模式 */
  let fsPromises: typeof import('node:fs/promises')
  let fs: typeof import('node:fs')
  let path: typeof import('node:path')

  if (typeof require !== 'undefined') {
    // CJS 环境，直接使用 require
    fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
    fs = require('node:fs') as typeof import('node:fs')
    path = require('node:path') as typeof import('node:path')
  }
  else {
    // ESM 环境，使用 createRequire 创建 require 函数
    const require = createRequire(import.meta.url)
    fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
    fs = require('node:fs') as typeof import('node:fs')
    path = require('node:path') as typeof import('node:path')
  }

  const { appendFile, mkdir, readFile, writeFile } = fsPromises
  const { existsSync } = fs
  const { dirname } = path

  const dirPath = dirname(filePath)
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
  if (!existsSync(filePath)) {
    await writeFile(filePath, '', 'utf-8')
  }

  const jsonlString = jsonToJsonl(jsonArray)

  /** 检查文件末尾是否已经有换行符 */
  const fileContent = await readFile(filePath, 'utf-8')
  const needsNewLine = fileContent.length > 0 && !fileContent.endsWith('\n')

  /** 添加换行符（如果需要） */
  const prefix = needsNewLine
    ? '\n'
    : ''

  await appendFile(filePath, prefix + jsonlString, 'utf-8')
}

/**
 * 对 JSONL 文件中的每一行应用 map 函数
 * @param filePath JSONL 文件路径
 * @param mapper 映射函数
 * @returns 映射后的 JSONL 字符串
 */
export async function mapJsonlFile<T, R>(filePath: string, mapper: (obj: T) => R): Promise<R[]> {
  if (checkIsBrowser()) {
    return []
  }

  const result: R[] = []
  for await (const obj of readJsonlFile<T>(filePath)) {
    result.push(mapper(obj))
  }
  return result
}

/**
 * 对 JSONL 文件中的每一行应用 filter 函数
 * @param filePath JSONL 文件路径
 * @param predicate 过滤函数
 * @returns 过滤后的 JSONL 字符串
 */
export async function filterJsonlFile<T>(filePath: string, predicate: (obj: T) => boolean): Promise<T[]> {
  if (checkIsBrowser()) {
    return []
  }

  const result: T[] = []
  for await (const obj of readJsonlFile<T>(filePath)) {
    if (predicate(obj)) {
      result.push(obj)
    }
  }
  return result
}

/**
 * 在 JSONL 文件中查找第一个满足条件的对象
 * @param filePath JSONL 文件路径
 * @param predicate 过滤函数
 * @returns 第一个满足条件的对象
 */
export async function findWithJsonlFile<T>(filePath: string, predicate: (obj: T) => boolean): Promise<T | undefined> {
  if (checkIsBrowser()) {
    return undefined
  }

  for await (const obj of readJsonlFile<T>(filePath)) {
    if (predicate(obj)) {
      return obj
    }
  }
}

/**
 * 在 JSONL 文件中查找第一个满足条件的对象的索引
 * @param filePath JSONL 文件路径
 * @param predicate 过滤函数
 * @returns 第一个满足条件的对象的索引
 */
export async function findIndexWithJsonlFile<T>(filePath: string, predicate: (obj: T) => boolean): Promise<number> {
  if (checkIsBrowser()) {
    return -1
  }

  let index = 0
  for await (const obj of readJsonlFile<T>(filePath)) {
    if (predicate(obj)) {
      return index
    }
    index++
  }
  return -1
}

/**
 * 在 JSONL 文件中判断是否所有对象都满足条件
 * @param filePath JSONL 文件路径
 * @param predicate 过滤函数
 * @returns 所有满足条件的对象
 */
export async function everyWithJsonlFile<T>(filePath: string, predicate: (obj: T) => boolean): Promise<boolean> {
  if (checkIsBrowser()) {
    return false
  }

  for await (const obj of readJsonlFile<T>(filePath)) {
    if (!predicate(obj)) {
      return false
    }
  }
  return true
}

/**
 * 在 JSONL 文件中判断是否存在满足条件的对象
 * @param filePath JSONL 文件路径
 * @param predicate 过滤函数
 * @returns 是否存在满足条件的对象
 */
export async function someWithJsonlFile<T>(filePath: string, predicate: (obj: T) => boolean): Promise<boolean> {
  if (checkIsBrowser()) {
    return false
  }

  for await (const obj of readJsonlFile<T>(filePath)) {
    if (predicate(obj)) {
      return true
    }
  }
  return false
}
