import { numFixed } from '@/math/tools'
import { isStr } from '@/shared'

/**
 * 调度将指定数量的处理任务分配给多个 Web Worker，并按原始顺序收集它们的结果。
 *
 * 此函数简化了 Worker 生命周期管理、任务分发、进度报告和有序结果聚合的复杂性。
 *
 * @template SendWorkerMsg - 发送给每个 Worker 的消息负载的类型。
 * @template WorkerProgressData - 当一个项目被处理时传递给 `onItemProgress` 的数据类型。
 * @template WorkerResultItem - 最终解析的结果数组中每个项目的类型。
 *
 * @param config - 分发操作的配置对象。
 * @returns 一个 Promise，解析为一个 `WorkerResultItem` 数组，该数组按照原始项目序列（0 到 `totalItems` - 1）排序。
 *          如果任何 Worker 严重失败，则 Promise 将被拒绝。
 *
 * @example
 * splitWorkerTask<
 *   SendWorkerMsg,
 *   ReceiveWorkerMsg,
 *   ChunkFile
 * >({
 *   totalItems: maxChunkCount,
 *   WorkerScript: Worker,
 *
 *   genSendMsg: async (startIndex, endIndex) => {
 *     const buffer = arrayBuffer.slice(startIndex * chunkSize, endIndex * chunkSize)
 *     return {
 *       arrayBuffer: buffer,
 *       chunkSize,
 *       startIndex,
 *       endIndex,
 *       structuredSerializeOptions: {
 *         transfer: [buffer],
 *       },
 *     }
 *   },
 *
 *   onProgress: opts.onProgress,
 *
 *   onItemProgress: (globalItemIndex) => {
 *     opts.onItemProgress?.(globalItemIndex)
 *   },
 *
 *   onMessage: (
 *     messageFromWorker, // 这是 worker.onmessage 的 e.data
 *     workerInfo, // 包含 { workerId, startIndex, endIndex }
 *     { reportItemProcessed, resolveBatch, rejectBatch },
 *   ) => {
 *     if (messageFromWorker === null) {
 *       rejectBatch(new Error(`文件分块失败 (Worker ${workerInfo.workerId} 处理块 ${workerInfo.* startIndex}-${workerInfo.endIndex - 1})`))
 *       return
 *     }
 *
 *     if (Array.isArray(messageFromWorker)) {
 *       resolveBatch(messageFromWorker)
 *     }
 *     else if (messageFromWorker.type === 'progress') {
 *       // `messageFromWorker.index` 是该块的全局索引
 *       reportItemProcessed(messageFromWorker.index, null)
 *     }
 *     else {
 *       rejectBatch(new Error(`Worker ${workerInfo.workerId} 发送了未知的消息格式。`))
 *     }
 *   },
 * })
 */
export async function splitWorkerTask<
  SendWorkerMsg,
  ReceiveWorkerMsg,
  WorkerResultItem,
  WorkerProgressData = null,
