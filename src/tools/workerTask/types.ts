/** Worker 任务控制器与 Worker 端适配器的公共类型 */

/** 一次性任务控制器的生命周期状态 */
export type WorkerTaskState = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

/** 单项任务的输入及其所有权转移列表 */
export interface WorkerTaskInput<Input> {
  data: Input
  /** 随输入转移所有权的对象；发送成功后主线程不得继续使用它们
   * @default []
   */
  transfer?: Transferable[]
}

/** Worker 任务调度配置；创建控制器时不会启动 Worker */
export interface WorkerTaskOptions<Input> {
  /** 输入项数量，必须为非负整数且不超过数组长度上限 */
  totalItems: number
  /** 每次返回一个全新、由控制器独占并负责终止的 Worker */
  createWorker: () => Worker
  /** 准备单项输入；不同 Worker 的准备过程可以并发执行 */
  createTask: (context: { index: number; signal: AbortSignal }) => WorkerTaskInput<Input> | Promise<WorkerTaskInput<Input>>
  /** 最大 Worker 数量
   * @default navigator.hardwareConcurrency，无法取得有效值时为 4
   */
  concurrency?: number
  /** 外部取消信号；取消时终止全部 Worker
   * @default undefined
   */
  signal?: AbortSignal
}

/** 调度器事件；item 表示完成事实，event 只是业务消息 */
export interface WorkerTaskEvents<Result, CustomEvent> {
  /** 结果已记录后触发一次；按完成先后通知，不按输入顺序等待 */
  item: { index: number; workerId: number; value: Result; completed: number; total: number }
  /** Worker 的 emit 消息；可以重复发生，不影响完成计数 */
  event: { index: number; workerId: number; event: CustomEvent }
  /** 完成比例；非空任务每完成一项通知一次，空任务通知 1 */
  progress: { completed: number; total: number; progress: number }
}

/** 一次性 Worker 任务控制器；重试请创建新实例 */
export interface WorkerTask<Result, CustomEvent = never> {
  readonly state: WorkerTaskState
  /** 启动任务并获得输入顺序的结果；重复调用返回同一个 Promise */
  start: () => Promise<Result[]>
  /** 幂等取消；未结束的 start() 以 AbortError 拒绝 */
  cancel: () => void
  /** 订阅未来事件，返回幂等退订函数。同步监听器抛错会使任务失败
   * 不支持异步监听器；需异步消费时请在监听器内自行管理异步操作及错误
   * 终态不再通知且释放全部订阅；历史消息不重放
   */
  on: <Key extends keyof WorkerTaskEvents<Result, CustomEvent>>(
    type: Key,
    listener: (event: WorkerTaskEvents<Result, CustomEvent>[Key]) => void,
  ) => () => void
}

/** Worker 端单项执行上下文；索引由调度器管理 */
export interface WorkerTaskContext<CustomEvent> {
  readonly index: number
  /** 发送业务消息；不代表任务完成。函数返回或适配器解绑后不再发送 */
  emit: (event: CustomEvent, options?: StructuredSerializeOptions) => void
}

/** Worker 任务函数；return 表示成功，throw / Promise 拒绝表示失败 */
export type WorkerTaskHandler<Input, Result, CustomEvent = never> = (
  input: Input,
  context: WorkerTaskContext<CustomEvent>,
) => Result | Promise<Result>

/** Worker 端消息作用域，可注入兼容作用域用于集成或测试 */
export interface WorkerTaskScope {
  addEventListener: (type: 'message', listener: (event: MessageEvent) => void) => void
  removeEventListener: (type: 'message', listener: (event: MessageEvent) => void) => void
  postMessage: (message: unknown, options?: StructuredSerializeOptions) => void
}

/** Worker 端适配器配置 */
export interface DefineWorkerTaskOptions<Result> {
  /** 监听和发送消息的作用域
   * @default Worker 内的 globalThis
   */
  scope?: WorkerTaskScope
  /** 返回结果需转移所有权的对象；仅对最终结果生效
   * @default 不转移，使用结构化克隆
   */
  getTransferables?: (result: Result) => Transferable[]
}
