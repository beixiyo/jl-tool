/**
 * 失败后自动重试请求
 * @param task 任务数组
 * @param count 重试次数
 */
export function retryReq<T>(
    task: () => Promise<T>,
    count = 3
): Promise<T> {
    if (count <= 0) {
        return Promise.reject('重试次数耗尽')
    }
    return task()
        .then(res => {
            return res
        })
        .catch(() => retryReq(task, count - 1))
}

/**
 * 并发任务数组 完成最大并发数后才会继续
 * @param tasks 任务数组
 * @param maxNum 最大并发数
 */
export function concurrentTask<T>(
    tasks: () => Promise<T>[],
    maxNum = 4
): Promise<T[]> {
    let len = tasks.length,
        finalCount = 0,
        nextIndex = 0,
        resp: T,
        resArr = []

    return new Promise((resolve) => {
        if (len === 0) return resolve([])
        for (let i = 0; i < maxNum && i < len; i++) {
            _run()
        }

        /** 完成一个任务时，递归执行下一个任务。直到所有任务完成 */
        function _run() {
            const task = tasks[nextIndex++]

            task()
                .then((res: T) => {
                    resp = res
                    console.log(`成功 第${finalCount + 1}个任务`, res, '\n', '-'.repeat(100))
                })
                .catch((err: any) => {
                    resp = err
                    console.log(`失败 第${finalCount + 1}个任务`, err, '\n', '-'.repeat(100))
                })
                .finally(() => {
                    resArr[finalCount] = resp
                    nextIndex < len && _run()
                    ++finalCount === len && resolve(resArr)
                })
        }
    })
}
