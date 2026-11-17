// @vitest-environment node
/** store / index 操作、多 store 事务与 decode 钩子 */
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Database } from '@/indexedDB'
import { defineDatabase } from '@/indexedDB'

type Chunk = { id: string; ownerId: string; taskId: string; sequence: number; tags?: string[] }
type Session = { id: string; ownerId: string; title?: string }

interface TestDB {
  kv: { value: string | number | Blob | { nested: boolean }; key: string }
  chunks: { value: Chunk; key: string; indexes: 'ownerId' | 'ownerTask' | 'tag' }
  sessions: { value: Session; key: string; indexes: 'ownerId' }
  counters: { value: { name: string }; key: number }
}

let database: Database<TestDB>

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  database = defineDatabase<TestDB>({
    name: 'database-test',
    stores: {
      kv: {},
      chunks: { keyPath: 'id', indexes: { ownerId: 'ownerId', ownerTask: ['ownerId', 'taskId'], tag: { keyPath: 'tags', multiEntry: true } } },
      sessions: { keyPath: 'id', indexes: { ownerId: 'ownerId' } },
      counters: { autoIncrement: true },
    },
  })
})

afterEach(() => {
  database.close()
  vi.unstubAllGlobals()
})

const chunks: Chunk[] = [
  { id: 'c1', ownerId: 'u1', taskId: 't1', sequence: 0, tags: ['a', 'b'] },
  { id: 'c2', ownerId: 'u1', taskId: 't1', sequence: 1 },
  { id: 'c3', ownerId: 'u1', taskId: 't2', sequence: 0, tags: ['b'] },
  { id: 'c4', ownerId: 'u2', taskId: 't9', sequence: 0 },
]

async function seedChunks() {
  await database.transaction('chunks', 'readwrite', async ({ store }) => {
    for (const chunk of chunks) await store('chunks').put(chunk)
  })
}

describe('键值模式', () => {
  it('get / set / has / delete / clear / keys，不存在返回 undefined', async () => {
    const kv = database.store('kv')
    expect(await kv.get('missing')).toBeUndefined()
    expect(await kv.has('missing')).toBe(false)

    await kv.set('a', 1)
    await kv.set('b', { nested: true })
    await kv.set('a', 'overwritten')
    expect(await kv.get('a')).toBe('overwritten')
    expect(await kv.has('b')).toBe(true)
    expect(await kv.getAllKeys()).toEqual(['a', 'b'])
    expect(await kv.count()).toBe(2)

    await kv.delete('a')
    expect(await kv.getAll()).toEqual([{ nested: true }])
    await kv.clear()
    expect(await kv.count()).toBe(0)
  })

  it('主键范围：按前缀取值与删除', async () => {
    const kv = database.store('kv')
    for (const key of ['ref:1', 'ref:2', 'blob:x', 'refz']) await kv.set(key, key)
    const prefix = IDBKeyRange.bound('ref:', 'ref:￿')

    expect(await kv.getAll(prefix)).toEqual(['ref:1', 'ref:2'])
    expect(await kv.count(prefix)).toBe(2)
    await kv.delete(prefix)
    expect(await kv.getAllKeys()).toEqual(['blob:x', 'refz'])
  })

  it('原样存取 Blob', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    await database.store('kv').set('blob', blob)
    const stored = await database.store('kv').get('blob') as Blob
    expect(stored).toBeInstanceOf(Blob)
    expect(await stored.text()).toBe('hello')
  })
})

describe('记录模式与索引', () => {
  it('put 覆盖、add 冲突、自增主键', async () => {
    const sessions = database.store('sessions')
    expect(await sessions.put({ id: 's1', ownerId: 'u1' })).toBe('s1')
    await sessions.put({ id: 's1', ownerId: 'u1', title: 'renamed' })
    expect(await sessions.get('s1')).toEqual({ id: 's1', ownerId: 'u1', title: 'renamed' })
    await expect(sessions.add({ id: 's1', ownerId: 'u2' })).rejects.toMatchObject({ name: 'ConstraintError' })

    const counters = database.store('counters')
    expect(await counters.add({ name: 'first' })).toBe(1)
    expect(await counters.add({ name: 'second' })).toBe(2)
  })

  it('单字段、复合与 multiEntry 索引查询', async () => {
    await seedChunks()
    const store = database.store('chunks')
    const ids = (rows: Chunk[]) => rows.map((row) => row.id)

    expect(ids(await store.index('ownerId').getAll('u1'))).toEqual(['c1', 'c2', 'c3'])
    expect(ids(await store.index('ownerTask').getAll(['u1', 't1']))).toEqual(['c1', 'c2'])
    // 复合索引可按前缀查：['u1'] 到 ['u1', []] 覆盖 u1 的全部任务
    expect(ids(await store.index('ownerTask').getAll(IDBKeyRange.bound(['u1'], ['u1', []])))).toEqual(['c1', 'c2', 'c3'])
    expect(ids(await store.index('tag').getAll('b'))).toEqual(['c1', 'c3'])
    expect(await store.index('ownerId').count('u2')).toBe(1)
    expect(await store.index('ownerId').getAllKeys('u2')).toEqual(['c4'])
    expect((await store.index('ownerTask').get(['u1', 't2']))?.id).toBe('c3')
    expect(await store.index('ownerId').get('nobody')).toBeUndefined()
  })

  it('iterate 支持方向、范围与返回 false 提前结束', async () => {
    await seedChunks()
    const visited: string[] = []
    await database.store('chunks').index('ownerTask').iterate((chunk, key, primaryKey) => {
      visited.push(`${chunk.id}:${JSON.stringify(key)}:${String(primaryKey)}`)
    }, { query: IDBKeyRange.only(['u1', 't1']), direction: 'prev' })
    expect(visited).toEqual(['c2:["u1","t1"]:c2', 'c1:["u1","t1"]:c1'])

    const first: string[] = []
    await database.store('chunks').iterate((chunk) => {
      first.push(chunk.id)
      return first.length < 2
    })
    expect(first).toEqual(['c1', 'c2'])
  })

  it('iterate 回调抛错时拒绝并保留原错误', async () => {
    await seedChunks()
    const failure = new Error('visit failed')
    await expect(
      database.store('chunks').iterate(() => {
        throw failure
      }),
    ).rejects.toBe(failure)
  })

  it('index.deleteAll 删除命中记录并返回条数', async () => {
    await seedChunks()
    const removed = await database.store('chunks').index('ownerTask').deleteAll(IDBKeyRange.bound(['u1'], ['u1', []]))
    expect(removed).toBe(3)
    expect((await database.store('chunks').getAll()).map((chunk) => chunk.id)).toEqual(['c4'])
  })
})

