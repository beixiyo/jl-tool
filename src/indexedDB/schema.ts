/**
 * 声明式 schema 的归一化、与磁盘结构的比对和幂等升级
 *
 * 只做「补齐」：缺的 store / index 创建，定义变化的 index 重建；从不删除未声明的 store 或 index
 * 因此可以接管由其他库（如 localforage）创建的数据库而不丢数据
 */

import type { IndexDefinition, KeyPath, StoreOptions } from './types'

/** 校验并归一化用户声明的 stores，在打开数据库前尽早暴露配置错误 */
export function normalizeSchema(stores: Record<string, StoreOptions<string>>): NormalizedSchema {
  return Object.entries(stores).map(([name, options]) => {
    if (!name) throw new TypeError('Store name must not be empty')

    const indexes = Object.entries((options.indexes ?? {}) as Record<string, IndexDefinition>).map(([indexName, definition]) => {
      if (!indexName) throw new TypeError(`Index name in store "${name}" must not be empty`)

      const resolved = typeof definition === 'string' || Array.isArray(definition)
        ? { keyPath: definition }
        : definition
      return {
        name: indexName,
        keyPath: resolved.keyPath,
        unique: resolved.unique ?? false,
        multiEntry: resolved.multiEntry ?? false,
      }
    })

    return {
      name,
      keyPath: options.keyPath ?? null,
      autoIncrement: options.autoIncrement ?? false,
      indexes,
    }
  })
}

/**
 * 判断已打开的数据库是否满足声明
 *
 * @returns 需要升级时为 true；store 主键定义冲突无法通过升级修复，直接抛错
 */
export function needsUpgrade(database: IDBDatabase, schema: NormalizedSchema): boolean {
  const existing = schema.filter((store) => database.objectStoreNames.contains(store.name))
  if (existing.length !== schema.length) return true
  if (!existing.length) return false

  const transaction = database.transaction(existing.map((store) => store.name), 'readonly')
  try {
    return existing.some((store) => {
      const objectStore = transaction.objectStore(store.name)
      assertStoreCompatible(database.name, objectStore, store)
      return store.indexes.some((index) => !isIndexCurrent(objectStore, index))
    })
  }
  finally {
    // 只读检查不发请求，主动 abort 让事务立即结束，不占用后续升级
    transaction.abort()
  }
}

/** 在 versionchange 事务里补齐 store 与 index；可重复执行 */
export function applySchema(database: IDBDatabase, transaction: IDBTransaction, schema: NormalizedSchema): void {
  for (const store of schema) {
    const objectStore = database.objectStoreNames.contains(store.name)
      ? transaction.objectStore(store.name)
      : database.createObjectStore(store.name, {
        keyPath: store.keyPath,
        autoIncrement: store.autoIncrement,
      })
    assertStoreCompatible(database.name, objectStore, store)

    for (const index of store.indexes) {
      if (isIndexCurrent(objectStore, index)) continue
      if (objectStore.indexNames.contains(index.name)) objectStore.deleteIndex(index.name)

      objectStore.createIndex(index.name, index.keyPath, {
        unique: index.unique,
        multiEntry: index.multiEntry,
      })
    }
  }
}

function assertStoreCompatible(databaseName: string, objectStore: IDBObjectStore, store: NormalizedStore): void {
  if (!isSameKeyPath(objectStore.keyPath, store.keyPath) || objectStore.autoIncrement !== store.autoIncrement) {
    throw new IDBSchemaError(
      `Store "${databaseName}/${store.name}" exists with keyPath ${JSON.stringify(objectStore.keyPath)} `
        + `and autoIncrement ${objectStore.autoIncrement}, which cannot be changed to keyPath ${JSON.stringify(store.keyPath)} `
        + `and autoIncrement ${store.autoIncrement}`,
    )
  }
}

function isIndexCurrent(objectStore: IDBObjectStore, index: NormalizedIndex): boolean {
  if (!objectStore.indexNames.contains(index.name)) return false

  const current = objectStore.index(index.name)
  return isSameKeyPath(current.keyPath, index.keyPath)
    && current.unique === index.unique
    && current.multiEntry === index.multiEntry
}

function isSameKeyPath(a: string | string[] | null, b: KeyPath | null): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((part, i) => part === b[i])
  }
  return a === b
}

/** 磁盘上的结构与声明冲突且无法自动修复，例如已存在的 store 主键定义不同 */
export class IDBSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IDBSchemaError'
  }
}

export type NormalizedSchema = NormalizedStore[]

type NormalizedStore = {
  name: string
  keyPath: KeyPath | null
  autoIncrement: boolean
  indexes: NormalizedIndex[]
}

type NormalizedIndex = {
  name: string
  keyPath: KeyPath
  unique: boolean
  multiEntry: boolean
}
