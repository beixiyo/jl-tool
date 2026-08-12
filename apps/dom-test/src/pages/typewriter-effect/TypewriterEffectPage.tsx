import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { typewriterEffect } from '@/tools/typewriterEffect'

const basicText = '这是一个基础的打字机效果演示，从第二个字符开始，通过 Promise 感知动画结束。'
const speedText = '速度就是激情！你可以通过调整 speed 参数来控制每个字符出现的速度。'

export function TypewriterEffectPage() {
  const [basicOutput, setBasicOutput] = createSignal('点击“开始”按钮')
  const [basicStatus, setBasicStatus] = createSignal<'idle' | 'running' | 'done' | 'stopped'>('idle')
  const [speedOutput, setSpeedOutput] = createSignal('选择一个速度')
  const [dynamicInput, setDynamicInput] = createSignal('实时更新内容，打字机也能跟上你的节奏！')
  const [dynamicOutput, setDynamicOutput] = createSignal('')
  const stops: Array<VoidFunction> = []
  const stopAt = (index: number) => stops[index]?.()
  const runBasic = () => {
    stopAt(0)
    setBasicStatus('running')
    const result = typewriterEffect({ content: basicText, continueFromIndex: 2, onUpdate: setBasicOutput })
    stops[0] = result.stop
    result.promise.then(() => setBasicStatus('done'))
  }
  const runSpeed = (speed: number) => {
    stopAt(1)
    setSpeedOutput('')
    const result = typewriterEffect({ content: speedText, speed, onUpdate: setSpeedOutput })
    stops[1] = result.stop
  }
  const runDynamic = () => {
    stopAt(2)
    const current = dynamicOutput()
    const result = typewriterEffect({ content: dynamicInput(), continueFromIndex: Math.min(current.length, dynamicInput().length), onUpdate: setDynamicOutput })
    stops[2] = result.stop
  }
  onCleanup(() => stops.forEach(stop => stop?.()))

  return (
    <PageShell title="Typewriter Effect" description="以 Solid signals 展示打字进度，并在路由离开时停止所有生产定时器。">
      <div class="grid gap-6 lg:grid-cols-2">
        <Panel title="基本用法" description="支持手动停止，并通过 promise 观察完成状态。">
          <div class="min-h-20 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-200">{basicOutput()}</div>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={runBasic}>开始</Button>
            <Button variant="danger" onClick={() => { stopAt(0); setBasicStatus('stopped') }}>停止</Button>
            <StatusBadge tone={basicStatus() === 'done'
              ? 'success'
              : basicStatus() === 'running'
                ? 'warning'
                : 'neutral'}
            >
              {basicStatus()}
            </StatusBadge>
          </div>
        </Panel>
        <Panel title="速度控制" description="相同文本使用不同 speed 参数运行。">
          <div class="min-h-20 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-200">{speedOutput()}</div>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => runSpeed(100)}>慢速 · 100ms</Button>
            <Button onClick={() => runSpeed(30)}>正常 · 30ms</Button>
            <Button onClick={() => runSpeed(10)}>快速 · 10ms</Button>
          </div>
        </Panel>
        <Panel title="动态内容" description="修改输入后，使用 continueFromIndex 衔接已有输出。" class="lg:col-span-2">
          <textarea class="min-h-24 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 outline-none focus:border-emerald-400" value={dynamicInput()} onInput={(event) => { setDynamicInput(event.currentTarget.value); runDynamic() }} />
          <div class="mt-4 min-h-20 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-200">{dynamicOutput()}</div>
          <div class="mt-4"><Button onClick={runDynamic}>重新播放</Button></div>
        </Panel>
      </div>
    </PageShell>
  )
}
