import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { Recorder } from '@/webApi'

type RecorderViewState = 'idle' | 'recording' | 'paused' | 'stopped' | 'error'

/** 使用真实 audio/canvas 元素验证音频录制、回放和频谱分析 */
export function RecorderPage() {
  let audioElement!: HTMLAudioElement
  let meterCanvas!: HTMLCanvasElement
  let recorder: Recorder | null = null
  let meterFrame: number | null = null

  const [state, setState] = createSignal<RecorderViewState>('idle')
  const [status, setStatus] = createSignal('等待初始化')
  const [audioUrl, setAudioUrl] = createSignal('')
  const [recordingInfo, setRecordingInfo] = createSignal('')

  const stopMeter = () => {
    if (meterFrame !== null) {
      cancelAnimationFrame(meterFrame)
      meterFrame = null
    }

    const context = meterCanvas?.getContext('2d')
    if (context) {
      context.clearRect(0, 0, meterCanvas.width, meterCanvas.height)
    }
  }

  const drawMeter = () => {
    const context = meterCanvas?.getContext('2d')
    const analyser = recorder?.analyser
    if (!context || !analyser) {
      meterFrame = null
      return
    }

    const data = recorder?.getByteFrequencyData()
    if (!data) {
      meterFrame = null
      return
    }

    context.clearRect(0, 0, meterCanvas.width, meterCanvas.height)
    const barWidth = meterCanvas.width / data.length
    context.fillStyle = '#34d399'
    for (let index = 0; index < data.length; index += 1) {
      const height = (data[index] / 255) * meterCanvas.height
      context.fillRect(index * barWidth, meterCanvas.height - height, Math.max(1, barWidth - 1), height)
    }

    meterFrame = requestAnimationFrame(drawMeter)
  }

  const startMeter = () => {
    stopMeter()
    meterFrame = requestAnimationFrame(drawMeter)
  }

  const createRecorder = () => {
    if (recorder)
      return recorder

    recorder = new Recorder({
      autoInit: false,
      createAnalyser: true,
      onFinish: (url, chunks) => {
        setAudioUrl(url)
        setRecordingInfo(`${(new Blob(chunks).size / 1024).toFixed(1)} KB · ${recorder?.mimeType ?? 'audio/webm'}`)
      },
      onError: (error) => {
        setState('error')
        setStatus(error.message)
      },
    })

    return recorder
  }

  async function initialize() {
    if (recorder) {
      setStatus('录音器已初始化')
      return
    }

    try {
      setStatus('正在请求麦克风权限…')
      await createRecorder().init()
      setStatus('已初始化，可以开始录音')
    }
    catch (error) {
      setState('error')
      setStatus(error instanceof Error
        ? error.message
        : '麦克风初始化失败')
    }
  }

  async function startRecording() {
    try {
      const instance = createRecorder()
      setStatus('正在启动录音…')
      await instance.start()
      setState('recording')
      setStatus('正在录音')
      startMeter()
    }
    catch (error) {
      setState('error')
      setStatus(error instanceof Error
        ? error.message
        : '录音启动失败')
    }
  }

  async function stopRecording() {
    if (!recorder)
      return

    try {
      setStatus('正在停止录音…')
      await recorder.stop()
      setState('stopped')
      setStatus('录音完成')
      stopMeter()
    }
    catch (error) {
      setState('error')
      setStatus(error instanceof Error
        ? error.message
        : '录音停止失败')
    }
  }

  async function destroyRecorder() {
    stopMeter()
    if (recorder) {
      await recorder.destroy()
      recorder = null
    }
    if (audioElement)
      audioElement.src = ''
    setAudioUrl('')
    setRecordingInfo('')
    setState('idle')
    setStatus('已释放麦克风和录音资源')
  }

  onCleanup(() => {
    stopMeter()
    void recorder?.destroy()
    recorder = null
    if (audioElement) {
      audioElement.pause()
      audioElement.removeAttribute('src')
      audioElement.load()
    }
  })

  return (
    <PageShell title="Recorder" description="通过真实麦克风、MediaRecorder、audio 和 canvas 验证录音生命周期与频谱分析">
      <div class="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="控制台" description="初始化按钮才会请求麦克风权限">
          <div class="flex flex-wrap gap-3">
            <Button onClick={initialize} disabled={state() === 'recording' || Boolean(recorder)}>初始化</Button>
            <Button onClick={startRecording} disabled={state() === 'recording'}>开始录音</Button>
            <Button onClick={() => void stopRecording()} disabled={state() !== 'recording'}>停止录音</Button>
            <Button variant="danger" onClick={() => void destroyRecorder()} disabled={!recorder || state() === 'recording'}>释放</Button>
          </div>
          <div class="mt-5 flex items-center gap-3">
            <StatusBadge tone={state() === 'error'
              ? 'danger'
              : state() === 'recording'
                ? 'warning'
                : 'success'}
            >
              {status()}
            </StatusBadge>
            {recordingInfo() && <span class="text-sm text-slate-400">{recordingInfo()}</span>}
          </div>
          <audio ref={audioElement} class="mt-5 w-full" controls src={audioUrl()} />
        </Panel>

        <Panel title="实时频谱" description="录音初始化开启 createAnalyser，动画帧仅在录音期间运行">
          <canvas ref={meterCanvas} width="720" height="180" class="h-44 w-full rounded-xl border border-slate-800 bg-slate-950" />
        </Panel>
      </div>
    </PageShell>
  )
}