describe('多 store 事务', () => {
  it('跨 store 的读改写原子提交', async () => {
    await seedChunks()
    await database.store('sessions').put({ id: 's1', ownerId: 'u1' })

    const removed = await database.transaction(['sessions', 'chunks'], 'readwrite', async ({ store }) => {
      const sessions = await store('sessions').index('ownerId').getAll('u1')
      await Promise.all(sessions.map((session) => store('sessions').delete(session.id)))
      return store('chunks').index('ownerId').deleteAll('u1')
    })

    expect(removed).toBe(3)
    expect(await database.store('sessions').count()).toBe(0)
    expect(await database.store('chunks').count()).toBe(1)
  })

  it('任一步失败时全部回滚', async () => {
    await seedChunks()
    await expect(database.transaction(['sessions', 'chunks'], 'readwrite', async ({ store }) => {
      await store('chunks').index('ownerId').deleteAll('u1')
      await store('sessions').add({ id: 's1', ownerId: 'u1' })
      await store('sessions').add({ id: 's1', ownerId: 'u1' })
    })).rejects.toMatchObject({ name: 'ConstraintError' })

    expect(await database.store('chunks').count()).toBe(4)
    expect(await database.store('sessions').count()).toBe(0)
  })

  it('并发的 readwrite 事务串行执行，读后写不会互相覆盖', async () => {
    await database.store('kv').set('count', 0)
    await Promise.all(Array.from({ length: 10 }, () =>
      database.transaction('kv', 'readwrite', async ({ store }) => {
        const current = await store('kv').get('count') as number
        await store('kv').set('count', current + 1)
      })))
    expect(await database.store('kv').get('count')).toBe(10)
  })

  it('事务中等待事务外的异步会失败且不提交', async () => {
    await expect(database.transaction('kv', 'readwrite', async ({ store }) => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      await store('kv').set('late', 1)
    })).rejects.toMatchObject({ name: expect.stringMatching(/TransactionInactiveError|InvalidStateError/) })
    expect(await database.store('kv').count()).toBe(0)
  })

  it('只读事务里写入被拒绝', async () => {
    await expect(database.transaction('kv', 'readonly', ({ store }) => store('kv').set('k', 1)))
      .rejects.toMatchObject({ name: 'ReadOnlyError' })
  })
})

describe('decode 钩子', () => {
  it('作用于 get / getAll / iterate / 索引读取，并带上 store 名；写入不经过', async () => {
    const decoded = defineDatabase<{ items: { value: { v: number; decodedBy?: string }; key: string; indexes: 'v' } }>({
      name: 'decode-test',
      stores: { items: { indexes: { v: 'v' } } },
      decode: (value, { store }) => ({ ...(value as object), decodedBy: store }),
    })
    await decoded.store('items').set('a', { v: 1 })

    expect(await decoded.store('items').get('a')).toEqual({ v: 1, decodedBy: 'items' })
    expect(await decoded.store('items').getAll()).toEqual([{ v: 1, decodedBy: 'items' }])
    expect(await decoded.store('items').index('v').get(1)).toEqual({ v: 1, decodedBy: 'items' })
    const iterated: unknown[] = []
    await decoded.store('items').iterate((value) => {
      iterated.push(value)
    })
    expect(iterated).toEqual([{ v: 1, decodedBy: 'items' }])
    expect(await decoded.store('items').get('missing')).toBeUndefined()

    const raw = await decoded.transaction('items', 'readonly', ({ raw }) =>
      new Promise((resolve) => {
        const request = raw.objectStore('items').get('a')
        request.onsuccess = () => resolve(request.result)
      }))
    expect(raw).toEqual({ v: 1 })
    decoded.close()
  })
})

describe('类型', () => {
  it('store 名、索引名与值类型由类型描述约束', () => {
    expectTypeOf(database.store('chunks').get).returns.resolves.toEqualTypeOf<Chunk | undefined>()
    expectTypeOf(database.store('chunks').index).parameter(0).toEqualTypeOf<'ownerId' | 'ownerTask' | 'tag'>()
    // @ts-expect-error 未声明的 store
    expect(() => database.store('missing')).toThrow()
    // @ts-expect-error kv 没有索引
    const invalidIndex = () => database.store('kv').index('anything')
    expect(invalidIndex).toBeTypeOf('function')
  })
})