>(
  config: DispatchWorkOptions<
    SendWorkerMsg,
    ReceiveWorkerMsg,
    WorkerResultItem,
    WorkerProgressData
  >,
): Promise<WorkerResultItem[]> {
  const {
    totalItems,
    WorkerScript,
    threadCount: customThreadCount,
    genSendMsg,
    onProgress,
    onItemProgress,
    onMessage,
  } = config

  if (totalItems < 0) {
    return Promise.reject(new Error('totalItems 不能为负数'))
  }
  if (totalItems === 0) {
    onProgress?.(1)
    return Promise.resolve([])
  }

  const ACTUAL_THREAD_COUNT = customThreadCount || navigator.hardwareConcurrency || 4
  /** 计算每个线程处理的任务数，确保向上取整 */
  const itemsPerThread = Math.ceil(totalItems / ACTUAL_THREAD_COUNT)
  /** 实际启动的 Worker 数量，不超过总任务数或设定的线程数 */
  const workersToLaunch = Math.min(ACTUAL_THREAD_COUNT, totalItems)

  const allResults: WorkerResultItem[] = new Array(totalItems)
  let completedWorkers = 0
  let itemsProcessedCount = 0

  return new Promise(async (resolve, reject) => {
    if (workersToLaunch === 0 && totalItems > 0) {
      reject(new Error('计算出的启动Worker数量为0，但仍有任务项'))
      return
    }

    /**
     * 给每个线程分配任务，处理文件的每一段
     * - 第一个线程分配到 startIndex = 0，endIndex = 26
     * - 第二个线程分配到 startIndex = 26，endIndex = 52
     * - 第三个线程分配到 startIndex = 52，endIndex = 78
     * - 第四个线程分配到 startIndex = 78，endIndex = 103
     */
    for (let i = 0; i < workersToLaunch; i++) {
      const workerId = i
      const startIndex = i * itemsPerThread
      const endIndex = Math.min((i + 1) * itemsPerThread, totalItems)

      /**
       * 如果一个 Worker 没有任务项可处理 (例如，线程数多于任务项数)，则跳过启动但计数
       *
       * 举例：
       * - totalItems = 5 (总共5个任务)
       * - ACTUAL_THREAD_COUNT = 4 (期望使用4个线程)
       * - itemsPerThread = Math.ceil(5 / 4) = Math.ceil(1.25) = 2 (每个线程理论上分2个任务)
       * - workersToLaunch = Math.min(4, 5) = 4 (尝试启动4个 Worker)
       *
       * 第四个线程（索引3）会进入判断
       * - startIndex = 3 * 2 = 6
       * - endIndex = Math.min((3 + 1) * 2, 5) = Math.min(8, 5) = 5
       */
      if (startIndex >= endIndex) {
        /** 递增已完成的 Worker 数量 */
        completedWorkers++

        /**
         * 检查是否所有计划启动的 Worker 都已“完成”
         * 包括那些实际有任务的 Worker 和这些没有任务的“空闲” Worker
         */
        if (completedWorkers === workersToLaunch) {
          /**
           * 可选的进度修正) 如果所有 Worker 都完成了，但由于某些原因
           * 比如浮点数精度或逻辑，itemsProcessedCount 还不等于 totalItems，
           * 并且确实有任务需要处理 (totalItems > 0)，且提供了 onProgress 回调，
           * 那么强制将进度设置为 100% (1)。
           */
          if (itemsProcessedCount !== totalItems && totalItems > 0 && onProgress) {
            onProgress(1)
          }
          resolve(allResults)
        }
        continue
      }

      try {
        const worker = isStr(WorkerScript)
          ? new Worker(WorkerScript)
          : new WorkerScript()

        const reportItemProcessed = (itemGlobalIndex: number, itemData: WorkerProgressData) => {
          if (itemGlobalIndex < 0 || itemGlobalIndex >= totalItems) {
            console.warn(`调度器: itemGlobalIndex ${itemGlobalIndex} 超出范围 [0, ${totalItems - 1}]。已忽略`)
            return
          }

          itemsProcessedCount++
          onItemProgress?.(itemGlobalIndex, itemData)
          if (totalItems > 0 && onProgress) {
            onProgress(Math.min(numFixed(itemsProcessedCount / totalItems, 2), 1))
          }
        }

        const resolveBatch = (batchResults: WorkerResultItem[]) => {
          const expectedBatchSize = endIndex - startIndex
          if (batchResults.length !== expectedBatchSize) {
            const errMsg = `Worker ${workerId} (任务 ${startIndex}-${endIndex - 1}) 返回了 ${batchResults.length} 个结果，期望 ${expectedBatchSize} 个。`
            console.error(errMsg)
            worker.terminate()
            reject(new Error(errMsg))
            return
          }

          for (let j = 0; j < batchResults.length; j++) {
            allResults[startIndex + j] = batchResults[j]
          }

          worker.terminate()
          completedWorkers++

          if (completedWorkers === workersToLaunch) {
            if (itemsProcessedCount !== totalItems && totalItems > 0 && onProgress)
              onProgress(1)
            resolve(allResults)
          }
        }

        const rejectBatch = (error: Error) => {
          worker.terminate()
          reject(new Error(`Worker ${workerId} (任务 ${startIndex}-${endIndex - 1}) 失败: ${error.message}`))
        }

        worker.onmessage = ({ data: messageFromWorker }) => {
          onMessage(
            messageFromWorker,
            { workerId, startIndex, endIndex },
            {
              reportItemProcessed,
              resolveBatch,
              rejectBatch,
            },
          )
        }

        worker.onerror = (errorEvent) => {
          rejectBatch(new Error(` onerror: ${errorEvent.message || '未知的 Worker 错误'}`))
        }

        const sendMsg = await genSendMsg(startIndex, endIndex)
        worker.postMessage(sendMsg, sendMsg.structuredSerializeOptions)
      }
      catch (e: any) {
        reject(new Error(`初始化 Worker ${workerId} 或向其发送初始消息失败: ${e.message}`))
        return
      }
    }
  })
}

