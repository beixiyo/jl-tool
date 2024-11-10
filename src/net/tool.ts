/**
 * 失败后自动重试请求
 * @param task 任务数组
 * @param maxCount 重试次数，默认 3
 */
export function retryReq<T>(
  task: () => Promise<T>,
  maxCount = 3
): Promise<T> {
  return task()
    .then(res => res)
    .catch(() => {
      return maxCount <= 0
        ? Promise.reject({ msg: '重试次数耗尽', code: 500 })
        : retryReq(task, maxCount - 1)
    })
}

/**
 * 并发任务数组 完成最大并发数后才会继续
 * @param tasks 任务数组
 * @param maxCount 最大并发数，默认 4
 */
export function concurrentTask<T>(
  tasks: (() => Promise<T>)[],
  maxCount = 4
): Promise<T[]> {
  let len = tasks.length,
    finalCount = 0,
    nextIndex = 0,
    resp: T,
    resArr: T[] = []

  return new Promise((resolve) => {
    if (len === 0) return resolve([])
    for (let i = 0; i < maxCount && i < len; i++) {
      _run()
    }

    /** 完成一个任务时，递归执行下一个任务。直到所有任务完成 */
    function _run() {
      const task = tasks[nextIndex++]

      task()
        .then((res: T) => { resp = res })
        .catch((err: any) => { resp = err })
        .finally(() => {
          resArr[finalCount] = resp
          nextIndex < len && _run()
          ++finalCount === len && resolve(resArr)
        })
    }
  })
}
