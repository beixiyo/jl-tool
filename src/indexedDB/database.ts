/** defineDatabase：把声明式 schema、连接生命周期和 store / index 操作组装成一个数据库句柄 */

import { createConnection } from './connection'
import { requestToPromise, walkCursor } from './request'
import { normalizeSchema } from './schema'
import type {
  Database,
  DatabaseOptions,
  DatabaseSchema,
  IndexApi,
  IterateCallback,
  IterateOptions,
  StoreApi,
  TransactionStoreApi,
  UntypedSchema,
} from './types'

/**
 * 声明一个数据库；不会立即打开，首个操作时按声明自动建表、补索引
 *
 * @example
 * const db = defineDatabase<AppDB>({
 *   name: 'app',
 *   stores: {
 *     tasks: { keyPath: 'id', indexes: { ownerId: 'ownerId' } },
 *     settings: {},
 *   },
 * })
 * await db.store('settings').set('theme', 'dark')
 * await db.store('tasks').index('ownerId').getAll('u1')
 */
export function defineDatabase<S extends DatabaseSchema<S> = UntypedSchema>(options: DatabaseOptions<S>): Database<S> {
  const maxOpenAttempts = options.maxOpenAttempts ?? 5
  if (!Number.isSafeInteger(maxOpenAttempts) || maxOpenAttempts < 1) {
    throw new RangeError('maxOpenAttempts must be a positive safe integer')
  }

  const schema = normalizeSchema(options.stores)
  const storeNames = new Set(schema.map((store) => store.name))
  const connection = createConnection({
    name: options.name,
    schema,
    maxOpenAttempts,
    beforeOpen: options.beforeOpen,
  })
  const decode = options.decode

  function assertStore(name: string) {
    if (!storeNames.has(name)) {
      throw new TypeError(`Store "${name}" is not declared in IndexedDB database "${options.name}"`)
    }
  }

  function bindStore(transaction: IDBTransaction, name: string): TransactionStoreApi<any, any, any> {
    assertStore(name)
    return createTransactionStore(
      transaction.objectStore(name),
      decode
        ? (value) => decode(value, { store: name })
        : identity,
    )
  }

  /** 单 store 句柄：每个方法各开一个事务，读用 readonly、写用 readwrite */
  function store(name: string): StoreApi<any, any, any> {
    assertStore(name)

    const run = <T>(
      mode: IDBTransactionMode,
      work: (api: TransactionStoreApi<any, any, any>) => Promise<T>,
    ) => connection.transaction(name, mode, (transaction) => work(bindStore(transaction, name)))

    return {
      get: (key) => run('readonly', (api) => api.get(key)),
      has: (key) => run('readonly', (api) => api.has(key)),
      set: (key, value) => run('readwrite', (api) => api.set(key, value)),
      put: (value) => run('readwrite', (api) => api.put(value)),
      add: (value) => run('readwrite', (api) => api.add(value)),
      delete: (query) => run('readwrite', (api) => api.delete(query)),
      clear: () => run('readwrite', (api) => api.clear()),
      getAll: (query, count) => run('readonly', (api) => api.getAll(query, count)),
      getAllKeys: (query, count) => run('readonly', (api) => api.getAllKeys(query, count)),
      count: (query) => run('readonly', (api) => api.count(query)),
      iterate: (callback, iterateOptions) => run('readonly', (api) => api.iterate(callback, iterateOptions)),
      index: (indexName) => ({
        get: (query) => run('readonly', (api) => api.index(indexName).get(query)),
        getAll: (query, count) => run('readonly', (api) => api.index(indexName).getAll(query, count)),
        getAllKeys: (query, count) => run('readonly', (api) => api.index(indexName).getAllKeys(query, count)),
        count: (query) => run('readonly', (api) => api.index(indexName).count(query)),
        iterate: (callback, iterateOptions) => run('readonly', (api) => api.index(indexName).iterate(callback, iterateOptions)),
        deleteAll: (query) => run('readwrite', (api) => api.index(indexName).deleteAll(query)),
      }),
    }
  }

  return {
    name: options.name,
    store: store as Database<S>['store'],
    transaction: (names, mode, run) => {
      const list = typeof names === 'string'
        ? [names]
        : [...names]
      list.forEach(assertStore)

      return connection.transaction(list, mode, (transaction) =>
        run({
          store: (name) => bindStore(transaction, name),
          raw: transaction,
        }))
    },
    open: connection.open,
    close: connection.close,
  }
}

/** 绑定到某个原生 object store 的操作集合；所有请求都落在调用方的事务里 */
function createTransactionStore(
  objectStore: IDBObjectStore,
  decode: (value: unknown) => unknown,
): TransactionStoreApi<any, any, any> {
  const decodeAll = (values: unknown[]) => values.map(decode)

  return {
    raw: objectStore,
    get: async (key) => {
      const value = await requestToPromise(objectStore.get(key))
      return value === undefined
        ? undefined
        : decode(value)
    },
    has: async (key) => (await requestToPromise(objectStore.getKey(key))) !== undefined,
    set: async (key, value) => {
      await requestToPromise(objectStore.put(value, key))
    },
    put: (value) => requestToPromise(objectStore.put(value)),
    add: (value) => requestToPromise(objectStore.add(value)),
    delete: async (query) => {
      await requestToPromise(objectStore.delete(query))
    },
    clear: async () => {
      await requestToPromise(objectStore.clear())
    },
    getAll: async (query, count) => decodeAll(await requestToPromise(objectStore.getAll(query, count))),
    getAllKeys: (query, count) => requestToPromise(objectStore.getAllKeys(query, count)),
    count: (query) => requestToPromise(objectStore.count(query ?? undefined)),
    iterate: (callback, options) => iterateCursor(objectStore, decode, callback, options),
    index: (name) => createIndexApi(objectStore.index(name), decode),
  }
}

function createIndexApi(index: IDBIndex, decode: (value: unknown) => unknown): IndexApi<any> {
  return {
    get: async (query) => {
      const value = await requestToPromise(index.get(query))
      return value === undefined
        ? undefined
        : decode(value)
    },
    getAll: async (query, count) => (await requestToPromise(index.getAll(query, count))).map(decode),
    getAllKeys: (query, count) => requestToPromise(index.getAllKeys(query, count)),
    count: (query) => requestToPromise(index.count(query ?? undefined)),
    iterate: (callback, options) => iterateCursor(index, decode, callback, options),
    deleteAll: async (query) => {
      let removed = 0
      await walkCursor(index.openCursor(query), (cursor) => {
        cursor.delete()
        removed++
      })
      return removed
    },
  }
}

function iterateCursor(
  source: IDBObjectStore | IDBIndex,
  decode: (value: unknown) => unknown,
  callback: IterateCallback<any, any>,
  options: IterateOptions = {},
): Promise<void> {
  return walkCursor(
    source.openCursor(options.query ?? null, options.direction),
    (cursor) => callback(decode(cursor.value), cursor.key, cursor.primaryKey),
  )
}

function identity<T>(value: T): T {
  return value
}
