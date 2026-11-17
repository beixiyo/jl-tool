/**
 * 连接与事务生命周期：延迟打开、并发 open 共享、按 schema 自动升级、失效后重开
 * 以及「回调返回且原生 complete 之后才算成功」的事务结算
 *
 * 版本号由磁盘决定：先不带版本打开，结构不满足声明时再以「当前版本 + 1」升级
 * 因此调用方不需要、也不应该维护数字版本
 */

import type { NormalizedSchema } from './schema'
import { applySchema, needsUpgrade } from './schema'

/**
 * 创建延迟打开、可重开的连接
 * close 会以 AbortError 拒绝尚未完成的 open，并关闭该轮迟到的连接
 */
export function createConnection(options: ConnectionOptions): Connection {
  let current: Generation | undefined

  function invalidate(generation: Generation) {
    if (current === generation) current = undefined
  }

  function open(): Promise<IDBDatabase> {
    if (current) return current.promise

    let resolve!: (database: IDBDatabase) => void
    let reject!: (error: unknown) => void
    const promise = new Promise<IDBDatabase>((onResolve, onReject) => {
      resolve = onResolve
      reject = onReject
    })
    const generation: Generation = { promise, reject }
    current = generation
    const isStale = () => current !== generation

    function fail(error: unknown) {
      invalidate(generation)
      reject(error)
    }

    try {
      options.beforeOpen?.({ name: options.name })
    }
    catch (error) {
      fail(error)
      return promise
    }

    openWithSchema(options.name, options.schema, isStale, options.maxOpenAttempts).then((database) => {
      if (isStale()) {
        database.close()
        return
      }

      generation.database = database
      database.addEventListener('versionchange', () => {
        invalidate(generation)
        database.close()
      })
      database.addEventListener('close', () => invalidate(generation))
      resolve(database)
    }, fail)

    return promise
  }

  function close() {
    const generation = current
    if (!generation) return

    invalidate(generation)
    generation.reject(new DOMException('IndexedDB connection closed', 'AbortError'))
    generation.database?.close()
  }

  async function transaction<T>(
    storeNames: string | readonly string[],
    mode: IDBTransactionMode,
    run: (transaction: IDBTransaction) => T | Promise<T>,
  ): Promise<T> {
    const database = await open()
    let transaction: IDBTransaction
    try {
      transaction = database.transaction(
        typeof storeNames === 'string'
          ? storeNames
          : [...storeNames],
        mode,
      )
    }
    catch (error) {
      // 原生 close 不触发 close 事件；创建失败时丢弃缓存，不重试可能带有写入副作用的回调
      if (current?.database === database) invalidate(current)
      database.close()
      throw error
    }

    return new Promise<T>((resolve, reject) => {
      let result: T
      let runFinished = false
      let completed = false
      let hasRunError = false
      let runError: unknown
      let hasRequestError = false
      let requestError: unknown

      function finish() {
        if (hasRunError) reject(runError)
        else if (hasRequestError) reject(requestError)
        else if (completed && runFinished) resolve(result)
      }

      function failRun(error: unknown) {
        hasRunError = true
        runError = error
        runFinished = true
        try {
          transaction.abort()
        }
        catch {
          // 外部异步可能让事务先完成；仍拒绝原始错误，绝不报告成功
        }
        reject(error)
      }

      // 监听先于业务回调，覆盖同步 abort/throw 与第一个请求的失败
      transaction.addEventListener('complete', () => {
        completed = true
        finish()
      })
      transaction.addEventListener('error', (event) => {
        hasRequestError = true
        requestError = (event.target as IDBRequest).error ?? transaction.error ?? new Error('IndexedDB request failed')
        // 由这里统一中止一次：既覆盖请求监听器 preventDefault 掉原生 abort 的情况，也避免原生默认 abort 与手动 abort 叠加重复回滚
        event.preventDefault()
        try {
          transaction.abort()
        }
        catch {
          // 请求监听器可能已中止事务；abort 事件仍以保存的原始错误结算
        }
      })
      transaction.addEventListener('abort', () => {
        if (hasRunError) reject(runError)
        else reject(transaction.error ?? requestError ?? new Error('IndexedDB transaction aborted'))
      })

      try {
        Promise.resolve(run(transaction)).then((value) => {
          result = value
          runFinished = true
          finish()
        }, failRun)
      }
      catch (error) {
        failRun(error)
      }
    })
  }

  return { open, close, transaction }
}

