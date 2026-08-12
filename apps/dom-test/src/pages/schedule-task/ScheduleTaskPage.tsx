import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, For, onCleanup, onMount } from 'solid-js'
import { scheduleTask } from '@/tools/scheduleTask'

const NODE_COUNT = 4000
const NODES_PER_TASK = 20
const TASK_COUNT = NODE_COUNT / NODES_PER_TASK
const LONG_FRAME_MS = 34

export function ScheduleTaskPage() {
  const [nodes, setNodes] = createSignal<DemoNode[]>([])
  const [mode, setMode] = createSignal<RunMode>('idle')
  const [completed, setCompleted] = createSignal(0)
  const [results, setResults] = createSignal<RunResults>({})
  const [probeFrame, setProbeFrame] = createSignal(0)
  let nodeGrid: HTMLDivElement | undefined
  let probe: HTMLDivElement | undefined
  let animationFrame = 0
  let runId = 0

  onMount(() => {
    let direction = 1
    let position = 0

    const animateProbe = () => {
      position += direction * 1.25
      if (position >= 92 || position <= 0)
        direction *= -1

      if (probe) {
        probe.style.left = `${position}%`
        probe.style.width = `${28 + position / 4}px`
        void probe.offsetWidth
      }
      setProbeFrame(value => value + 1)
      animationFrame = requestAnimationFrame(animateProbe)
    }

    animationFrame = requestAnimationFrame(animateProbe)
  })

  onCleanup(() => {
    runId++
    cancelAnimationFrame(animationFrame)
  })

  const run = async (nextMode: Exclude<RunMode, 'idle'>) => {
    if (mode() !== 'idle')
      return

    const currentRunId = ++runId
    setNodes([])
    setCompleted(0)
    setMode(nextMode)

    await nextFrame()
    const frameMonitor = monitorFrames()
    const startedAt = performance.now()
    const tasks = createTasks({
      shouldContinue: () => currentRunId === runId,
      appendNodes: batch => setNodes(current => [...current, ...batch]),
      afterTask: value => setCompleted(value),
      forceLayout: () => nodeGrid?.offsetHeight,
    })

    if (nextMode === 'scheduled') {
      await scheduleTask(tasks, () => currentRunId !== runId)
    }
    else {
      for (const task of tasks)
        await task()
    }

    await nextFrame()
    if (currentRunId !== runId)
      return

    setResults(current => ({
      ...current,
      [nextMode]: {
        duration: performance.now() - startedAt,
        ...frameMonitor.stop(),
      },
    }))
    setMode('idle')
  }

  const reset = () => {
    runId++
    setNodes([])
    setCompleted(0)
    setResults({})
    setMode('idle')
  }

  return (
    <PageShell title="scheduleTask" description="对比同步执行与时间片调度在大量 DOM 创建和主线程计算下的页面流畅性。">
      <Panel
        title="主线程流畅度探针"
        description="绿色方块由 JavaScript 每帧修改 left 和 width，并读取布局尺寸。它依赖主线程布局与绘制，主线程阻塞时会直接停住。"
      >
        <div class="relative h-14 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div ref={probe} class="absolute top-3 h-8 rounded-md bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]" />
        </div>
        <p class="mt-3 text-xs text-slate-500">
          已绘制帧：
          <span class="font-mono text-slate-300">{probeFrame().toLocaleString()}</span>
        </p>
      </Panel>

      <div class="grid gap-6 lg:grid-cols-2">
        <Panel title="A · 同步执行" description="在一个连续循环中完成全部任务，期间不会主动把主线程交还给浏览器。">
          <Button onClick={() => run('blocking')} disabled={mode() !== 'idle'}>同步创建 4,000 个节点</Button>
        </Panel>
        <Panel title="B · 时间片调度" description="工作量完全相同，但每个小任务由生产代码 scheduleTask 分批启动。">
          <Button variant="primary" onClick={() => run('scheduled')} disabled={mode() !== 'idle'}>调度创建 4,000 个节点</Button>
        </Panel>
      </div>

      <Panel title="本轮结果" description="重点比较最长帧间隔和长帧数量；总耗时变长是调度主动让出主线程的正常代价。">
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge tone={mode() === 'idle'
            ? 'neutral'
            : 'warning'}
          >
            {mode() === 'blocking'
              ? '同步执行中'
              : mode() === 'scheduled'
                ? '调度执行中'
                : '等待测试'}
          </StatusBadge>
          <span class="text-sm text-slate-400">
            {completed().toLocaleString()}
            {' '}
            /
            {TASK_COUNT.toLocaleString()}
            {' '}
            个任务
          </span>
          <Button onClick={reset} disabled={mode() !== 'idle'} class="ml-auto">清空</Button>
        </div>

        <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
          <div class="h-full rounded-full bg-emerald-400" style={{ width: `${completed() / TASK_COUNT * 100}%` }} />
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          <ResultCard title="A · 同步执行" result={results().blocking} />
          <ResultCard title="B · 时间片调度" result={results().scheduled} />
        </div>
      </Panel>

      <Panel title="真实 DOM 节点" description="每个色块都是 Solid 渲染的独立节点；任务还会读取容器高度，确保布局工作真实发生。">
        <div ref={nodeGrid} class="grid max-h-72 grid-cols-[repeat(auto-fill,minmax(12px,1fr))] gap-1 overflow-auto rounded-xl bg-slate-950 p-3">
          <For each={nodes()}>
            {node => (
              <div
                class="h-3 rounded-sm"
                style={{
                  'width': `${8 + node.weight % 8}px`,
                  'background-color': `hsl(${node.hue} 65% 55%)`,
                }}
                title={`节点 ${node.id}`}
              />
            )}
          </For>
        </div>
      </Panel>
    </PageShell>
  )
}

