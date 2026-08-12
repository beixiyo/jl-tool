import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import { applyAnimation } from '@/animation/applyAnimation'
import { Clock } from '@/tools/Clock'

const metrics = [
  { name: 'now', label: '当前时间', unit: '毫秒' },
  { name: 'startTime', label: '开始时间', unit: '毫秒' },
  { name: 'curTime', label: '本次采样时间', unit: '毫秒' },
  { name: 'elapsedMS', label: '累计运行时长', unit: '毫秒' },
  { name: 'elapsed', label: '累计运行时长', unit: '秒' },
  { name: 'deltaMS', label: '帧间隔', unit: '毫秒' },
  { name: 'delta', label: '帧间隔', unit: '秒' },
  { name: 'pausedAt', label: '暂停时间', unit: '毫秒' },
  { name: 'pausedDuration', label: '累计暂停时长', unit: '毫秒' },
  { name: 'lastUpdateAt', label: '上次更新时间', unit: '毫秒' },
  { name: 'isStarted', label: '已经启动' },
  { name: 'isRunning', label: '正在运行' },
  { name: 'isPaused', label: '已经暂停' },
  { name: 'autoUpdate', label: '自动更新' },
] as const

export function ClockPage() {
  const clock = new Clock()
  const [autoUpdate, setAutoUpdate] = createSignal(true)
  const [revision, setRevision] = createSignal(0)
  const [events, setEvents] = createSignal<string[]>(['Clock created with autoStart=true'])

  const snapshot = createMemo(() => {
    revision()
    return {
      now: clock.now.toFixed(2),
      startTime: clock.startTime.toFixed(2),
      curTime: clock.curTime.toFixed(2),
      elapsedMS: clock.elapsedMS.toFixed(2),
      elapsed: clock.elapsed.toFixed(3),
      deltaMS: clock.deltaMS.toFixed(2),
      delta: clock.delta.toFixed(4),
      pausedAt: clock.pausedAt === undefined
        ? '--'
        : clock.pausedAt.toFixed(2),
      pausedDuration: clock.pausedDuration.toFixed(2),
      lastUpdateAt: clock.lastUpdateAt.toFixed(2),
      isStarted: String(clock.isStarted),
      isRunning: String(clock.isRunning),
      isPaused: String(clock.isPaused),
      autoUpdate: String(autoUpdate()),
    }
  })

  const log = (message: string) => {
    setEvents(current => [`${new Date().toLocaleTimeString()} · ${message}`, ...current].slice(0, 12))
    setRevision(value => value + 1)
  }

  onMount(() => {
    const stop = applyAnimation(() => {
      if (autoUpdate())
        clock.update()
      setRevision(value => value + 1)
    })
    onCleanup(() => {
      stop()
      clock.reset()
    })
  })

  const invoke = (name: 'start' | 'pause' | 'resume' | 'reset' | 'update') => {
    clock[name]()
    log(`${name}()${name === 'update'
      ? ` → deltaMS: ${clock.deltaMS.toFixed(2)}`
      : ''}`)
  }

  return (
    <PageShell title="Clock" description="观察同一个 Clock 实例的时间采样、暂停恢复和显式帧间隔更新。">
      <Panel title="运行状态" description="自动更新会使用 jl-tool 的 applyAnimation 驱动 Clock.update()。">
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <StatusBadge tone={snapshot().isRunning === 'true'
            ? 'success'
            : snapshot().isPaused === 'true'
              ? 'warning'
              : 'neutral'}
          >
            {snapshot().isRunning === 'true'
              ? 'running'
              : snapshot().isPaused === 'true'
                ? 'paused'
                : 'stopped'}
          </StatusBadge>
          <span class="text-sm text-slate-400">
            自动更新：
            {snapshot().autoUpdate}
          </span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <For each={metrics}>
            {metric => (
              <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="text-sm font-medium text-slate-300">{metric.label}</span>
                  <code class="text-xs text-slate-600">{metric.name}</code>
                </div>
                <div class="mt-2 flex items-baseline gap-2">
                  <span class="break-all font-mono text-lg text-emerald-300">{snapshot()[metric.name]}</span>
                  {'unit' in metric && <span class="text-xs text-slate-500">{metric.unit}</span>}
                </div>
              </div>
            )}
          </For>
        </div>
      </Panel>
      <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel title="控制器">
          <div class="flex flex-wrap gap-2">
            <Button onClick={() => invoke('start')}>start</Button>
            <Button onClick={() => invoke('pause')}>pause</Button>
            <Button onClick={() => invoke('resume')}>resume</Button>
            <Button onClick={() => invoke('reset')}>reset</Button>
            <Button onClick={() => invoke('update')}>manual update</Button>
            <Button variant="primary" onClick={() => { setAutoUpdate(value => !value); log(`autoUpdate = ${!autoUpdate()}`) }}>
              toggle auto update
            </Button>
          </div>
        </Panel>
        <Panel title="事件记录">
          <pre class="max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-400">{events().join('\n')}</pre>
        </Panel>
      </div>
    </PageShell>
  )
}
