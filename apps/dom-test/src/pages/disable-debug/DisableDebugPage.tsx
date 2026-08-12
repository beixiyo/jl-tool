import type { DebugDetectionEvent } from '@/tools/disableDebug'
import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, For, onCleanup } from 'solid-js'
import { disableDebug } from '@/tools/disableDebug'

const DEBUG_PASSWORD = 'debug-demo'

export function DisableDebugPage() {
  const [enabled, setEnabled] = createSignal(false)
  const [disableMenu, setDisableMenu] = createSignal(true)
  const [disableF12, setDisableF12] = createSignal(true)
  const [detectWindowSize, setDetectWindowSize] = createSignal(false)
  const [redirectOnDetected, setRedirectOnDetected] = createSignal(false)
  const [events, setEvents] = createSignal<DebugDetectionEvent[]>([])
  let cleanup: (() => void) | undefined

  const start = () => {
    cleanup?.()
    cleanup = disableDebug({
      secret: DEBUG_PASSWORD,
      disableMenu: disableMenu(),
      disableF12: disableF12(),
      detectDebugger: false,
      detectWindowSize: detectWindowSize(),
      windowSizeMatchCount: 2,
      redirectOnDetected: redirectOnDetected(),
      onDetected: event => setEvents(current => [event, ...current].slice(0, 8)),
    })
    setEnabled(true)
  }

  const stop = () => {
    cleanup?.()
    cleanup = undefined
    setEnabled(false)
  }

  onCleanup(stop)

  return (
    <PageShell title="disableDebug" description="在当前页面试用快捷键、右键菜单和窗口尺寸检测。密码仅用于本地解锁演示，不是安全鉴权。">
      <Panel title="测试说明" description="启动后按 Shift + D 打开解锁窗口，密码为 debug-demo。输入密码会刷新页面并暂时解除限制。">
        <div class="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
          <Hint title="快捷键" text="F12 / DevTools 组合键" />
          <Hint title="右键菜单" text="阻止 contextmenu" />
          <Hint title="检测回调" text="记录疑似调试事件" />
        </div>
      </Panel>

      <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel title="运行配置" description="修改配置后需要先停止，再重新启动。">
          <div class="space-y-3 text-sm">
            <Toggle checked={disableF12()} onChange={setDisableF12}>拦截 F12 和 DevTools 快捷键</Toggle>
            <Toggle checked={disableMenu()} onChange={setDisableMenu}>禁用右键菜单</Toggle>
            <Toggle checked={detectWindowSize()} onChange={setDetectWindowSize}>启用窗口尺寸检测（连续命中 2 次）</Toggle>
            <Toggle checked={redirectOnDetected()} onChange={setRedirectOnDetected}>检测后跳转 about:blank</Toggle>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-3">
            {!enabled()
              ? <Button variant="primary" onClick={start}>启动限制</Button>
              : <Button variant="danger" onClick={stop}>停止限制</Button>}
            <StatusBadge tone={enabled()
              ? 'success'
              : 'neutral'}
            >
              {enabled()
                ? '运行中'
                : '未启动'}
            </StatusBadge>
          </div>
        </Panel>

        <Panel title="当前参数">
          <dl class="space-y-3 text-sm">
            <Value label="解锁快捷键" value="Shift + D" />
            <Value label="调试密码" value={DEBUG_PASSWORD} />
            <Value label="保存位置" value="sessionStorage" />
            <Value label="debugger 检测" value="本页面关闭" />
          </dl>
        </Panel>
      </div>

      <Panel title="检测事件" description="只有启用窗口尺寸检测并且连续满足阈值时，才会在这里看到事件。">
        {events().length === 0
          ? <p class="text-sm text-slate-500">暂无事件</p>
          : (
              <div class="space-y-2">
                <For each={events()}>
                  {event => <pre class="overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-400">{JSON.stringify(event, null, 2)}</pre>}
                </For>
              </div>
            )}
      </Panel>
    </PageShell>
  )
}

function Hint(props: { title: string, text: string }) {
  return (
    <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div class="font-medium text-slate-200">{props.title}</div>
      <div class="mt-1 text-xs">{props.text}</div>
    </div>
  )
}

function Toggle(props: { checked: boolean, onChange: (checked: boolean) => void, children: string }) {
  return (
    <label class="flex cursor-pointer items-center gap-3 text-slate-300">
      <input type="checkbox" checked={props.checked} onChange={event => props.onChange(event.currentTarget.checked)} class="h-4 w-4 accent-emerald-400" />
      {props.children}
    </label>
  )
}

function Value(props: { label: string, value: string }) {
  return (
    <div>
      <dt class="text-xs text-slate-500">{props.label}</dt>
      <dd class="mt-1 font-mono text-sm text-emerald-300">{props.value}</dd>
    </div>
  )
}
