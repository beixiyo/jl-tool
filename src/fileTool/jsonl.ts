/**
 * @description JSONL 通用工具函数
 */

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
