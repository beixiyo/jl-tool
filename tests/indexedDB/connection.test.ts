// @vitest-environment node
/** 连接与事务的行为回归：提交、回滚、失败重开以及连接代际隔离 */
import { forceCloseDatabase, IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Database, DatabaseOptions } from '@/indexedDB'
import { defineDatabase, requestToPromise } from '@/indexedDB'

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

function createDatabase(options: Partial<DatabaseOptions<any>> = {}) {
  const database = defineDatabase({
    name: 'connection-test',
    stores: { records: {} },
    ...options,
  })
  databases.push(database)
  return database
}

function readAll(database: Database<any>) {
  return database.store('records').getAll()
}

describe('连接与事务', () => {
  it('并发升级冲突按配置次数重试，耗尽后允许下次重新打开', async () => {
    const raw = await requestToPromise(factory.open('connection-test'))
    raw.close()
    const nativeOpen = factory.open.bind(factory)
    let conflicts = 0
    const spy = vi.spyOn(factory, 'open').mockImplementation((name, version) => {
      if (version !== undefined) {
        conflicts++
        throw new DOMException('版本冲突', 'VersionError')
      }
      return nativeOpen(name)
    })
    const database = createDatabase({ maxOpenAttempts: 2 })
    await expect(database.open()).rejects.toThrow('after 2 attempts')
    expect(conflicts).toBe(2)
    spy.mockRestore()
    expect((await database.open()).objectStoreNames.contains('records')).toBe(true)
  })

  it('拒绝无效的打开尝试次数', () => {
    for (const maxOpenAttempts of [0, -1, 1.5, Infinity, NaN]) {
      expect(() => createDatabase({ maxOpenAttempts })).toThrow(RangeError)
    }
  })

  it('延迟打开、并发 open 共享同一轮，写入在事务提交后才算成功', async () => {
    const open = vi.spyOn(factory, 'open')
    const database = createDatabase()
    expect(open).not.toHaveBeenCalled()
    const first = database.open()
    expect(database.open()).toBe(first)
    await first
    // 新库：一次不带版本的 open 在 upgradeneeded(0 → 1) 里建好结构
    expect(open).toHaveBeenCalledTimes(1)

    let committed = false
    const result = await database.transaction('records', 'readwrite', async ({ store, raw }) => {
      raw.addEventListener('complete', () => committed = true)
      await store('records').set('key', 'saved')
      expect(committed).toBe(false)
      return 42
    })
    expect(result).toBe(42)
    expect(committed).toBe(true)
    expect(await readAll(database)).toEqual(['saved'])
  })

  it.each([undefined, null, new Error('original failure')])('异步抛出 %s 时回滚并保留原始抛值', async (failure) => {
    const database = createDatabase()
    const operation = database.transaction('records', 'readwrite', async ({ store }) => {
      await store('records').set('key', 'rollback')
      throw failure
    })
    await expect(operation).rejects.toBe(failure)
    expect(await readAll(database)).toEqual([])
  })

  it('同步抛错、主键冲突与显式 abort 都不提交任何写入', async () => {
    const database = createDatabase()
    const failure = { code: 'sync' }
    await expect(database.transaction('records', 'readwrite', ({ raw }) => {
      const store = raw.objectStore('records')
      store.add('first', 'key')
      store.add('duplicate', 'key')
    })).rejects.toMatchObject({ name: 'ConstraintError' })
    await expect(database.transaction('records', 'readwrite', ({ raw }) => {
      raw.objectStore('records').put('rollback', 'key')
      throw failure
    })).rejects.toBe(failure)
    await expect(database.transaction('records', 'readwrite', async ({ raw }) => {
      const store = raw.objectStore('records')
      await requestToPromise(store.add('first', 'key'))
      await requestToPromise(store.add('duplicate', 'key'))
    })).rejects.toMatchObject({ name: 'ConstraintError' })
    await expect(database.transaction('records', 'readwrite', ({ raw }) => {
      raw.objectStore('records').put('rollback', 'key')
      raw.abort()
    })).rejects.toBeInstanceOf(Error)
    expect(await readAll(database)).toEqual([])
  })

  it('请求监听器 preventDefault 阻止原生 abort 时仍回滚', async () => {
    const database = createDatabase()
    let requestError: DOMException | null = null
    const operation = database.transaction('records', 'readwrite', ({ raw }) => {
      const store = raw.objectStore('records')
      store.add('must roll back', 'key')
      const duplicate = store.add('duplicate', 'key')
      duplicate.addEventListener('error', (event) => {
        requestError = duplicate.error
        event.preventDefault()
      })
    })
    await expect(operation).rejects.toMatchObject({ name: 'ConstraintError' })
    await expect(operation).rejects.toBe(requestError)
    expect(await readAll(database)).toEqual([])
  })

  it('同步 open 失败与 beforeOpen 抛错都保留原始抛值，下次操作重新尝试', async () => {
    const originalFailure = new Error('open failed')
    vi.spyOn(factory, 'open').mockImplementationOnce(() => {
      throw originalFailure
    })
    const database = createDatabase()
    await expect(database.open()).rejects.toBe(originalFailure)
    await database.open()

    let deny = true
    const denial = { code: 'owner' }
    const guarded = createDatabase({
      name: 'guarded',
      beforeOpen: ({ name }) => {
        expect(name).toBe('guarded')
        if (deny) throw denial
      },
    })
    await expect(guarded.store('records').get('x')).rejects.toBe(denial)
    deny = false
    expect(await guarded.store('records').get('x')).toBeUndefined()
  })

  it('关闭尚未完成的 open 以 AbortError 拒绝，迟到结果不替换新连接', async () => {
    const database = createDatabase()
    await database.open()
    database.close()
    const first = database.open()
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    database.close()
    database.close()
    const second = database.open()
    await rejected
    const opened = await second
    expect(await database.open()).toBe(opened)
    expect(await readAll(database)).toEqual([])
  })

  it('其他连接升级时让位，旧声明重新打开时直接沿用更高的磁盘版本', async () => {
    const database = createDatabase()
    const first = await database.open()
    const newer = createDatabase({ stores: { records: {}, extra: {} } })
    const upgraded = await newer.open()
    expect(upgraded.version).toBe(2)
    expect(() => first.transaction('records')).toThrow()

    // 旧声明是新声明的子集：不带版本打开即可，不会因版本落后报 VersionError
    const reopened = await database.open()
    expect(reopened.version).toBe(2)
    expect(await readAll(database)).toEqual([])

    upgraded.close()
    await expect(newer.store('records').getAll()).rejects.toMatchObject({ name: 'InvalidStateError' })
    const again = await newer.open()
    expect(again).not.toBe(upgraded)

    // fake-indexeddb 6.2.4 的声明把实例误标为构造器；运行时 API 接收数据库实例
    forceCloseDatabase(again as unknown as Parameters<typeof forceCloseDatabase>[0])
    expect(await newer.open()).not.toBe(again)
  })

  it('升级被其他连接阻塞时拒绝本轮、允许重试，迟到的成功不泄漏连接', async () => {
    const blocker = await requestToPromise(factory.open('blocked', 1))
    const database = createDatabase({ name: 'blocked' })
    await expect(database.open()).rejects.toThrow('blocked')
    blocker.close()
    const reopened = await database.open()
    expect(reopened.version).toBe(2)
    expect(reopened.objectStoreNames.contains('records')).toBe(true)

    // IDB open 无取消 API；人为延迟 success，覆盖 blocked 后迟到结果的资源归属
    const request = { onsuccess: null, onerror: null, onblocked: null, onupgradeneeded: null } as unknown as IDBOpenDBRequest
    vi.spyOn(factory, 'open').mockReturnValueOnce(request)
    const late = createDatabase({ name: 'late' })
    const pending = late.open()
    const rejection = expect(pending).rejects.toThrow('blocked')
    request.onblocked!(new Event('blocked') as IDBVersionChangeEvent)
    await rejection
    const current = await late.open()
    const closeLate = vi.fn()
    Object.defineProperty(request, 'result', { value: { close: closeLate } })
    request.onsuccess!(new Event('success'))
    expect(closeLate).toHaveBeenCalledTimes(1)
    expect(await late.open()).toBe(current)
  })
})