/**
 * `dispatchWorkToWorkers` 函数的配置选项
 * @template SendWorkerMsg - 发送给 Worker 的消息体类型
 * @template ReceiveWorkerMsg - 接收的 Worker 消息类型
 * @template WorkerResultItem - 最终结果数组中单个项的类型
 * @template WorkerProgressData - 单个任务项处理进度回调时的数据类型
 */
export interface DispatchWorkOptions<
  SendWorkerMsg,
  ReceiveWorkerMsg,

  WorkerResultItem,
  WorkerProgressData,
> {
  /** 需要处理的总任务项数量。这些任务项将按 0 到 totalItems-1 的索引进行处理。 */
  totalItems: number
  /** Worker 脚本的 URL 路径。 */
  WorkerScript: string | (new () => Worker)
  /**
   *期望的线程（Worker）数量。
   * 默认为 `navigator.hardwareConcurrency` 或 4 (如果前者不可用)。
   */
  threadCount?: number

  /**
   * 创建发送给 Worker 的消息负载的函数。
   * @param startIndex 此 Worker 应处理的任务项的起始全局索引（包含）。
   * @param endIndex 此 Worker 应处理的任务项的结束全局索引（不包含）。
   * @returns 通过 `postMessage` 发送给 Worker 的数据。
   */
  genSendMsg: (startIndex: number, endIndex: number) => Promise<
    SendWorkerMsg & { structuredSerializeOptions?: StructuredSerializeOptions }
  >

  /**
   * (可选) 整体进度回调函数。
   * 当 `onMessage` 通过 `reportItemProcessed` 报告单个任务项已处理时调用。
   * @param progress 进度值，范围从 0 到 1。
   */
  onProgress?: (progress: number) => void
  /**
   * (可选) 当 Worker 报告单个任务项的处理进度时调用的回调函数。
   * 由 `onMessage` 调用 `reportItemProcessed` 时触发。
   * @param data 该任务项的进度数据 (从 `reportItemProcessed` 传递)。
   * @param index 该任务项的全局索引 (0 到 `totalItems` - 1)。
   */
  onItemProgress?: (index: number, data: WorkerProgressData) => void

  /**
   * 处理从 Worker 收到的消息。
   * 此函数对于解析 Worker 响应、发出任务进展或完成信号至关重要。
   *
   * @param message Worker `MessageEvent` 中的 `data` 属性。
   * @param workerInfo 关于 Worker 实例及其分配的任务项索引范围的信息。
   * @param callbacks 回调函数集合，用于报告任务项进展、完成或失败。某个任务完成时，必须调用 `resolveBatch` 才会收集结果。
   */
  onMessage: (
    message: ReceiveWorkerMsg,
    workerInfo: WorkerInfo,
    callbacks: Callbacks<
      WorkerProgressData,
      WorkerResultItem
    >
  ) => void
}

export type Callbacks<
  WorkerProgressData,
  WorkerResultItem,
> = {
  /**
   * 当 Worker 为单个任务项发出进度信号时调用此函数。
   * `itemData` 将传递给 `onItemProgress`，`itemGlobalIndex` 是任务项的全局索引
   */
  reportItemProcessed: (itemGlobalIndex: number, itemData: WorkerProgressData) => void
  /**
   * 当某个 Worker 完成其分配范围内的所有任务项时调用此函数。
   * `batchResults` 必须是一个 `WorkerResultItem` 数组，按照从 `workerInfo.startIndex` 到 `workerInfo.endIndex - 1` 的全局任务项索引排序。
   */
  resolveBatch: (batchResults: WorkerResultItem[]) => void
  /**
   * 如果在处理此 Worker 的批处理时发生不可恢复的错误，或者 Worker 发送错误/null 消息时调用此函数。
   */
  rejectBatch: (error: Error) => void
}

export type WorkerInfo = {
  /** Worker 实例的唯一标识符 (0 到 `实际线程数` - 1)。 */
  workerId: number
  /** 分配给此 Worker 的任务项的全局起始索引。 */
  startIndex: number
  /** 分配给此 Worker 的任务项的全局结束索引（不包含）。 */
  endIndex: number
}
