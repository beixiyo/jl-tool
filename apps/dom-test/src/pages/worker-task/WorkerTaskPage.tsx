/** Worker 任务控制器的交互演示与生命周期管理。 */
import { createWorkerTask } from '@/tools/workerTask'
import type { WorkerTask, WorkerTaskState } from '@/tools/workerTask'
import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, For, onCleanup, Show } from 'solid-js'
import type { DemoEvent, DemoInput, DemoResult } from './demo.types'

const fieldClass = 'mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 disabled:opacity-50'
const LOG_LIMIT = 60

/** 展示单项事件、完成结果和整轮控制器状态。 */
export function WorkerTaskPage() {
  const [count, setCount] = createSignal('6')
  const [concurrency, setConcurrency] = createSignal('3')
  const [failure, setFailure] = createSignal('none')
  const [state, setState] = createSignal<WorkerTaskState | 'uncreated'>('uncreated')
  const [items, setItems] = createSignal<ItemView[]>([])
  const [progress, setProgress] = createSignal({ completed: 0, total: 0, progress: 0 })
  const [arrival, setArrival] = createSignal<number[]>([])
  const [results, setResults] = createSignal<DemoResult[]>()
  const [log, setLog] = createSignal<string[]>([])
  const [error, setError] = createSignal('')
  let task: WorkerTask<DemoResult, DemoEvent> | undefined
  let unsubscribers: (() => void)[] = []
  let session = 0

  /** 作废当前会话，退订并取消控制器，防止旧异步结果回写。 */
  const dispose = () => {
    session++
    unsubscribers.forEach((unsubscribe) => unsubscribe())
    unsubscribers = []
    task?.cancel()
    task = undefined
  }
  onCleanup(dispose)

  /** 创建一次性控制器并在启动前订阅全部事件。 */
  const create = () => {
    dispose()
    const id = session
    const total = Number(count())
    const failIndex = failure() === 'none' ? -1 : Number(failure())
    const controller = createWorkerTask<DemoInput, DemoResult, DemoEvent>({
      totalItems: total,
      concurrency: Number(concurrency()),
      createWorker: () => new Worker(new URL('./demo.worker.ts', import.meta.url), { type: 'module' }),
      // 较早的任务更慢，默认并发下便于观察乱序完成。
      createTask: ({ index }) => ({ data: { delay: [2400, 900, 1500][index % 3], fail: index === failIndex } }),
    })
    task = controller
    setState(controller.state)
    setItems(Array.from({ length: total }, () => ({ stage: 0, done: false })))
    setProgress({ completed: 0, total, progress: 0 })
    setArrival([])
    setResults(undefined)
    setLog([])
    setError('')
    unsubscribers = [
      controller.on('event', ({ index, workerId, event }) => {
        if (session !== id) return
        setItems((current) => current.map((item, i) => i === index ? { ...item, stage: event.stage, workerId } : item))
        setLog((current) => [`任务 ${index} · Worker ${workerId} · 阶段 ${event.stage}/${event.totalStages}`, ...current].slice(0, LOG_LIMIT))
      }),
      controller.on('item', ({ index, workerId, value }) => {
        if (session !== id) return
        setItems((current) => current.map((item, i) => i === index ? { ...item, done: true, workerId, result: value } : item))
        setArrival((current) => [...current, index])
      }),
      controller.on('progress', (value) => {
        if (session === id) setProgress(value)
      }),
    ]
  }

  /** 启动当前控制器，并仅在会话仍有效时写回终态。 */
  const start = async () => {
    const controller = task
    if (!controller || controller.state !== 'idle') return
    const id = session
    const promise = controller.start()
    setState(controller.state)
    try {
      const value = await promise
      if (session === id) setResults(value)
    }
    catch (reason) {
      if (session === id) setError(reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason))
    }
    finally {
      if (session === id) {
        setState(controller.state)
        unsubscribers.forEach((unsubscribe) => unsubscribe())
        unsubscribers = []
      }
    }
  }

  const cancel = () => {
    task?.cancel()
    if (task) setState(task.state)
  }
  const locked = () => state() === 'idle' || state() === 'running'

  return (
    <PageShell title="Worker Task" description="真实 module Worker 并发处理独立计算任务。观察业务事件、完成通知与最终结果之间的区别。">
      <Panel title="配置与控制" description="创建控制器不会创建 Worker；开始后才分配。控制器为一次性实例，重新运行需重新创建。">
        <div class="grid gap-4 sm:grid-cols-3">
          <label class="text-sm text-slate-300">
            任务数量
            <select
              class={ fieldClass }
              value={ count() }
              disabled={ locked() }
              onChange={ (e) => {
                setCount(e.currentTarget.value)
                setFailure('none')
              } }
            >
              <For each={ [3, 6, 9, 12] }>{ (n) => <option value={ n }>{ n } 项</option> }</For>
            </select>
          </label>
          <label class="text-sm text-slate-300">
            并发 Worker
            <select class={ fieldClass } value={ concurrency() } disabled={ locked() } onChange={ (e) => setConcurrency(e.currentTarget.value) }>
              <For each={ [1, 2, 3, 4] }>{ (n) => <option value={ n }>{ n } 个</option> }</For>
            </select>
          </label>
          <label class="text-sm text-slate-300">
            注入失败
            <select class={ fieldClass } value={ failure() } disabled={ locked() } onChange={ (e) => setFailure(e.currentTarget.value) }>
              <option value="none">不失败</option>
              <For each={ Array.from({ length: Number(count()) }, (_, i) => i) }>{ (i) => <option value={ i }>任务 { i }</option> }</For>
            </select>
          </label>
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <Button onClick={ create } disabled={ state() === 'running' }>{ state() === 'uncreated' ? '创建控制器' : '重新创建控制器' }</Button>
          <Button variant="primary" onClick={ start } disabled={ state() !== 'idle' }>开始</Button>
          <Button variant="danger" onClick={ cancel } disabled={ !locked() }>取消</Button>
        </div>
        <p class="mt-3 text-xs leading-5 text-slate-500">运行期间配置锁定。取消、失败或完成后可修改配置，再创建新控制器。</p>
      </Panel>

      <Panel title="本轮状态" description="整体进度只计成功完成的任务；单项阶段来自 Worker 的自定义事件。">
        <div class="flex flex-wrap items-center gap-3" aria-live="polite">
          <StatusBadge tone={ state() === 'completed' ? 'success' : state() === 'failed' ? 'danger' : state() === 'running' ? 'warning' : 'neutral' }>
            { state() }
          </StatusBadge>
          <span class="text-sm text-slate-300">{ progress().completed } / { progress().total } 完成 · { Math.round(progress().progress * 100) }%</span>
        </div>
        <progress class="mt-4 h-2 w-full accent-emerald-400" max="1" value={ progress().progress } aria-label="整体完成进度" />
        <Show when={ error() }>
          <p class="mt-3 break-words text-sm text-rose-300" role="alert">{ error() }</p>
        </Show>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <For each={ items() } fallback={ <p class="text-sm text-slate-500">创建控制器后显示任务。</p> }>
            { (item, index) => (
              <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div class="flex justify-between gap-2 text-sm">
                  <span class="font-semibold">任务 { index() }</span>
                  <span class={ item.done ? 'text-emerald-300' : 'text-slate-400' }>
                    { item.done
                      ? '已完成'
                      : state() === 'cancelled'
                      ? '已取消'
                      : state() === 'failed'
                      ? '已停止（本轮失败）'
                      : item.stage
                      ? '处理中'
                      : '等待中' }
                  </span>
                </div>
                <progress class="mt-3 h-1.5 w-full accent-sky-400" max="3" value={ item.stage } aria-label={ `任务 ${index()} 阶段进度` } />
                <p class="mt-2 text-xs text-slate-500">event 阶段 { item.stage }/3{ item.workerId !== undefined ? ` · Worker ${item.workerId}` : '' }</p>
                <Show when={ item.result }>
                  { (result) => <p class="mt-2 break-words font-mono text-xs text-emerald-300">item checksum { result().checksum }</p> }
                </Show>
              </div>
            ) }
          </For>
        </div>
      </Panel>
      <div class="grid gap-6 lg:grid-cols-2">
        <Panel title="完成顺序 · item" description="item 由库在单项成功返回后自动发送，每项一次；全局仍可能随后失败。">
          <p class="break-words font-mono text-sm leading-7 text-emerald-300">{ arrival().length ? arrival().join(' → ') : '尚无完成项' }</p>
          <h3 class="mt-5 text-sm font-semibold text-slate-200">最终结果 · 输入顺序</h3>
          <Show when={ results() } fallback={ <p class="mt-2 text-sm text-slate-500">仅全部成功后返回结果数组。</p> }>
            { (value) => (
              <ol class="mt-2 space-y-1 font-mono text-sm text-slate-300">
                <For each={ value() }>{ (result) => <li>任务 { result.index } · checksum { result.checksum } · { result.delay } ms</li> }</For>
              </ol>
            ) }
          </Show>
        </Panel>
        <Panel title="业务事件 · event" description="event 是 Worker 的 emit，可多次发送，不代表完成。仅保留最新 60 条。">
          <ul class="max-h-72 space-y-2 overflow-auto font-mono text-xs leading-5 text-slate-400" aria-label="业务事件日志">
            <For each={ log() } fallback={ <li>尚无事件</li> }>{ (entry) => <li>{ entry }</li> }</For>
          </ul>
        </Panel>
      </div>
    </PageShell>
  )
}

interface ItemView {
  stage: number
  done: boolean
  workerId?: number
  result?: DemoResult
}
