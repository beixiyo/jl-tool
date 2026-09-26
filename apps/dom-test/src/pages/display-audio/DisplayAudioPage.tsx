import type { DisplayAudioEnvironment, DisplayAudioResult, RequestDisplayAudioOptions } from '@/webApi/DisplayAudio'
import { isDisplayAudioSupported, requestDisplayAudio } from '@/webApi/DisplayAudio'
import { Button, createEventLog, EventLog, Metric, PageShell, Panel, SelectField, StatusBadge, Toggle } from '@app/components'
import { createSignal, For, onCleanup } from 'solid-js'

const SURFACE_OPTIONS = [
  { value: 'monitor', label: 'monitor（整个屏幕）' },
  { value: 'browser', label: 'browser（标签页）' },
  { value: 'window', label: 'window（窗口）' },
] as const

const SYSTEM_AUDIO_OPTIONS = [
  { value: 'include' },
  { value: 'exclude' },
] as const

const WINDOW_AUDIO_OPTIONS = [
  { value: 'window', label: 'window（应用级，需实验开关）' },
  { value: 'system', label: 'system（整个系统混音）' },
  { value: 'exclude', label: 'exclude（窗口不提供音频）' },
] as const

/** 使用真实 getDisplayMedia 验证只取声音、视频轨即时停止与共享结束 */
export function DisplayAudioPage() {
  const supported = isDisplayAudioSupported()
  const [preferSurface, setPreferSurface] = createSignal<PreferSurface>('monitor')
  const [systemAudio, setSystemAudio] = createSignal<SystemAudio>('include')
  const [windowAudio, setWindowAudio] = createSignal<WindowAudio>('window')
  const [focusCapturedSurface, setFocusCapturedSurface] = createSignal(false)
  const [result, setResult] = createSignal<ResultView | null>(null)
  const [rawTracks, setRawTracks] = createSignal<RawTrack[]>([])
  const [audioState, setAudioState] = createSignal<MediaStreamTrackState | null>(null)
  const [audioLabel, setAudioLabel] = createSignal('')
  const [requesting, setRequesting] = createSignal(false)
  const log = createEventLog()
  let stream: MediaStream | null = null
  let capturedTracks: MediaStreamTrack[] = []
  let detachAudio: (() => void) | null = null

  const [recording, setRecording] = createSignal(false)
  const [audioUrl, setAudioUrl] = createSignal('')
  const [recordInfo, setRecordInfo] = createSignal('')
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let outputUrl: string | null = null
  let disposed = false

  /**
   * 包一层真实 mediaDevices，记下 getDisplayMedia 返回的原始轨道
   * requestDisplayAudio 会把视频轨从流里移除，只有这样才能确认它确实已 stop
   */
  const environment: DisplayAudioEnvironment = {
    mediaDevices: {
      getDisplayMedia: async (options) => {
        const raw = await navigator.mediaDevices.getDisplayMedia(options)
        capturedTracks = raw.getTracks()
        return raw
      },
      getSupportedConstraints: () => navigator.mediaDevices.getSupportedConstraints(),
    },
  }

  const inspectRawTracks = () => {
    setRawTracks(capturedTracks.map((track) => ({ kind: track.kind, label: track.label, readyState: track.readyState })))
  }

  const stopSharing = () => {
    detachAudio?.()
    detachAudio = null
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    setAudioState(null)
    setAudioLabel('')
  }

  const request = async () => {
    stopSharing()
    capturedTracks = []
    setRequesting(true)
    const options: RequestDisplayAudioOptions = {
      preferSurface: preferSurface(),
      systemAudio: systemAudio(),
      windowAudio: windowAudio(),
      focusCapturedSurface: focusCapturedSurface(),
      environment,
    }
    log.push(`requestDisplayAudio · ${JSON.stringify({ ...options, environment: undefined })}`)
    const next = await requestDisplayAudio(options)
    setRequesting(false)
    setResult(toView(next))
    inspectRawTracks()

    if (!next.ok) {
      log.push(`失败 · ${next.failure} · ${describeError(next.error)}`, 'danger')
      return
    }

    log.push(
      `成功 · hasAudio=${next.hasAudio} · surface=${next.surface}`,
      next.hasAudio
        ? 'success'
        : 'warning',
    )
    stream = next.stream
    const track = stream.getAudioTracks()[0]
    if (!track) return

    setAudioLabel(track.label)
    setAudioState(track.readyState)
    const handleEnded = () => {
      setAudioState(track.readyState)
      inspectRawTracks()
      log.push('音轨 ended（用户在提示条上停止了共享）', 'warning')
    }
    track.addEventListener('ended', handleEnded)
    detachAudio = () => track.removeEventListener('ended', handleEnded)
  }

  /** requestDisplayAudio 只交出音轨；用 MediaRecorder 录一段再回放，验证真的采到了标签页/窗口声音 */
  const startRecording = () => {
    const current = stream
    if (!current || mediaRecorder) return
    if (typeof MediaRecorder === 'undefined') {
      log.push('当前浏览器不支持 MediaRecorder', 'danger')
      return
    }

    chunks = []
    const recorder = new MediaRecorder(current)
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      mediaRecorder = null
      setRecording(false)
      /** 用户在提示条上停止共享时音轨 ended，浏览器会自动结束录制走到这里 */
      if (disposed) return

      const blob = new Blob(chunks, { type: recorder.mimeType })
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      outputUrl = URL.createObjectURL(blob)
      setAudioUrl(outputUrl)
      setRecordInfo(`${(blob.size / 1024).toFixed(1)} KB · ${recorder.mimeType}`)
      log.push(`录制结束 · ${(blob.size / 1024).toFixed(1)} KB · ${recorder.mimeType}`, 'success')
    }
    recorder.start()
    mediaRecorder = recorder
    setRecording(true)
    log.push('开始录制共享声音')
  }

  const stopRecording = () => {
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
  }

  const stopByPage = () => {
    stopSharing()
    inspectRawTracks()
    log.push('页面主动停止音轨')
  }

  onCleanup(() => {
    disposed = true
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    mediaRecorder = null
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    stopSharing()
  })

  return (
    <PageShell title="DisplayAudio" description="通过屏幕共享只取标签页或系统声音：拿到后立即停掉视频轨，默认不把焦点切到被共享的页面。">
      <Panel
        title="请求"
        description="选标签页时勾选「分享标签页音频」才拿得到声音。共享窗口时 windowAudio=window 只采选中应用的声音，但需先在 chrome://flags 启用「Application audio capture」（Windows/macOS，默认关闭），不支持时回退为系统混音；看音轨 label 可确认来源：应用/系统音频 vs 标签页标题。"
      >
        <div class="mb-4 flex items-center gap-3">
          <span class="text-sm text-slate-400">isDisplayAudioSupported()</span>
          <StatusBadge
            tone={ supported
              ? 'success'
              : 'danger' }
          >
            { String(supported) }
          </StatusBadge>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField label="preferSurface" value={ preferSurface() } options={ SURFACE_OPTIONS } onChange={ setPreferSurface } />
          <SelectField label="systemAudio（整屏）" value={ systemAudio() } options={ SYSTEM_AUDIO_OPTIONS } onChange={ setSystemAudio } />
          <SelectField label="windowAudio（窗口）" value={ windowAudio() } options={ WINDOW_AUDIO_OPTIONS } onChange={ setWindowAudio } />
          <div class="flex items-end pb-2">
            <Toggle checked={ focusCapturedSurface() } onChange={ setFocusCapturedSurface }>focusCapturedSurface</Toggle>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={ () => void request() } disabled={ requesting() }>请求共享声音</Button>
          <Button variant="danger" onClick={ stopByPage } disabled={ audioState() !== 'live' }>停止音轨</Button>
        </div>
      </Panel>

      { !supported && (
        <section class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-200">
          <h2 class="font-semibold text-amber-200">当前浏览器无法从屏幕共享获取声音</h2>
          <p class="mt-1">isDisplayAudioSupported() 为 false：Firefox / Safari 的 getDisplayMedia 不会返回音轨。</p>
          <p class="mt-1">
            仍可点「请求共享声音」验证流程——不会报错，只会得到 hasAudio: false（视频轨已即时停止）。完整能力需 Chromium 系浏览器（Chrome / Edge 141+）。
          </p>
        </section>
      ) }

      <Panel title="结果">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="ok / failure" value={ result()?.status ?? '—' } />
          <Metric label="hasAudio" value={ result()?.hasAudio ?? '—' } />
          <Metric label="surface" value={ result()?.surface ?? '—' } />
          <Metric label="音轨 readyState" value={ audioState() ?? '—' } />
        </div>
        <p class="mt-3 text-sm text-slate-400">
          音轨来源 label：
          { audioLabel()
            ? <span class="font-mono text-slate-200">{ audioLabel() }</span>
            : '—' }
          （应用级成功时是应用名，系统混音是 System Audio 类字样，标签页则是标签页标题）
        </p>
        <div class="mt-5">
          <h3 class="text-xs text-slate-500">getDisplayMedia 原始轨道（视频轨应已 ended）</h3>
          { rawTracks().length === 0
            ? <p class="mt-2 text-sm text-slate-500">—</p>
            : (
              <ul class="mt-2 space-y-1 font-mono text-xs">
                <For each={ rawTracks() }>
                  { (track) => (
                    <li
                      class={ track.kind === 'video' && track.readyState === 'live'
                        ? 'text-rose-300'
                        : 'text-slate-300' }
                    >
                      { `${track.kind} · ${track.readyState} · ${track.label}` }
                    </li>
                  ) }
                </For>
              </ul>
            ) }
        </div>
      </Panel>

      <Panel
        title="录制回放"
        description="对拿到的共享音轨直接挂 MediaRecorder 录一段再回放，验证真的采到了声音。建议共享一个正在播放音乐的标签页；在提示条上停止共享会自动结束本次录制。"
      >
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={ startRecording } disabled={ audioState() !== 'live' || recording() }>录制</Button>
          <Button onClick={ stopRecording } disabled={ !recording() }>停止</Button>
          <StatusBadge
            tone={ recording()
              ? 'warning'
              : 'neutral' }
          >
            { recording()
              ? 'recording'
              : 'idle' }
          </StatusBadge>
          { recordInfo() && <span class="text-sm text-slate-400">{ recordInfo() }</span> }
        </div>
        <audio class="mt-5 w-full" controls src={ audioUrl() } />
      </Panel>

      <Panel title="事件">
        <EventLog entries={ log.entries() } />
      </Panel>
    </PageShell>
  )
}

function toView(result: DisplayAudioResult): ResultView {
  if (!result.ok) return { status: `failure: ${result.failure}` }
  return { status: 'ok', hasAudio: String(result.hasAudio), surface: result.surface }
}

function describeError(error: unknown): string {
  if (error instanceof Error || error instanceof DOMException) return `${error.name}: ${error.message}`
  return String(error)
}

type PreferSurface = typeof SURFACE_OPTIONS[number]['value']
type SystemAudio = typeof SYSTEM_AUDIO_OPTIONS[number]['value']
type WindowAudio = typeof WINDOW_AUDIO_OPTIONS[number]['value']

interface ResultView {
  status: string
  hasAudio?: string
  surface?: string
}

interface RawTrack {
  kind: string
  label: string
  readyState: MediaStreamTrackState
}
