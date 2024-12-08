/** 一帧 一眼盯帧 */
const TICK = 1000 / 60

/**
 * 类似`React`调度器，在浏览器空闲时，用`MessageChannel`调度任务。在任务很多时，可以避免卡顿
 * @param taskArr 任务数组
 * @param onEnd 任务完成的回调
 * @param needStop 是否停止任务
 */
export const scheduleTask = (
  taskArr: Function[],
  onEnd?: Function,
  needStop?: () => boolean
) => {
  let i = 0
  const { start, hasIdleRunTask } = genFunc()
  const { port1, port2 } = new MessageChannel()

  port2.onmessage = () => {
    runMacroTasks(hasIdleRunTask)
    start()
  }
  start()


  function genFunc() {
    const isEnd = needStop
      ? () => i >= taskArr.length || needStop()
      : () => i >= taskArr.length

    function start() {
      if (isEnd()) {
        onEnd?.()
      }
      else {
        port1.postMessage(null)
      }
    }

    function hasIdleRunTask(hasIdle: HasIdle) {
      const st = performance.now()
      while (hasIdle(st)) {
        if (isEnd()) return

        try {
          taskArr[i++]()
        }
        catch (error) {
          console.warn(`第${i}个任务执行失败`, error)
        }
      }
    }

    return {
      /** 开始调度 */
      start,
      /** 空闲时执行 */
      hasIdleRunTask
    }
  }

  /** 放入宏任务执行 并回调***执行时间和开始时间的差值*** */
  function runMacroTasks(hasIdleRunTask: (hasIdle: HasIdle) => void) {
    hasIdleRunTask((st) => performance.now() - st < TICK)
  }
}



type HasIdle = (st: number) => boolean
