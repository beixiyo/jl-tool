import { PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal } from 'solid-js'
import { debounce, throttle } from '@/tools/timer'

export function DebouncePage() {
  const [throttleInput, setThrottleInput] = createSignal('')
  const [debounceInput, setDebounceInput] = createSignal('')
  const [throttleOutput, setThrottleOutput] = createSignal('等待输入')
  const [debounceOutput, setDebounceOutput] = createSignal('等待输入')
  const [throttleCount, setThrottleCount] = createSignal(0)
  const [debounceCount, setDebounceCount] = createSignal(0)
  const updateThrottle = throttle((value: string) => { setThrottleOutput(value || '（空值）'); setThrottleCount(count => count + 1) }, 500)
  const updateDebounce = debounce((value: string) => { setDebounceOutput(value || '（空值）'); setDebounceCount(count => count + 1) }, 500)

  return (
    <PageShell title="Debounce / Throttle" description="输入事件直接调用 jl-tool 的 throttle 和 debounce，比较两种调度策略的可见结果。">
      <div class="grid gap-6 lg:grid-cols-2">
        <Panel title="Throttle · 节流" description="连续输入时按时间窗口执行，默认保留窗口末尾任务。">
          <input class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" value={throttleInput()} onInput={(event) => { const value = event.currentTarget.value; setThrottleInput(value); updateThrottle(value) }} placeholder="快速连续输入" />
          <div class="mt-5 rounded-xl bg-slate-950 p-4">
            <div class="text-xs text-slate-500">最近一次执行</div>
            <div class="mt-2 text-lg text-emerald-300">{throttleOutput()}</div>
            <div class="mt-3">
              <StatusBadge>
                {throttleCount()}
                {' '}
                次
              </StatusBadge>
            </div>
          </div>
        </Panel>
        <Panel title="Debounce · 防抖" description="停止输入 500ms 后才执行最后一次任务。">
          <input class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" value={debounceInput()} onInput={(event) => { const value = event.currentTarget.value; setDebounceInput(value); updateDebounce(value) }} placeholder="停止输入后观察结果" />
          <div class="mt-5 rounded-xl bg-slate-950 p-4">
            <div class="text-xs text-slate-500">最近一次执行</div>
            <div class="mt-2 text-lg text-sky-300">{debounceOutput()}</div>
            <div class="mt-3">
              <StatusBadge>
                {debounceCount()}
                {' '}
                次
              </StatusBadge>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}
