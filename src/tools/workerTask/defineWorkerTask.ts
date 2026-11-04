/** 将普通任务函数接入 Worker 协议，自动把返回值、异常及业务事件发送给调度器 */
import type { WorkerTaskRequest, WorkerTaskResponse } from './protocol'
import { isWorkerTaskMessage, serializeWorkerTaskError, workerTaskChannel } from './protocol'
import type { DefineWorkerTaskOptions, WorkerTaskHandler, WorkerTaskScope } from './types'

/**
 * 在 Worker 中注册单项处理函数；每个作用域只应注册一个适配器
 * 返回幂等解绑函数；解绑后抑制在途结果和事件，但不会中断处理函数自身的副作用
 * Worker 的真正终止由主线程控制器负责
 */
export function defineWorkerTask<Input, Result, CustomEvent = never>(
  handler: WorkerTaskHandler<Input, Result, CustomEvent>,
  options: DefineWorkerTaskOptions<Result> = {},
): () => void {
  const { scope = globalThis as unknown as WorkerTaskScope, getTransferables } = options
  let disposed = false
  let active: { index: number } | undefined

  const post = (message: WorkerTaskResponse<Result, CustomEvent>, transferOptions?: StructuredSerializeOptions) => {
    scope.postMessage(message, transferOptions)
  }

  const run = async (request: WorkerTaskRequest<Input>) => {
    const execution = { index: request.index }
    active = execution

    try {
      const value = await handler(request.input, {
        index: request.index,
        emit: (event, transferOptions) => {
          if (disposed || active !== execution) return

          post({ channel: workerTaskChannel, type: 'event', index: request.index, event }, transferOptions)
        },
      })

      if (disposed) return

      const transfer = getTransferables?.(value) ?? []
      post({ channel: workerTaskChannel, type: 'result', index: request.index, value }, { transfer })
    }
    catch (error) {
      if (!disposed) {
        try {
          post({
            channel: workerTaskChannel,
            type: 'error',
            index: request.index,
            error: serializeWorkerTaskError(error),
          })
        }
        catch (sendError) {
          // 连错误消息都无法发送时，通过 Worker 原生 error 事件通知主线程
          queueMicrotask(() => {
            throw sendError
          })
        }
      }
    }
    finally {
      if (active === execution) active = undefined
    }
  }

  const onMessage = ({ data }: MessageEvent<unknown>) => {
    if (disposed || !isWorkerTaskMessage(data)) return

    if (data.type !== 'run' || !Number.isSafeInteger(data.index) || (data.index as number) < 0 || !('input' in data)) {
      throw new Error('Invalid Worker task request')
    }
    if (active) throw new Error('Worker received a task while another task is running')

    void run(data as WorkerTaskRequest<Input>)
  }

  scope.addEventListener('message', onMessage)

  return () => {
    if (disposed) return

    disposed = true
    active = undefined
    scope.removeEventListener('message', onMessage)
  }
}
