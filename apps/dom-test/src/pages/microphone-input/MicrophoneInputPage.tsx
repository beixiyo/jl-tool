import type { MicrophoneInputEvent } from '@/webApi/MicrophoneInput'
import { MicrophoneInput } from '@/webApi/MicrophoneInput'
import { Button, createEventLog, EventLog, Metric, PageShell, Panel, SelectField, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'

const ECHO_OPTIONS = [
  { value: 'default', label: '不指定（audio: true）' },
  { value: 'false', label: 'echoCancellation: false' },
  { value: 'true', label: 'echoCancellation: true' },
  { value: 'all', label: 'echoCancellation: \'all\'（系统级）' },
] as const

/** 使用真实麦克风验证 MicrophoneInput 的获取、断开自动接回与释放 */
export function MicrophoneInputPage() {
  const [echo, setEcho] = createSignal<EchoOption>('default')
  const [stream, setStream] = createSignal<MediaStream | null>(null)
  const [trackInfo, setTrackInfo] = createSignal<TrackInfo | null>(null)
  const [watching, setWatching] = createSignal(false)
  const [hasInput, setHasInput] = createSignal(false)
  const log = createEventLog()
  let input: MicrophoneInput | null = null
  let detachTrack: (() => void) | null = null

  const [recording, setRecording] = createSignal(false)
  const [audioUrl, setAudioUrl] = createSignal('')
  const [recordInfo, setRecordInfo] = createSignal('')
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let outputUrl: string | null = null
  let disposed = false

  /** 刷新轨道信息，并监听当前轨道 ended 以便 readyState 及时更新 */
  const observeStream = (next: MediaStream | null) => {
    detachTrack?.()
    detachTrack = null
    setStream(next)
    const track = next?.getAudioTracks()[0]
    setTrackInfo(
      track
        ? readTrack(track)
        : null,
    )
    if (!track) return

    const handleEnded = () => setTrackInfo(readTrack(track))
    track.addEventListener('ended', handleEnded)
    detachTrack = () => track.removeEventListener('ended', handleEnded)
  }

  /** 约束在构造时固定，改约束需要重建实例 */
  const ensureInput = () => {
    if (input) return input
    input = new MicrophoneInput({
      constraints: buildConstraints(echo()),
      onStreamChange: (next) => {
        observeStream(next)
        log.push(`onStreamChange · ${
          next
            ? `stream ${next.id.slice(0, 8)} · ${next.getAudioTracks()[0]?.label ?? ''}`
            : 'null'
        }`)
      },
      onEvent: (event) => log.push(describeEvent(event), EVENT_TONE[event.type]),
    })
    setHasInput(true)
    log.push(`创建实例 · constraints=${JSON.stringify(buildConstraints(echo()))}`)
    return input
  }

  const acquire = async () => {
    const result = await ensureInput().acquire()
    if (result.ok) {
      log.push('acquire ok', 'success')
      observeStream(result.stream)
      return
    }
    log.push(`acquire failed · ${result.failure} · permissionState=${result.permissionState}`, 'danger')
  }

  const startWatching = () => {
    ensureInput().startWatching()
    setWatching(true)
    log.push('startWatching')
  }

  const stopWatching = () => {
    input?.stopWatching()
    setWatching(false)
    log.push('stopWatching')
  }

  const retry = () => {
    input?.retry()
    log.push('retry')
  }

  const release = () => {
    if (!input) return
    input.release()
    input = null
    setHasInput(false)
    setWatching(false)
    observeStream(null)
    log.push('release')
  }

  /** MicrophoneInput 本身不录音：用 MediaRecorder 录下当前流，回放验证采集内容 */
  const startRecording = () => {
    const current = stream()
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
      /** 录制中流被自动接回（旧音轨停止）时，浏览器会自动结束录制走到这里 */
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
    log.push('开始录制当前流')
  }

  const stopRecording = () => {
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
  }

  /** 停掉轨道并派发 ended，模拟设备被拔掉；track.stop() 本身不会触发 ended 事件 */
  const simulateEnded = () => {
    const track = stream()?.getAudioTracks()[0]
    if (!track) return
    track.stop()
    track.dispatchEvent(new Event('ended'))
    log.push('模拟 ended', 'warning')
  }

  const changeEcho = (value: EchoOption) => {
    setEcho(value)
    if (input) {
      release()
      log.push('约束已变更，旧实例已释放，重新获取即可生效')
    }
  }

  onCleanup(() => {
    disposed = true
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    mediaRecorder = null
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    input?.release()
    input = null
    detachTrack?.()
  })

  return (
    <PageShell
      title="MicrophoneInput"
      description="获取麦克风、监听断开并自动接回系统默认麦克风。开始监听后拔掉或切换耳机麦克风，观察 onStreamChange(null) → recovered 的事件顺序。"
    >
      <Panel title="控制" description="约束在构造时固定，修改后会释放当前实例；'all' 是 Chromium 的系统级回声消除取值。">
        <div class="max-w-sm">
          <SelectField label="约束" value={ echo() } options={ ECHO_OPTIONS } onChange={ changeEcho } />
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={ () => void acquire() }>acquire</Button>
          <Button onClick={ startWatching } disabled={ watching() }>startWatching</Button>
          <Button onClick={ stopWatching } disabled={ !watching() }>stopWatching</Button>
          <Button onClick={ retry } disabled={ !hasInput() }>retry</Button>
          <Button onClick={ simulateEnded } disabled={ !stream() }>模拟 ended</Button>
          <Button variant="danger" onClick={ release } disabled={ !hasInput() }>release</Button>
          <StatusBadge
            tone={ watching()
              ? 'success'
              : 'neutral' }
          >
            { watching()
              ? 'watching'
              : 'not watching' }
          </StatusBadge>
        </div>
      </Panel>

      <Panel title="当前轨道" description="getSettings().channelCount 在部分浏览器不可靠，仅供参考。">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="label" value={ trackInfo()?.label || '—' } />
          <Metric label="readyState" value={ trackInfo()?.readyState ?? '—' } />
          <Metric label="echoCancellation" value={ String(trackInfo()?.echoCancellation ?? '—') } />
          <Metric label="channelCount" value={ String(trackInfo()?.channelCount ?? '—') } />
        </div>
      </Panel>

      <Panel
        title="录制回放"
        description="MicrophoneInput 只负责持有流，这里直接对当前流挂 MediaRecorder 录一段再回放，验证真的采到了声音。录制中流被自动接回（换了新流）时，浏览器会自动结束本次录制。"
      >
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={ startRecording } disabled={ !stream() || recording() }>录制</Button>
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

      <Panel title="事件" description="onStreamChange / onEvent 以及手动操作，最新在上。">
        <div class="mb-3">
          <Button onClick={ log.clear }>清空</Button>
        </div>
        <EventLog entries={ log.entries() } />
      </Panel>
    </PageShell>
  )
}

const EVENT_TONE = {
  recovered: 'success',
  unavailable: 'warning',
  'permission-denied': 'danger',
} as const

function describeEvent(event: MicrophoneInputEvent): string {
  switch (event.type) {
    case 'recovered':
      return `onEvent recovered · ${event.deviceLabel}`
    case 'unavailable':
    case 'permission-denied':
      return `onEvent ${event.type} · ${event.failure}`
  }
}

function buildConstraints(option: EchoOption): MediaStreamConstraints {
  if (option === 'default') return { audio: true }
  /** 'all' 不在 lib.dom 的 ConstrainBoolean 里，Chromium 已支持 */
  const echoCancellation = option === 'all'
    ? option as unknown as boolean
    : option === 'true'
  return { audio: { echoCancellation } }
}

function readTrack(track: MediaStreamTrack): TrackInfo {
  const settings = track.getSettings() as MediaTrackSettings & { echoCancellation?: boolean | string }
  return {
    label: track.label,
    readyState: track.readyState,
    echoCancellation: settings.echoCancellation,
    channelCount: settings.channelCount,
  }
}

type EchoOption = typeof ECHO_OPTIONS[number]['value']

interface TrackInfo {
  label: string
  readyState: MediaStreamTrackState
  echoCancellation?: boolean | string
  channelCount?: number
}
