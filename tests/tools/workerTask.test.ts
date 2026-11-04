/** 使用配套 Worker 适配器和异步克隆传输验证调度、协议与资源生命周期 */
import type { DefineWorkerTaskOptions, WorkerTaskContext, WorkerTaskHandler, WorkerTaskScope } from '@/tools/workerTask'
import { createWorkerTask, defineWorkerTask } from '@/tools/workerTask'
import { describe, expect, it, vi } from 'vitest'

describe('Worker 任务控制器', () => {
  it('先订阅后启动，乱序通知但结果保序，并让空闲 Worker 领取下一项', async () => {
    const gates = Array.from({ length: 3 }, () => deferred<string>())
    const started: number[] = []
    const pool = createPool<number, string, { loaded: number }>((index, { emit }) => {
      started.push(index)
      emit({ loaded: 1 })
      emit({ loaded: 2 })
      return gates[index].promise
    })
    const task = createWorkerTask<number, string, { loaded: number }>({
      totalItems: 3,
      concurrency: 2,
      createWorker: pool.createWorker,
      createTask: ({ index }) => ({ data: index }),
    })
    const items: number[] = []
    const events: number[] = []
    const progress: number[] = []
    task.on('item', ({ index }) => {
      items.push(index)
    })
    task.on('event', ({ index }) => {
      events.push(index)
    })
    task.on('progress', (event) => {
      progress.push(event.progress)
    })

    expect(pool.workers).toHaveLength(0)
    const result = task.start()
    expect(task.start()).toBe(result)
    await vi.waitFor(() => expect(started).toEqual([0, 1]))
    expect(items).toEqual([])
    expect(progress).toEqual([])
    expect(events).toEqual([0, 0, 1, 1])

    gates[1].resolve('one')
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2]))
    expect(items).toEqual([1])
    expect(pool.workers).toHaveLength(2)

    gates[2].resolve('two')
    await vi.waitFor(() => expect(items).toEqual([1, 2]))
    gates[0].resolve('zero')
    await expect(result).resolves.toEqual(['zero', 'one', 'two'])
    expect(progress).toEqual([1 / 3, 2 / 3, 1])
    expect(task.state).toBe('completed')
    expect(task.start()).toBe(result)
    task.cancel()
    expect(task.state).toBe('completed')
    expectCleaned(pool.workers)
  })

  it('重复结果和旧任务事件不会重复通知或提前完成', async () => {
    const gates = [deferred<string>(), deferred<string>()]
    const pool = createPool<number, string>((index) => gates[index].promise)
    const task = createWorkerTask<number, string>({
      totalItems: 2,
      concurrency: 1,
      createWorker: pool.createWorker,
      createTask: ({ index }) => ({ data: index }),
    })
    const items: string[] = []
    task.on('item', ({ value }) => {
      items.push(value)
    })
    const result = task.start()
    await vi.waitFor(() => expect(pool.workers[0]?.requests).toHaveLength(1))
    gates[0].resolve('first')
    await vi.waitFor(() => expect(pool.workers[0].requests).toHaveLength(2))
    pool.workers[0].deliver(pool.workers[0].responses[0])
    expect(items).toEqual(['first'])
    expect(task.state).toBe('running')

    gates[1].resolve('second')
    await expect(result).resolves.toEqual(['first', 'second'])
    expect(items).toEqual(['first', 'second'])
  })

  it('独立退订相同监听器，取消退订可幂等调用', async () => {
    const pool = createPool<number, number>((value) => value)
    const task = createWorkerTask<number, number>({
      totalItems: 1,
      createWorker: pool.createWorker,
      createTask: () => ({ data: 1 }),
    })
    const items: number[] = []
    const listener = ({ value }: { value: number }) => {
      items.push(value)
    }
    const unsubscribe = task.on('item', listener)
    task.on('item', listener)
    unsubscribe()
    unsubscribe()
    await expect(task.start()).resolves.toEqual([1])
    expect(items).toEqual([1])
    expectCleaned(pool.workers)
  })

  it('Worker 函数抛错时拒绝并终止所有实例，不再派发后续任务', async () => {
    const gate = deferred<number>()
    const pool = createPool<number, number>((index) => {
      if (index === 0) throw new TypeError('计算失败')
      return gate.promise
    })
    const createTask = vi.fn(({ index }: { index: number }) => ({ data: index }))
    const task = createWorkerTask<number, number>({ totalItems: 3, concurrency: 2, createWorker: pool.createWorker, createTask })
    const result = task.start()
    await expect(result).rejects.toMatchObject({ name: 'TypeError', message: expect.stringContaining('计算失败') })
    expect(task.state).toBe('failed')
    expect(createTask).toHaveBeenCalledTimes(2)
    gate.resolve(99)
    await nextTurn()
    expectCleaned(pool.workers)
  })

  it('输入异步准备期间取消，迟到输入不发送且不创建后续 Worker', async () => {
    const input = deferred<{ data: number }>()
    const pool = createPool<number, number>((value) => value)
    let preparationSignal: AbortSignal | undefined
    const task = createWorkerTask<number, number>({
      totalItems: 5,
      concurrency: 2,
      createWorker: pool.createWorker,
      createTask: ({ signal }) => {
        preparationSignal = signal
        return input.promise
      },
    })
    const result = task.start()
    await vi.waitFor(() => expect(pool.workers).toHaveLength(2))
    const rejection = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    task.cancel()
    task.cancel()
    await rejection
    expect(preparationSignal?.aborted).toBe(true)
    input.resolve({ data: 42 })
    await nextTurn()
    expect(pool.workers.every((worker) => worker.requests.length === 0)).toBe(true)
    expect(task.state).toBe('cancelled')
    expectCleaned(pool.workers)
  })

  it('外部信号可取消在途任务，迟到事件和结果不再通知', async () => {
    const gate = deferred<number>()
    let emitLate: (() => void) | undefined
    const pool = createPool<number, number, string>((value, { emit }) => {
      emitLate = () => emit('late')
      return gate.promise
    })
    const controller = new AbortController()
    const task = createWorkerTask<number, number, string>({
      totalItems: 1,
      signal: controller.signal,
      createWorker: pool.createWorker,
      createTask: () => ({ data: 1 }),
    })
    const seen: string[] = []
    task.on('event', ({ event }) => {
      seen.push(event)
    })
    task.on('item', () => {
      seen.push('item')
    })
    const result = task.start()
    await vi.waitFor(() => expect(emitLate).toBeTypeOf('function'))
    const rejection = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejection
    emitLate?.()
    gate.resolve(1)
    await nextTurn()
    expect(seen).toEqual([])
    expectCleaned(pool.workers)
  })

  it('开始前取消以及预先取消的信号都不会创建 Worker', async () => {
    const controller = new AbortController()
    controller.abort()
    const pool = createPool<number, number>((value) => value)
    for (const signal of [undefined, controller.signal]) {
      const task = createWorkerTask<number, number>({
        totalItems: 1,
        signal,
        createWorker: pool.createWorker,
        createTask: () => ({ data: 1 }),
      })
      task.cancel()
      await expect(task.start()).rejects.toMatchObject({ name: 'AbortError' })
    }
    expect(pool.createWorker).not.toHaveBeenCalled()
  })

  it('首个 Worker 失败后，不发送另一个 Worker 尚在准备的输入', async () => {
    const input = deferred<{ data: number }>()
    const pool = createPool<number, number>(() => {
      throw new Error('失败')
    })
    const task = createWorkerTask<number, number>({
      totalItems: 3,
      concurrency: 2,
      createWorker: pool.createWorker,
      createTask: ({ index }) =>
        index === 0
          ? { data: index }
          : input.promise,
    })
    await expect(task.start()).rejects.toThrow('失败')
    input.resolve({ data: 1 })
    await nextTurn()
    expect(pool.workers[1].requests).toHaveLength(0)
    expectCleaned(pool.workers)
  })

  it.each(['prepare', 'send', 'factory'] as const)('%s 抛错统一清理已创建的 Worker', async (failure) => {
    const pool = createPool<number, number>(() => new Promise(() => {}))
    const task = createWorkerTask<number, number>({
      totalItems: 3,
      concurrency: 2,
      createWorker: () => {
        if (failure === 'factory' && pool.workers.length === 1) throw new Error('初始化失败')
        const worker = pool.createWorker()
        if (failure === 'send') {
          pool.workers.at(-1)!.postMessage = () => {
            throw new Error('发送失败')
          }
        }
        return worker
      },
      createTask: ({ index }) => {
        if (failure === 'prepare') throw new Error('准备失败')
        return { data: index }
      },
    })
    await expect(task.start()).rejects.toThrow(/失败/)
    expect(task.state).toBe('failed')
    expectCleaned(pool.workers)
  })

  it.each(['item', 'event', 'progress'] as const)('%s 订阅抛错进入统一失败边界', async (type) => {
    const pool = createPool<number, number, string>((value, { emit }) => {
      emit('消息')
      return value
    })
    const task = createWorkerTask<number, number, string>({
      totalItems: 2,
      concurrency: 1,
      createWorker: pool.createWorker,
      createTask: ({ index }) => ({ data: index }),
    })
    task.on(type, () => {
      throw new Error('订阅失败')
    })
    await expect(task.start()).rejects.toThrow('订阅失败')
    expect(pool.workers[0].requests).toHaveLength(1)
    expectCleaned(pool.workers)
  })

  it('误传异步订阅时明确失败，并接住监听器的拒绝，避免未处理异常', async () => {
    const pool = createPool<number, number>((value) => value)
    const task = createWorkerTask<number, number>({
      totalItems: 2,
      concurrency: 1,
      createWorker: pool.createWorker,
      createTask: ({ index }) => ({ data: index }),
    })
    task.on('item', async () => {
      throw new Error('异步订阅错误')
    })
    await expect(task.start()).rejects.toThrow('listeners must be synchronous')
    await nextTurn()
    expect(pool.workers[0].requests).toHaveLength(1)
    expectCleaned(pool.workers)
  })

  it('在完成订阅中取消，不再通知进度或派发下一项', async () => {
    const pool = createPool<number, number>((value) => value)
    const task = createWorkerTask<number, number>({
      totalItems: 2,
      concurrency: 1,
      createWorker: pool.createWorker,
      createTask: ({ index }) => ({ data: index }),
    })
    const progress: number[] = []
    task.on('item', () => {
      task.cancel()
    })
    task.on('progress', (event) => {
      progress.push(event.progress)
    })
    await expect(task.start()).rejects.toMatchObject({ name: 'AbortError' })
    expect(progress).toEqual([])
    expect(pool.workers[0].requests).toHaveLength(1)
    expectCleaned(pool.workers)
  })

  it.each(['error', 'messageerror'] as const)('Worker 原生 %s 导致统一失败', async (type) => {
    const pool = createPool<number, number>(() => new Promise(() => {}))
    const task = createWorkerTask<number, number>({
      totalItems: 2,
      concurrency: 2,
      createWorker: pool.createWorker,
      createTask: ({ index }) => ({ data: index }),
    })
    const result = task.start()
    await vi.waitFor(() => expect(pool.workers).toHaveLength(2))
    const rejection = expect(result).rejects.toThrow(
      type === 'error'
        ? '崩溃'
        : 'deserialization',
    )
    pool.workers[0].main.dispatchEvent(
      type === 'error'
        ? new ErrorEvent('error', { message: '崩溃' })
        : new MessageEvent('messageerror'),
    )
    await rejection
    expectCleaned(pool.workers)
  })

  it('空任务不启动 Worker，完成进度为 1', async () => {
    const pool = createPool<number, number>((value) => value)
    const task = createWorkerTask<number, number>({
      totalItems: 0,
      createWorker: pool.createWorker,
      createTask: () => ({ data: 0 }),
    })
    const progress: number[] = []
    task.on('progress', (event) => {
      progress.push(event.progress)
    })
    await expect(task.start()).resolves.toEqual([])
    expect(progress).toEqual([1])
    expect(pool.createWorker).not.toHaveBeenCalled()
  })

  it('输入、事件、输出使用真实结构化克隆并转移 ArrayBuffer 所有权', async () => {
    const input = new Uint8Array([1, 2, 3]).buffer
    let workerInput: ArrayBuffer | undefined
    let workerOutput: ArrayBuffer | undefined
    let workerEvent: ArrayBuffer | undefined
    const pool = createPool<ArrayBuffer, ArrayBuffer, ArrayBuffer>((buffer, { emit }) => {
      workerInput = buffer
      workerEvent = new Uint8Array([9]).buffer
      emit(workerEvent, { transfer: [workerEvent] })
      workerOutput = buffer.slice(0)
      return workerOutput
    }, { getTransferables: (result) => [result] })
    const task = createWorkerTask<ArrayBuffer, ArrayBuffer, ArrayBuffer>({
      totalItems: 1,
      createWorker: pool.createWorker,
      createTask: () => ({ data: input, transfer: [input] }),
    })
    const events: number[][] = []
    task.on('event', ({ event }) => {
      events.push([...new Uint8Array(event)])
    })
    const [output] = await task.start()
    expect(input.byteLength).toBe(0)
    expect(workerInput?.byteLength).toBe(3)
    expect(workerOutput?.byteLength).toBe(0)
    expect(workerEvent?.byteLength).toBe(0)
    expect([...new Uint8Array(output)]).toEqual([1, 2, 3])
    expect(events).toEqual([[9]])
  })

  it('结果无法克隆时自动转换为任务失败，而不是永远等待', async () => {
    const pool = createPool<number, () => void>(() => () => {})
    const task = createWorkerTask<number, () => void>({
      totalItems: 1,
      createWorker: pool.createWorker,
      createTask: () => ({ data: 1 }),
    })
    await expect(task.start()).rejects.toThrow(/clone|cloned/i)
    expectCleaned(pool.workers)
  })

  it('任务返回后旧 emit 无效，解绑适配器后抑制在途结果', async () => {
    let context: WorkerTaskContext<string> | undefined
    const pool = createPool<number, number, string>((value, current) => {
      context = current
      return value
    })
    const task = createWorkerTask<number, number, string>({
      totalItems: 1,
      createWorker: pool.createWorker,
      createTask: () => ({ data: 1 }),
    })
    await task.start()
    const count = pool.workers[0].responses.length
    context?.emit('迟到消息')
    expect(pool.workers[0].responses).toHaveLength(count)

    const gate = deferred<number>()
    const waiting = createPool<number, number>(() => gate.promise)
    const pending = createWorkerTask<number, number>({
      totalItems: 1,
      createWorker: waiting.createWorker,
      createTask: () => ({ data: 1 }),
    })
    const promise = pending.start()
    await vi.waitFor(() => expect(waiting.workers[0]?.requests).toHaveLength(1))
    waiting.workers[0].dispose()
    waiting.workers[0].dispose()
    gate.resolve(1)
    await nextTurn()
    expect(waiting.workers[0].responses).toHaveLength(0)
    const rejection = expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    pending.cancel()
    await rejection
  })

  it('无效数量和并发参数在启动前拒绝，不创建 Worker', () => {
    const pool = createPool<number, number>((value) => value)
    const options = { totalItems: 1, createWorker: pool.createWorker, createTask: () => ({ data: 1 }) }
    for (const totalItems of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 32]) {
      expect(() => createWorkerTask({ ...options, totalItems })).toThrow(RangeError)
    }
    for (const concurrency of [-1, 0, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createWorkerTask({ ...options, concurrency })).toThrow(RangeError)
    }
    expect(pool.createWorker).not.toHaveBeenCalled()
  })
})

