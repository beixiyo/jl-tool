import type { PcmCaptureState, PcmCaptureSummary } from '@jl-org/tool'
import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { PcmCapture } from '@jl-org/tool'

type ViewState = PcmCaptureState | 'error'

/** 使用真实 AudioContext、Oscillator 和 AudioWorklet 验证 PCM 采集链路 */
export function PcmCapturePage() {
  const [state, setState] = createSignal<ViewState>('idle')
  const [message, setMessage] = createSignal('等待创建合成音源')
  const [frames, setFrames] = createSignal(0)
  const [bytes, setBytes] = createSignal(0)
  const [level, setLevel] = createSignal(0)
  const [format, setFormat] = createSignal('—')
  const [hasCapture, setHasCapture] = createSignal(false)
  let capture: PcmCapture | null = null

  const destroy = async () => {
    const currentCapture = capture
    capture = null
    setHasCapture(false)
    await currentCapture?.destroy()
    setState('destroyed')
    setMessage('AudioContext 与合成音源均已释放')
  }

  const prepare = async () => {
    if (capture) return
    try {
      setMessage('正在加载包内 AudioWorklet…')
      const context = new AudioContext()
      const source = context.createOscillator()
      source.frequency.value = 440
      source.start()
      capture = new PcmCapture({
        source: { kind: 'audio-node', node: source },
        audioContext: { instance: context, closeOnDestroy: true },
        format: { channelCount: 1, encoding: 's16le', frameDurationMs: 50 },
        levelMeter: { intervalMs: 50 },
        onFrame: (frame) => {
          setFrames(value => value + 1)
          setBytes(value => value + frame.data.byteLength)
        },
        onLevel: setLevel,
        onStateChange: setState,
        onError: error => setMessage(error.message),
      })
      setHasCapture(true)
      const info = await capture.prepare()
      setFormat(`${info.format.sampleRate} Hz · ${info.format.channelCount} ch · ${info.format.encoding}`)
      setMessage('AudioWorklet 已加载，可以开始采集')
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AudioWorklet 初始化失败'
      await destroy()
      setState('error')
      setMessage(errorMessage)
    }
  }

  const start = async () => {
    try {
      if (!capture) await prepare()
      if (!capture) return
      setFrames(0)
      setBytes(0)
      await capture.start()
      setMessage('正在从 440 Hz 合成音源采集 PCM')
    }
    catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'PCM 采集启动失败')
    }
  }

  const stop = async () => {
    if (!capture) return
    try {
      const summary = await capture.stop()
      setMessage(summaryMessage(summary))
    }
    catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'PCM 采集停止失败')
    }
  }

  onCleanup(() => { void destroy() })

  return (
    <PageShell title="PcmCapture" description="通过真实 AudioWorklet 采集 Oscillator 输出，验证独立 Worklet 资源加载、PCM 帧和资源释放。">
      <Panel title="AudioWorklet 测试" description="使用静音输出的 440 Hz 合成音源，不申请麦克风权限。">
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge tone={state() === 'error'
            ? 'danger'
            : state() === 'recording'
              ? 'warning'
              : state() === 'ready'
                ? 'success'
                : 'neutral'}
          >
            {state()}
          </StatusBadge>
          <span class="text-sm text-slate-400">{message()}</span>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="格式" value={format()} />
          <Metric label="帧数" value={String(frames())} />
          <Metric label="字节数" value={String(bytes())} />
          <Metric label="音量" value={level().toFixed(3)} />
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => void prepare()} disabled={hasCapture()}>准备</Button>
          <Button onClick={() => void start()} disabled={state() === 'recording'}>开始采集</Button>
          <Button onClick={() => void stop()} disabled={state() !== 'recording'}>停止采集</Button>
          <Button variant="danger" onClick={() => void destroy()} disabled={!hasCapture()}>释放</Button>
        </div>
      </Panel>
    </PageShell>
  )
}

function Metric(props: { label: string, value: string }) {
  return (
    <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div class="text-xs text-slate-500">{props.label}</div>
      <div class="mt-2 break-all font-mono text-sm text-emerald-300">{props.value}</div>
    </div>
  )
}

function summaryMessage(summary: PcmCaptureSummary | null): string {
  if (!summary) return '没有进行中的采集'
  return `采集完成：${summary.frames} 帧，${summary.bytes} bytes，${summary.durationMs.toFixed(1)} ms`
}
