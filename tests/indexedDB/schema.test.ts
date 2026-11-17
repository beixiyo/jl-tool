// @vitest-environment node
/** schema 声明与磁盘结构的比对、补齐和冲突处理 */
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Database, DatabaseOptions } from '@/indexedDB'
import { defineDatabase, IDBSchemaError, requestToPromise } from '@/indexedDB'

let factory: IDBFactory
const databases: Database<any>[] = []

beforeEach(() => {
  factory = new IDBFactory()
  vi.stubGlobal('indexedDB', factory)
})

afterEach(() => {
  for (const database of databases.splice(0)) database.close()
  vi.unstubAllGlobals()
})

function define(options: DatabaseOptions<any>) {
  const database = defineDatabase(options)
  databases.push(database)
  return database
}

async function inspect(name: string) {
  const database = await requestToPromise(factory.open(name))
  const stores = [...database.objectStoreNames]
  const transaction = database.transaction(stores, 'readonly')
  const result = {
    version: database.version,
    stores: Object.fromEntries(stores.map((store) => {
      const objectStore = transaction.objectStore(store)
      return [store, {
        keyPath: objectStore.keyPath,
        indexes: Object.fromEntries([...objectStore.indexNames].map((index) => {
          const definition = objectStore.index(index)
          return [index, { keyPath: definition.keyPath, unique: definition.unique, multiEntry: definition.multiEntry }]
        })),
      }]
    })),
  }
  database.close()
  return result
}

describe('schema 自动升级', () => {
  it('新库一次建好全部 store 与索引', async () => {
    await define({
      name: 'fresh',
      stores: {
        kv: {},
        records: { keyPath: 'id', indexes: { ownerId: 'ownerId', ownerTask: ['ownerId', 'taskId'], tag: { keyPath: 'tags', multiEntry: true } } },
        meta: { keyPath: 'key', autoIncrement: false, indexes: { code: { keyPath: 'code', unique: true } } },
      },
    }).open()

    expect(await inspect('fresh')).toEqual({
      version: 1,
      stores: {
        kv: { keyPath: null, indexes: {} },
        records: {
          keyPath: 'id',
          indexes: {
            ownerId: { keyPath: 'ownerId', unique: false, multiEntry: false },
            ownerTask: { keyPath: ['ownerId', 'taskId'], unique: false, multiEntry: false },
            tag: { keyPath: 'tags', unique: false, multiEntry: true },
          },
        },
        meta: { keyPath: 'key', indexes: { code: { keyPath: 'code', unique: true, multiEntry: false } } },
      },
    })
  })

  it('已满足声明时不升级；缺 store / 缺索引时升一个版本补齐，已有数据保留', async () => {
    const v1 = define({ name: 'grow', stores: { records: { keyPath: 'id' } } })
    await v1.store('records').put({ id: 'a', ownerId: 'u1' })
    await v1.store('records').put({ id: 'b', ownerId: 'u2' })
    v1.close()

    const same = define({ name: 'grow', stores: { records: { keyPath: 'id' } } })
    expect((await same.open()).version).toBe(1)
    same.close()

    const v2 = define({ name: 'grow', stores: { records: { keyPath: 'id', indexes: { ownerId: 'ownerId' } }, extra: {} } })
    expect((await v2.open()).version).toBe(2)
    // 新建索引会回填已有记录
    expect(await v2.store('records').index('ownerId').getAll('u1')).toEqual([{ id: 'a', ownerId: 'u1' }])
  })

  it('索引定义变化时重建；未声明的 store 与索引从不删除', async () => {
    const before = define({
      name: 'evolve',
      stores: {
        records: { keyPath: 'id', indexes: { ownerId: 'ownerId', legacy: 'legacy' } },
        orphan: {},
      },
    })
    await before.store('orphan').set('k', 'kept')
    before.close()

    const after = define({
      name: 'evolve',
      stores: { records: { keyPath: 'id', indexes: { ownerId: { keyPath: 'ownerId', unique: true } } } },
    })
    await after.open()
    after.close()

    const snapshot = await inspect('evolve')
    expect(snapshot.version).toBe(2)
    expect(snapshot.stores.records.indexes).toEqual({
      ownerId: { keyPath: 'ownerId', unique: true, multiEntry: false },
      legacy: { keyPath: 'legacy', unique: false, multiEntry: false },
    })
    expect(Object.keys(snapshot.stores)).toContain('orphan')
    const raw = await requestToPromise(factory.open('evolve'))
    expect(await requestToPromise(raw.transaction('orphan').objectStore('orphan').get('k'))).toBe('kept')
    raw.close()
  })

  it('已存在 store 的主键定义不同则抛 IDBSchemaError，且不留下连接阻塞后续升级', async () => {
    await define({ name: 'conflict', stores: { records: { keyPath: 'id' } } }).open()
    databases.splice(0).forEach((database) => database.close())

    const conflicting = define({ name: 'conflict', stores: { records: { keyPath: 'uuid' } } })
    await expect(conflicting.open()).rejects.toBeInstanceOf(IDBSchemaError)

    // 若冲突检查泄漏了连接，这次升级会被阻塞
    const other = define({ name: 'conflict', stores: { records: { keyPath: 'id' }, more: {} } })
    expect((await other.open()).version).toBe(2)
  })

  it('索引补齐失败（唯一约束被已有数据违反）时整轮升级回滚', async () => {
    const v1 = define({ name: 'unique', stores: { records: { keyPath: 'id' } } })
    await v1.store('records').put({ id: 'a', email: 'same' })
    await v1.store('records').put({ id: 'b', email: 'same' })
    v1.close()

    const v2 = define({ name: 'unique', stores: { records: { keyPath: 'id', indexes: { email: { keyPath: 'email', unique: true } } }, added: {} } })
    await expect(v2.open()).rejects.toMatchObject({ name: 'ConstraintError' })
    v2.close()
    const snapshot = await inspect('unique')
    expect(snapshot.version).toBe(1)
    expect(Object.keys(snapshot.stores)).toEqual(['records'])
  })

  it('两个声明不同的实例交替打开同一个库时都能收敛到各自所需结构', async () => {
    const a = define({ name: 'shared', stores: { a: {} } })
    const b = define({ name: 'shared', stores: { b: {} } })
    await a.store('a').set('k', 1)
    await b.store('b').set('k', 2)
    await a.store('a').set('k2', 3)

    expect(await a.store('a').getAll()).toEqual([1, 3])
    expect(await b.store('b').getAll()).toEqual([2])
    expect(Object.keys((await inspect('shared')).stores).sort()).toEqual(['a', 'b'])
  })

  it('声明非法或访问未声明的 store 时同步报错', () => {
    expect(() => defineDatabase({ name: 'bad', stores: { '': {} } })).toThrow(TypeError)
    const database = define({ name: 'declared', stores: { records: {} } })
    expect(() => database.store('missing')).toThrow('not declared')
    expect(() => database.transaction(['records', 'missing'], 'readonly', () => {})).toThrow('not declared')
  })
})