/**
 * 打开数据库并保证结构满足声明
 *
 * 其他标签页可能同时升级：以 `当前版本 + 1` 打开时若对方已抢先升到更高版本（VersionError），
 * 或升级后结构仍不满足（对方的声明不同），重新读取当前版本再试
 */
async function openWithSchema(name: string, schema: NormalizedSchema, isStale: () => boolean, maxOpenAttempts: number): Promise<IDBDatabase> {
  for (let attempt = 0; attempt < maxOpenAttempts; attempt++) {
    // 不带版本：库不存在时 upgradeneeded(0 → 1) 直接建好全部结构
    const database = await openRequest({ name, schema, isStale })
    if (isStale() || !checkUpgrade(database, schema)) return database

    const nextVersion = database.version + 1
    database.close()

    let upgraded: IDBDatabase
    try {
      upgraded = await openRequest({ name, version: nextVersion, schema, isStale })
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'VersionError') continue
      throw error
    }

    if (isStale() || !checkUpgrade(upgraded, schema)) return upgraded
    upgraded.close()
  }

  throw new Error(`Unable to bring IndexedDB database "${name}" up to the declared schema after ${maxOpenAttempts} attempts`)
}

/** 结构冲突时先关闭连接再抛出，避免泄漏一条阻塞后续升级的连接 */
function checkUpgrade(database: IDBDatabase, schema: NormalizedSchema): boolean {
  try {
    return needsUpgrade(database, schema)
  }
  catch (error) {
    database.close()
    throw error
  }
}

/**
 * 发起一次原生 open；升级回调里补齐 schema
 *
 * blocked 时立即拒绝，之后若请求迟到成功则关闭该连接，不泄漏
 */
function openRequest(options: {
  name: string
  version?: number
  schema: NormalizedSchema
  isStale: () => boolean
}): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false
    /** 升级事务自身的失败原因（如唯一索引被已有数据违反）；open 请求只会报笼统的 AbortError */
    let upgradeError: DOMException | null = null

    function fail(error: unknown) {
      if (settled) return
      settled = true
      reject(error)
    }

    const request = options.version === undefined
      ? indexedDB.open(options.name)
      : indexedDB.open(options.name, options.version)

    request.onupgradeneeded = () => {
      const transaction = request.transaction!
      if (settled || options.isStale()) {
        transaction.abort()
        return
      }

      transaction.addEventListener('abort', () => {
        upgradeError = transaction.error
      })
      try {
        applySchema(request.result, transaction, options.schema)
      }
      catch (error) {
        // 保留原始抛值，不能被随后产生的 AbortError 替换
        fail(error)
        try {
          transaction.abort()
        }
        catch {
          // 升级过程可能已自行中止事务
        }
      }
    }
    request.onsuccess = () => {
      if (settled) {
        request.result.close()
        return
      }
      settled = true
      resolve(request.result)
    }
    request.onerror = () => fail(upgradeError ?? request.error ?? new Error('Failed to open IndexedDB database'))
    request.onblocked = () => fail(new Error(`IndexedDB upgrade of "${options.name}" is blocked by another open connection`))
  })
}

export type ConnectionOptions = {
  name: string
  schema: NormalizedSchema
  maxOpenAttempts: number
  /** 每轮打开前同步调用；抛错则本轮打开失败，下次操作会重新尝试 */
  beforeOpen?: (context: { name: string }) => void
}

export type Connection = {
  open: () => Promise<IDBDatabase>
  close: () => void
  transaction: <T>(
    storeNames: string | readonly string[],
    mode: IDBTransactionMode,
    run: (transaction: IDBTransaction) => T | Promise<T>,
  ) => Promise<T>
}

type Generation = {
  promise: Promise<IDBDatabase>
  reject: (error: unknown) => void
  database?: IDBDatabase
}