/** 用真实适配器处理模拟 Worker 的消息，而不是在测试里复制协议实现 */
function createPool<Input, Result, CustomEvent = never>(
  handler: WorkerTaskHandler<Input, Result, CustomEvent>,
  options: Omit<DefineWorkerTaskOptions<Result>, 'scope'> = {},
) {
  const workers: TestWorker[] = []
  const createWorker = vi.fn(() => {
    const worker = new TestWorker((scope) => defineWorkerTask(handler, { ...options, scope }))
    workers.push(worker)
    return worker as unknown as Worker
  })
  return { workers, createWorker }
}

/** 异步消息桥保留原生克隆/transfer 行为，同时暴露终止和监听器资源证据 */
class TestWorker {
  readonly main = new EventTarget()
  readonly requests: unknown[] = []
  readonly responses: unknown[] = []
  readonly listeners = new Map<string, Set<EventListener>>()
  readonly dispose: () => void
  private terminated = false
  private readonly workerListeners = new Set<(event: MessageEvent) => void>()

  constructor(attach: (scope: WorkerTaskScope) => () => void) {
    const scope: WorkerTaskScope = {
      addEventListener: (_, listener) => {
        this.workerListeners.add(listener)
      },
      removeEventListener: (_, listener) => {
        this.workerListeners.delete(listener)
      },
      postMessage: (message, transferOptions) => {
        const cloned = structuredClone(message, transferOptions)
        this.responses.push(cloned)
        queueMicrotask(() => {
          this.deliver(cloned)
        })
      },
    }
    this.dispose = attach(scope)
  }

