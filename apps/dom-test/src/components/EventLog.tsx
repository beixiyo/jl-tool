import { createSignal, For } from 'solid-js'

/** 带时间戳的事件日志：返回只读列表、追加与清空 */
export function createEventLog(limit = 100) {
  const [entries, setEntries] = createSignal<EventLogEntry[]>([])
  let seq = 0

  const push = (text: string, tone: EventLogTone = 'neutral') => {
    const entry = { id: ++seq, time: formatTime(new Date()), text, tone }
    setEntries(list => [entry, ...list].slice(0, limit))
  }
  const clear = () => setEntries([])

  return { entries, push, clear }
}

/** 事件日志列表，最新在上 */
export function EventLog(props: EventLogProps) {
  return (
    <div class="max-h-80 overflow-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      {props.entries.length === 0
        ? <p class="text-sm text-slate-500">暂无事件</p>
        : (
            <ul class="space-y-1 font-mono text-xs leading-5">
              <For each={props.entries}>
                {entry => (
                  <li class="flex gap-3">
                    <span class="shrink-0 text-slate-500">{entry.time}</span>
                    <span class={`break-all ${TONE_CLASS[entry.tone]}`}>{entry.text}</span>
                  </li>
                )}
              </For>
            </ul>
          )}
    </div>
  )
}

const TONE_CLASS: Record<EventLogTone, string> = {
  neutral: 'text-slate-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  danger: 'text-rose-300',
}

function formatTime(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

export type EventLogTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface EventLogEntry {
  id: number
  time: string
  text: string
  tone: EventLogTone
}

export interface EventLogProps {
  entries: EventLogEntry[]
}
