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
 * @remarks
 * 与 {@link setLocalStorage} 配套：后者对 `string` 原样写入（不包 JSON 引号），
 * 因此读取裸字符串（如 `'-created_time'`、空串、普通文本）时 `JSON.parse` 会抛错，
 * 此时**退回原始字符串**，保证字符串能正确往返、且不会因脏数据崩溃。
 *
 * 注意：因字符串原样存储，长得像 JSON 的字符串（如 `'123'`、`'true'`）读取时会被
 * `JSON.parse` 解析成对应类型（`number` / `boolean`）。若需严格保持字符串类型，
 * 读取时传 `autoParseJSON = false`。
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
  if (item === null || item === 'undefined') {
    return null
  }

  if (!autoParseJSON) {
    return item as T
  }

  try {
    return JSON.parse(item) as T
  }
  catch {
    return item as T
  }
}