  postMessage = (message: unknown, options?: StructuredSerializeOptions) => {
    const cloned = structuredClone(message, options)
    this.requests.push(cloned)
    queueMicrotask(() => {
      if (this.terminated) return
      for (const listener of this.workerListeners) listener(new MessageEvent('message', { data: cloned }))
    })
  }

  addEventListener = (type: string, listener: EventListener) => {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
    this.main.addEventListener(type, listener)
  }

  removeEventListener = (type: string, listener: EventListener) => {
    this.listeners.get(type)?.delete(listener)
    this.main.removeEventListener(type, listener)
  }

  terminate = vi.fn(() => {
    this.terminated = true
    this.dispose()
  })

  deliver(message: unknown) {
    if (!this.terminated) this.main.dispatchEvent(new MessageEvent('message', { data: message }))
  }
}

/** 验证终止和移除事件监听器这两个真实清理副作用 */
function expectCleaned(workers: TestWorker[]) {
  for (const worker of workers) {
    expect(worker.terminate).toHaveBeenCalledTimes(1)
    expect([...worker.listeners.values()].every((listeners) => listeners.size === 0)).toBe(true)
  }
}

/** 控制任务完成时序，确保测试不依赖任务耗时猜测 */
function deferred<Value>() {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

/** 等待异步消息与准备输入的微任务全部交付 */
function nextTurn() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}
