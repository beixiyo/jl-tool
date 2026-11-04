/** 主线程与配套 Worker 之间的内部协议；业务消息嵌套在 event 内，避免类型冲突 */

export const workerTaskChannel = '@jl-org/tool/worker-task/v1'

/** 识别属于本适配器的消息，其余消息不接管 */
export function isWorkerTaskMessage(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && 'channel' in value
    && value.channel === workerTaskChannel
}

/** 将跨线程异常归一化为可克隆的信息 */
export function serializeWorkerTaskError(error: unknown): SerializedWorkerTaskError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }

  return { name: 'Error', message: String(error) }
}

type SerializedWorkerTaskError = {
  name: string
  message: string
  stack?: string
}

export type WorkerTaskRequest<Input> = {
  channel: typeof workerTaskChannel
  type: 'run'
  index: number
  input: Input
}

export type WorkerTaskResponse<Result, CustomEvent> =
  & {
    channel: typeof workerTaskChannel
    index: number
  }
  & (
    | { type: 'result'; value: Result }
    | { type: 'event'; event: CustomEvent }
    | { type: 'error'; error: SerializedWorkerTaskError }
  )
