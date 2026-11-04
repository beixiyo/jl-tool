/** 创建一次性 Worker 任务控制器：动态派发、结果保序、事件订阅和统一收尾 */
import { isPromiseLike } from '@/shared/is'
import type { WorkerTaskRequest } from './protocol'
import { isWorkerTaskMessage, workerTaskChannel } from './protocol'
import type { WorkerTask, WorkerTaskEvents, WorkerTaskOptions, WorkerTaskState } from './types'

/**
 * 创建控制器，不立即分配 Worker；调用 start() 后才准备输入并执行任务
 * 每个 Worker 同时处理一项，空闲后领取下一项；任一失败会终止全部 Worker
 * 同步订阅在结果记录后执行，订阅抛错也会使任务失败。取消无法撤回已通知的结果
 */
export function createWorkerTask<Input, Result, CustomEvent = never>(
  options: WorkerTaskOptions<Input>,
): WorkerTask<Result, CustomEvent> {
  const { totalItems, createWorker, createTask, signal } = options
  const concurrency = options.concurrency ?? getDefaultConcurrency()

  if (!Number.isSafeInteger(totalItems) || totalItems < 0 || totalItems > 0xFFFF_FFFF) {
    throw new RangeError('totalItems must be a non-negative integer within the array length limit')
  }
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer')
  }

  type Events = WorkerTaskEvents<Result, CustomEvent>
  const listeners: EventListeners<Result, CustomEvent> = {
    item: new Set(),
    event: new Set(),
    progress: new Set(),
  }

  const workers = new Set<WorkerSlot>()
  const preparation = new AbortController()

  let state: WorkerTaskState = 'idle'
  let terminalError: Error | undefined
  let promise: Promise<Result[]> | undefined
  let resolvePromise: (value: Result[]) => void
  let rejectPromise: (error: Error) => void
  let results: Result[] = []
  let nextIndex = 0
  let completed = 0

  const isRunning = () => state === 'running'
  const isTerminal = () => state !== 'idle' && state !== 'running'

  const cleanup = () => {
    signal?.removeEventListener('abort', cancel)

    for (const slot of workers) {
      slot.worker.removeEventListener('message', slot.onMessage)
      slot.worker.removeEventListener('error', slot.onError)
      slot.worker.removeEventListener('messageerror', slot.onMessageError)
      slot.worker.terminate()
    }
    workers.clear()

    for (const subscriptions of Object.values(listeners)) subscriptions.clear()
  }

  const fail = (reason: unknown) => {
    if (isTerminal()) return

    terminalError = reason instanceof Error
      ? reason
      : new Error(String(reason))
    state = 'failed'
    cleanup()
    preparation.abort(terminalError)
    rejectPromise?.(terminalError)
  }

  function cancel() {
    if (isTerminal()) return

    terminalError = new DOMException('Worker task cancelled', 'AbortError')
    state = 'cancelled'
    cleanup()
    preparation.abort(terminalError)
    rejectPromise?.(terminalError)
  }

  const notify = <Key extends keyof Events>(type: Key, event: Events[Key]) => {
    for (const listener of [...listeners[type]]) {
      if (!isRunning()) return
      if (!listeners[type].has(listener)) continue

      const returned: unknown = listener(event)
      if (isPromiseLike(returned)) {
        // 防止 JS 调用方传入 async 监听器后产生未处理的 Promise 拒绝
        void Promise.resolve(returned).catch(() => {})
        throw new TypeError('Worker task listeners must be synchronous')
      }
    }
  }

  const succeed = () => {
    if (!isRunning()) return

    state = 'completed'
    cleanup()
    resolvePromise(results)
  }

  const dispatch = async (slot: WorkerSlot) => {
    if (!isRunning() || nextIndex >= totalItems) return

    const index = nextIndex++
    slot.index = index

    try {
      const input = await createTask({ index, signal: preparation.signal })
      // 准备输入期间可能已经失败或取消，不能把过期输入继续发出去
      if (!isRunning() || slot.index !== index) return

      const request: WorkerTaskRequest<Input> = {
        channel: workerTaskChannel,
        type: 'run',
        index,
        input: input.data,
      }
      slot.worker.postMessage(request, { transfer: input.transfer ?? [] })
    }
    catch (error) {
      fail(error)
    }
  }

  const receive = (slot: WorkerSlot, data: unknown) => {
    if (!isRunning() || !isWorkerTaskMessage(data)) return

    if (!Number.isSafeInteger(data.index) || (data.index as number) < 0) {
      throw new Error('Invalid Worker task response index')
    }

    // 单个 Worker 的索引严格递增：重复/迟到的旧消息不触发回调或计数
    if (slot.index === undefined || (data.index as number) < slot.index) return
    if (data.index !== slot.index) throw new Error('Worker task response does not match its assigned task')

    const index = slot.index
    if (data.type === 'event' && 'event' in data) {
      notify('event', { index, workerId: slot.workerId, event: data.event as CustomEvent })
      return
    }

    if (data.type === 'error') {
      const info = data.error
      if (typeof info !== 'object' || info === null || !('message' in info) || typeof info.message !== 'string') {
        throw new Error('Invalid Worker task error response')
      }
      const error = new Error(`Worker ${slot.workerId}, task ${index}: ${info.message}`)
      if ('name' in info && typeof info.name === 'string') error.name = info.name
      throw error
    }

    if (data.type !== 'result' || !('value' in data)) {
      throw new Error('Invalid Worker task response')
    }

    slot.index = undefined
    results[index] = data.value as Result
    completed++

    notify('item', { index, workerId: slot.workerId, value: results[index], completed, total: totalItems })
    notify('progress', { completed, total: totalItems, progress: completed / totalItems })

    if (!isRunning()) return
    if (completed === totalItems) succeed()
    else void dispatch(slot)
  }

  const launch = () => {
    if (!isRunning()) return

    if (totalItems === 0) {
      notify('progress', { completed: 0, total: 0, progress: 1 })
      succeed()
      return
    }
    results = new Array<Result>(totalItems)

    const workerCount = Math.min(concurrency, totalItems)

    for (let workerId = 0; workerId < workerCount && isRunning(); workerId++) {
      const worker = createWorker()
      // 工厂自身也可能触发取消，尚未加入资源集合的实例同样需要清理
      if (!isRunning()) {
        worker.terminate()
        return
      }
      if ([...workers].some((slot) => slot.worker === worker)) {
        throw new Error('createWorker must return a new Worker for each call')
      }

      const slot: WorkerSlot = {
        workerId,
        worker,
        index: undefined,
        onMessage: ({ data }) => {
          try {
            receive(slot, data)
          }
          catch (error) {
            fail(error)
          }
        },
        onError: (event) => fail(new Error(`Worker ${workerId}: ${event.message || 'Unknown Worker error'}`)),
        onMessageError: () => fail(new Error(`Worker ${workerId}: message deserialization failed`)),
      }

      workers.add(slot)
      worker.addEventListener('message', slot.onMessage)
      worker.addEventListener('error', slot.onError)
      worker.addEventListener('messageerror', slot.onMessageError)
      void dispatch(slot)
    }
  }

  signal?.addEventListener('abort', cancel, { once: true })
  if (signal?.aborted) cancel()

  return {
    get state() {
      return state
    },
    start: () => {
      if (promise) return promise
      if (terminalError) {
        promise = Promise.reject(terminalError)
        return promise
      }

      promise = new Promise<Result[]>((resolve, reject) => {
        resolvePromise = resolve
        rejectPromise = reject
      })
      state = 'running'
      // start() 先交回 Promise，再执行工厂和用户代码，保证统一捕获同步异常
      void Promise.resolve().then(launch).catch(fail)
      return promise
    },
    cancel,
    on: (type, listener) => {
      if (isTerminal()) return () => {}

      // 每次订阅独立，即使重复传入同一个 listener 也可分别退订
      const subscription: typeof listener = (event) => listener(event)
      listeners[type].add(subscription)
      return () => {
        listeners[type].delete(subscription)
      }
    },
  }
}

/** 获取有效的默认并发数，兼容没有 navigator 的环境 */
function getDefaultConcurrency(): number {
  const count = typeof navigator === 'undefined'
    ? undefined
    : navigator.hardwareConcurrency
  return count !== undefined && Number.isSafeInteger(count) && count > 0
    ? count
    : 4
}

type EventListeners<Result, CustomEvent> = {
  [Key in keyof WorkerTaskEvents<Result, CustomEvent>]: Set<(event: WorkerTaskEvents<Result, CustomEvent>[Key]) => void>
}

type WorkerSlot = {
  /** Worker 编号 */
  workerId: number
  worker: Worker
  index: number | undefined
  onMessage: (event: MessageEvent<unknown>) => void
  onError: (event: ErrorEvent) => void
  onMessageError: () => void
}
