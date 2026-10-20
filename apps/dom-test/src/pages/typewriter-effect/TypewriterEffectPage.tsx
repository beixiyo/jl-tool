import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { typewriterEffect } from '@/tools/typewriterEffect'

const basicText = '这是一个基础的打字机效果演示，从第二个字符开始，通过 Promise 感知动画结束。'
const streamChunks = [
  '好的，我来帮你',
  '整理一下这次会议的要点：\n\n1. 本周五前完成方案评审',
  '；\n2. 设计稿下周一交付',
  '；\n3. 后端接口联调排在周三。',
  '\n\n还有什么需要补充的吗？',
]
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

  /** 流式场景：模拟服务端分块到达，打字机随到随打 */
  const [streamOutput, setStreamOutput] = createSignal('点击“模拟流式回答”')
  const [streamStatus, setStreamStatus] = createSignal<'idle' | 'streaming' | 'ending' | 'done'>('idle')

  let streamTimers: Array<ReturnType<typeof setTimeout>> = []
  let streamTyper: ReturnType<typeof typewriterEffect> | undefined
  let streamReceived = ''

  const clearStreamTimers = () => {
    streamTimers.forEach(clearTimeout)
    streamTimers = []
  }

  const resetStream = () => {
    clearStreamTimers()
    streamTyper?.stop()
    streamReceived = ''
    setStreamOutput('')
    streamTyper = typewriterEffect({ content: '', streaming: true, onUpdate: setStreamOutput })
    const typer = streamTyper
    setStreamStatus('streaming')
    typer.promise.then(() => {
      if (streamTyper === typer) setStreamStatus('done')
    })
    return typer
  }

  const pushChunk = (chunk: string) => {
    if (!streamTyper || streamStatus() !== 'streaming') return
    streamReceived += chunk
    streamTyper.update(streamReceived)
  }

  const endStream = () => {
    if (streamStatus() !== 'streaming') return
    clearStreamTimers()
    setStreamStatus('ending')
    streamTyper?.end()
  }

  /** 块间隔故意不均匀，能看到“追上后等待、新块来了接着打” */
  const runStream = () => {
    resetStream()
    let delay = 0
    streamChunks.forEach((chunk, index) => {
      delay += index === 0
		? 0
		: 400 + (index % 3) * 700
      streamTimers.push(setTimeout(() => pushChunk(chunk), delay))
    })
    streamTimers.push(setTimeout(endStream, delay + 300))
  }

  /** 一次性涌入远超打字速度的大段文本，观察落后超过 maxLag（默认 200）后自动跳过 */
  const runFastStream = () => {
    const typer = resetStream()
    const chunk = '这是一段到达速度远超打字速度的文本，'
    let sent = 0
    const timer = setInterval(() => {
      if (sent >= 30 || streamStatus() !== 'streaming') {
        clearInterval(timer)
        endStream()
        return
      }
      sent += 1
      streamReceived += chunk
      typer.update(streamReceived)
    }, 100)
    streamTimers.push(timer as unknown as ReturnType<typeof setTimeout>)
  }

  const flushStream = () => {
    clearStreamTimers()
    streamReceived = streamChunks.join('')
    streamTyper?.update(streamReceived)
    streamTyper?.flush()
  }

  onCleanup(() => {
    stops.forEach(stop => stop?.())
    clearStreamTimers()
    streamTyper?.stop()
  })

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
        <Panel title="流式文本" description="streaming: true，服务端分块到达时 update 追加；追上后等待，end() 后打完剩余字符才完成。切到其他标签页再回来，进度按时间补偿。" class="lg:col-span-2">
          <div class="min-h-32 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-200">{streamOutput()}</div>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={runStream}>模拟流式回答</Button>
            <Button onClick={runFastStream}>模拟出字过快（maxLag）</Button>
            <Button onClick={endStream}>end()</Button>
            <Button variant="danger" onClick={flushStream}>flush()</Button>
            <StatusBadge tone={streamStatus() === 'done'
              ? 'success'
              : streamStatus() === 'idle'
                ? 'neutral'
                : 'warning'}
            >
              {streamStatus()}
            </StatusBadge>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}
