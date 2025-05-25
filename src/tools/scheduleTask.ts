import type { TaskResult } from '@/types'

/** 一帧 一眼盯帧 */
const TICK = 1000 / 60

/**
 * 类似`React`调度器，在浏览器空闲时，用`MessageChannel`调度任务。在任务很多时，可以避免卡顿
 * @param taskArr 任务数组
 * @param needStop 是否停止任务
 */
export async function scheduleTask<T>(
  taskArr: (() => Promise<T>)[],
  needStop?: () => boolean,
) {
  let i = 0
  const res: (TaskResult<T>)[] = []
  const { start, hasIdleRunTask } = genFunc()
  const { port1, port2 } = new MessageChannel()
  const { promise, resolve, reject } = Promise.withResolvers<(TaskResult<T>)[]>()

  port2.onmessage = () => {
    runMacroTasks(hasIdleRunTask)
    start()
  }

  try {
    start()
  }
  catch (error) {
    reject(error)
  }

  function genFunc() {
    const isEnd = needStop
      ? () => i >= taskArr.length || needStop()
      : () => i >= taskArr.length

    function start() {
      if (isEnd()) {
        resolve(res)
      }
      else {
        port1.postMessage(null)
      }
    }

    async function hasIdleRunTask(hasIdle: HasIdle) {
      const st = performance.now()
      while (hasIdle(st)) {
        if (isEnd())
          return resolve(res)

        const curIndex = i
        try {
          i++
          const data = await taskArr[curIndex]()
          res[curIndex] = {
            status: 'fulfilled',
            value: data,
          }
        }
        catch (error) {
          console.warn(`第${curIndex}个任务执行失败`, error)
          res[curIndex] = {
            status: 'rejected',
            reason: error instanceof Error
              ? error
              : new Error(String(error)),
          }
        }
      }
    }

    return {
      /** 开始调度 */
      start,
      /** 空闲时执行 */
      hasIdleRunTask,
    }
  }

  /** 放入宏任务执行 并回调执行时间和开始时间的差值 */
  function runMacroTasks(hasIdleRunTask: (hasIdle: HasIdle) => void) {
    hasIdleRunTask(st => performance.now() - st < TICK)
  }

  return promise
}

type HasIdle = (startTime: number) => boolean
