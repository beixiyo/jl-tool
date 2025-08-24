/**
 * 设置 LocalStorage，默认自动转 JSON
 * @param key 存储键
 * @param value 存储值
 * @param autoToJSON 是否自动 JSON.stringify，默认 true
 * @param storage 存储对象，默认 localStorage
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
      ? JSON.stringify(value)
      : value,
  )
}
/**
 * 获取 LocalStorage，默认自动解析 JSON。'undefined' 字符串会被转成 null
 * @param key 存储键
 * @param autoParseJSON 是否自动 JSON.parse，默认 true
 * @param storage 存储对象，默认 localStorage
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
