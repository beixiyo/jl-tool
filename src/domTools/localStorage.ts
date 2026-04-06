import { isStr } from '@/shared/is'

/**
 * 写入 `Storage`（默认 `localStorage`）
 * @param key 存储键
 * @param value 存储值；`autoToJSON === true` 时：`string` 原样写入，其余类型走 `JSON.stringify`
 * @param autoToJSON 为 `false` 时第二个参数原样交给 `setItem`（需为可被存储的字符串，见 MDN）
 * @param storage 存储对象，默认 `localStorage`，可传 `sessionStorage`
 *
 * @example
 * ```ts
 * setLocalStorage('user', { id: 1, name: 'Ada' })
 * setLocalStorage('token', 'eyJhbGc...') // 字符串不再包一层 JSON 引号
 * setLocalStorage('legacy', '[1,2]', false)
 * ```
 */
export function setLocalStorage(
  key: string,
  value: any,
  autoToJSON = true,
  storage: Storage = localStorage,
) {
  return storage.setItem(
    key,
    autoToJSON
      ? isStr(value)
        ? value
        : JSON.stringify(value)
      : value,
  )
}

/**
 * 读取 `Storage`（默认 `localStorage`），默认对取值做 `JSON.parse`
 * @param key 存储键
 * @param autoParseJSON 为 `false` 时返回原始字符串（类型仍为 `T | null`）
 * @param storage 存储对象，默认 `localStorage`
 * @returns 解析后的值；无键或存的是字面量 `'undefined'` 时返回 `null`
 *
 * @example
 * ```ts
 * type User = { id: number }
 * const user = getLocalStorage<User>('user')
 * const token = getLocalStorage<string>('token', false)
 * ```
 */
export function getLocalStorage<T>(
  key: string,
  autoParseJSON = true,
  storage: Storage = localStorage,
): T | null {
  const item = storage.getItem(key)
  if (item === 'undefined') {
    return null
  }

  return autoParseJSON
    // @ts-ignore
    ? JSON.parse(item) as T
    : (item as T)
}
