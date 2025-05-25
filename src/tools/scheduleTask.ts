import type { TaskResult } from '@/types'

/** 一帧 一眼盯帧 */
const TICK = 1000 / 60

/**
 * 调度一个异步任务数组，使其增量执行，并在（批次）任务之间让出浏览器主线程，
 * 以防止 UI 冻结并保持响应性。它利用 `MessageChannel` 进行宏任务调度，
 * 尝试在浏览器空闲时，在每个调度周期的时间预算（由 `TICK` 定义）内运行任务。
 *
 * 此函数在概念上类似于 React 等库中看到的协作式调度，旨在浏览器空闲期间以小块方式执行工作。
 *
 * @template T 每个任务的 Promise 解析后产生的值的类型。
 * @param taskArr 一个函数数组，其中每个函数都返回一个 Promise (`() => Promise<T>`)。
 *                这些是需要被调度和执行的独立异步任务。
 * @param needStop 一个可选的回调函数，在处理下一个任务（或一批任务）之前会检查该函数。
 *                 如果它返回 `true`，调度器将停止处理更多任务，并使用目前累积的结果来
 *                 解析主 Promise。这允许提前终止。
 * @returns 一个 Promise，它会解析为一个 `TaskResult<T>` 对象数组。
 *          每个 `TaskResult` 反映了 `taskArr` 中对应任务的结果（fulfilled 或 rejected）。
 *          如果在调度设置过程中发生不可恢复的错误（例如，`MessageChannel` API 意外失败或发生严重的内部错误），
 *          则 Promise 会被拒绝 (reject)。
 *
 * @remarks
 * 核心思想是按时间片处理任务。在消耗一个时间片（`TICK`）处理任务后，
 * 调度器通过 `MessageChannel` 将控制权交还给浏览器，允许 UI 更新和其他浏览器工作继续进行。
 * 然后，它会将自己排队以便在下一个宏任务中继续处理任务。
 *
 * 适用场景:
 * -------------------
 * 1.  **批量处理大量小型异步操作：**
 *     理想情况是当您有大量相对快速、独立的异步操作时（例如，为许多项目获取小块数据，
 *     对大数组中的每个元素应用涉及异步步骤的转换）。
 * 2.  **在后台工作期间提高 UI 响应性：**
 *     当您需要执行非关键的后台处理（如预加载数据、轻量级分析批处理）而不想阻塞主线程
 *     并导致 UI 卡顿时。
 * 3.  **可以延迟的任务：**
 *     对于不需要立即完成并且可以容忍在浏览器资源可用时增量处理的操作。
 * 4.  **可分块并异步化的 CPU 密集型工作：**
 *     如果您有可以分解为更小的、独立的函数，并且每个函数都可以包装在 `async` 函数中
 *     （即使它只是 `await Promise.resolve()` 以让出控制权）的 CPU 密集型同步工作，
 *     此调度器可以帮助将其执行与其它浏览器任务交错进行。
 *     但是，对于真正繁重的、不可中断的 CPU 工作，Web Workers 通常是更好的解决方案。
 *     如果“块”自然包含 `await` 点，则此调度器会有所帮助。
 *
 * 局限性与不适用场景:
 * --------------------------------
 * 1.  **单个任务内部的长时间异步操作：**
 *     调度器在 `taskArr` 中的任务执行*之间*让出。如果单个 `taskArr[i]()` 执行一个
 *     本身需要很长时间的 `await` 操作（例如，一个需要5秒才能完成的 `await fetch(...)`），
 *     调度器将在这5秒内暂停，等待该特定 Promise 解析。`TICK` 预算适用于*运行*任务的循环，
 *     而不适用于任务内单个 `await` 的 Promise 的内部持续时间。
 *     **它不会使固有的长时间运行的 I/O 操作变得非阻塞，超出 Promises 本身提供的范围。**
 * 2.  **任务内部的长时间运行同步代码：**
 *     如果任何任务函数 `() => Promise<T>`，尽管是 `async` 的，但在 `await` 或其返回之前
 *     包含大量同步的、CPU 密集型的代码块，那么该同步代码在其执行期间将阻塞主线程。
 *     `async` 关键字和此调度器无法分解同步代码块。
 * 3.  **需要立即、高优先级或不可中断执行的任务：**
 *     此调度器旨在*延迟*和*交错*工作。它不适用于必须立即执行、具有高优先级或不能暂停的操作。
 * 4.  **相对于其他事件的精确计时或执行顺序保证：**
 *     调度依赖于 `MessageChannel`（宏任务）和一种“空闲”启发式方法。
 *     除了确保它们不会长时间独占事件循环外，它不提供硬性的实时保证或对任务相对于其他浏览器事件
 *     何时运行的精确控制。
 * 5.  **对任务完成有极低延迟要求的场景：**
 *     由于任务是排队并分块处理的，调度机制本身会引入固有的延迟。
 * 6.  **环境限制：**
 *     - 依赖于 `MessageChannel`，它在现代浏览器中广泛可用，但并非在所有 JavaScript 环境中都可用
 *       （例如，没有 polyfill 的 Node.js，非常老的浏览器）。
 *     - 使用 `Promise.withResolvers()`，这是一个较新的 API。请确保您的目标环境支持它或使用
 *       polyfill/替代方案。
 * 7.  **如果 `needStop()` 开销大或容易出错：**
 *     `needStop()` 回调会频繁执行。如果它计算开销大或可能抛出错误，可能会对调度器的性能或
 *     稳定性产生负面影响。`needStop` 中的错误（如果 `needStop` 本身未处理）可能导致主 Promise
 *     永远不会解析。
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

    function hasIdleRunTask(hasIdle: HasIdle) {
      const st = performance.now()
      while (hasIdle(st)) {
        if (isEnd())
          return resolve(res)

        const curIndex = i
        try {
          taskArr[curIndex]().then((data) => {
            i++
            res[curIndex] = {
              status: 'fulfilled',
              value: data,
            }
          })
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
