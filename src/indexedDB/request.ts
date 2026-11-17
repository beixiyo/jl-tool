/** 原生 IDBRequest 与游标的 Promise 化工具；只负责结算单个请求，写入是否提交由事务决定 */

/**
 * 将单个原生请求转为 Promise
 *
 * 请求成功只代表这一步执行完毕；读写型操作的最终成功须等待所在事务 complete
 */
export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB request failed')), { once: true })
  })
}

/**
 * 逐条推进游标直到结束或 `visit` 返回 `false`
 *
 * `visit` 在游标事件里同步执行，不能等待事务外的异步，否则事务会先行提交
 */
export function walkCursor<C extends IDBCursor>(
  request: IDBRequest<C | null>,
  visit: (cursor: C) => boolean | void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => {
      const cursor = request.result
      if (!cursor) {
        resolve()
        return
      }

      try {
        if (visit(cursor) === false) resolve()
        else cursor.continue()
      }
      catch (error) {
        reject(error)
      }
    })
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB cursor failed')), { once: true })
  })
}