function Metric(props: MetricProps) {
  return (
    <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div class="text-sm text-slate-400">{props.label}</div>
      <div class={`mt-2 font-mono text-xl ${props.warning
        ? 'text-amber-300'
        : 'text-emerald-300'}`}
      >
        {props.value}
      </div>
    </div>
  )
}

function ResultCard(props: ResultCardProps) {
  return (
    <section class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <h3 class="text-sm font-semibold text-slate-200">{props.title}</h3>
      {props.result
        ? (
            <div class="mt-3 grid gap-3 sm:grid-cols-3">
              <Metric label="总耗时" value={`${props.result.duration.toFixed(0)} ms`} />
              <Metric label="最长帧间隔" value={`${props.result.maxFrame.toFixed(1)} ms`} warning={props.result.maxFrame > LONG_FRAME_MS} />
              <Metric label="长帧数量" value={`${props.result.longFrames} 帧`} warning={props.result.longFrames > 0} />
            </div>
          )
        : <p class="mt-3 text-sm text-slate-600">尚未运行</p>}
    </section>
  )
}

function createTasks(options: CreateTasksOptions) {
  return Array.from({ length: TASK_COUNT }, (_, taskIndex) => async () => {
    if (!options.shouldContinue())
      return taskIndex

    const offset = taskIndex * NODES_PER_TASK
    const batch = Array.from({ length: NODES_PER_TASK }, (_, index) => createDemoNode(offset + index))
    options.appendNodes(batch)
    void options.forceLayout()
    options.afterTask(taskIndex + 1)
    return taskIndex
  })
}

function createDemoNode(id: number): DemoNode {
  let weight = id + 1
  for (let index = 0; index < 1800; index++)
    weight = Math.sin(weight) * Math.cos(index + weight) * 10000

  return {
    id,
    hue: Math.abs(Math.round(weight)) % 120 + 140,
    weight: Math.abs(Math.round(weight)),
  }
}

function monitorFrames() {
  let frameId = 0
  let lastFrame = performance.now()
  let maxFrame = 0
  let longFrames = 0

  const measure = (now: number) => {
    const frameTime = now - lastFrame
    maxFrame = Math.max(maxFrame, frameTime)
    if (frameTime > LONG_FRAME_MS)
      longFrames++
    lastFrame = now
    frameId = requestAnimationFrame(measure)
  }
  frameId = requestAnimationFrame(measure)

  return {
    stop() {
      cancelAnimationFrame(frameId)
      return { maxFrame, longFrames }
    },
  }
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

interface DemoNode {
  id: number
  hue: number
  weight: number
}

interface CreateTasksOptions {
  shouldContinue: () => boolean
  appendNodes: (nodes: DemoNode[]) => void
  afterTask: (completed: number) => void
  forceLayout: () => number | undefined
}

interface MetricProps {
  label: string
  value: string
  warning?: boolean
}

interface RunResult {
  duration: number
  maxFrame: number
  longFrames: number
}

interface ResultCardProps {
  title: string
  result?: RunResult
}

interface RunResults {
  blocking?: RunResult
  scheduled?: RunResult
}

type RunMode = 'idle' | 'blocking' | 'scheduled'
