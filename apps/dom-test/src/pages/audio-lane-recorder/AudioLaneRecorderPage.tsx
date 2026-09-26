import type { AudioLaneRecorderState } from '@/webApi/AudioLaneRecorder'
import { AudioLaneRecorder } from '@/webApi/AudioLaneRecorder'
import { requestDisplayAudio } from '@/webApi/DisplayAudio'
import { MicrophoneInput } from '@/webApi/MicrophoneInput'
import { Button, createEventLog, EventLog, Metric, PageShell, Panel, SelectField, StatusBadge } from '@app/components'
import type { LevelMeter } from '@app/utils/audio'
import { createLevelMeter, extensionOf, formatDuration, readOpusChannelCount } from '@app/utils/audio'
import { createSignal, onCleanup } from 'solid-js'

const CHANNEL_OPTIONS = [
  { value: '1', label: '1（单声道，默认）' },
  { value: '2', label: '2（双声道）' },
] as const

const TIMESLICE_MS = 1000

/** 使用真实麦克风与屏幕共享声音验证 AudioLaneRecorder 的多路混音、热切换与声道数 */
export function AudioLaneRecorderPage() {
  const [channelCount, setChannelCount] = createSignal<ChannelOption>('1')
  const [gains, setGains] = createSignal<Record<InputId, number>>({ mic: 1, meeting: 1 })
  const [sourceLabels, setSourceLabels] = createSignal<Record<InputId, string | null>>({ mic: null, meeting: null })
  const [state, setState] = createSignal<ViewState>('idle')
  const [inputIds, setInputIds] = createSignal<string[]>([])
  const [chunkCount, setChunkCount] = createSignal(0)
  const [level, setLevel] = createSignal(0)
  const [output, setOutput] = createSignal<RecordingOutput | null>(null)
  const log = createEventLog()

  const sources: Record<InputId, MediaStream | null> = { mic: null, meeting: null }
  let microphone: MicrophoneInput | null = null
  let detachMeeting: (() => void) | null = null
  let context: AudioContext | null = null
  let lane: AudioLaneRecorder | null = null
  let chunks: Blob[] = []
  let meter: LevelMeter | null = null
  let outputUrl: string | null = null
  let disposed = false

  const isActive = () => state() === 'recording' || state() === 'paused'

  /** 把当前源和增益同步到录制器；没有录制器时只记着，start 时统一接上 */
  const applyInput = (id: InputId) => {
    if (!lane) return
    lane.setInput(id, sources[id], { gain: gains()[id] })
    setInputIds(lane.inputIds)
  }

  const setSource = (id: InputId, stream: MediaStream | null) => {
    sources[id] = stream
    setSourceLabels((labels) => ({ ...labels, [id]: stream?.getAudioTracks()[0]?.label ?? null }))
    applyInput(id)
  }

  const connectMic = async () => {
    microphone ??= new MicrophoneInput({
      onStreamChange: (next) => {
        setSource('mic', next)
        log.push(`mic onStreamChange · ${
          next
            ? 'stream'
            : 'null（写入静音）'
        }`)
      },
      onEvent: (event) =>
        log.push(
          `mic onEvent · ${event.type}`,
          event.type === 'recovered'
            ? 'success'
            : 'warning',
        ),
    })
    const result = await microphone.acquire()
    if (!result.ok) {
      log.push(`麦克风获取失败 · ${result.failure}`, 'danger')
      return
    }
    microphone.startWatching()
  }

  const disconnectMic = () => {
    microphone?.release()
    microphone = null
    setSource('mic', null)
  }

  const connectMeeting = async () => {
    disconnectMeeting()
    const result = await requestDisplayAudio()
    if (disposed) {
      if (result.ok) result.stream.getTracks().forEach((track) => track.stop())
      return
    }
    if (!result.ok) {
      log.push(`会议声音获取失败 · ${result.failure}`, 'danger')
      return
    }
    const track = result.stream.getAudioTracks()[0]
    if (!track) {
      log.push(`已选择 ${result.surface}，但没有分享声音`, 'warning')
      return
    }

    const handleEnded = () => {
      log.push('会议声音已停止共享', 'warning')
      disconnectMeeting()
    }
    track.addEventListener('ended', handleEnded)
    detachMeeting = () => track.removeEventListener('ended', handleEnded)
    setSource('meeting', result.stream)
    log.push(`会议声音已接入 · ${result.surface}`, 'success')
  }

  const disconnectMeeting = () => {
    detachMeeting?.()
    detachMeeting = null
    sources.meeting?.getTracks().forEach((track) => track.stop())
    setSource('meeting', null)
  }

  const changeGain = (id: InputId, value: number) => {
    setGains((current) => ({ ...current, [id]: value }))
    applyInput(id)
  }

  const start = async () => {
    revokeOutput()
    context = new AudioContext()
    await context.resume()
    chunks = []
    setChunkCount(0)
    lane = new AudioLaneRecorder({
      context,
      timesliceMs: TIMESLICE_MS,
      channelCount: Number(channelCount()) as 1 | 2,
      retainChunks: true,
      onDataAvailable: (blob) => {
        chunks.push(blob)
        setChunkCount(chunks.length)
      },
    })
    applyInput('mic')
    applyInput('meeting')
    meter = createLevelMeter(context, lane.stream, setLevel)
    lane.start()
    setState(lane.state)
    log.push(`start · channelCount=${channelCount()} · ${lane.mimeType}`, 'success')
  }

  const pause = () => {
    lane?.pause()
    if (lane) setState(lane.state)
  }

  const resume = () => {
    lane?.resume()
    if (lane) setState(lane.state)
  }

  const stop = async () => {
    const currentLane = lane
    const currentContext = context
    if (!currentLane || !currentContext) return

    /** 先摘掉引用，重复点击 stop 时直接返回，避免重复关闭 AudioContext */
    lane = null
    context = null
    await currentLane.stop()
    meter?.dispose()
    meter = null
    setLevel(0)
    setInputIds([])
    setState('stopped')

    const result = currentLane.getResult()
    await currentContext.close()
    if (disposed || !result?.blob) return
    const blob = result.blob
    const duration = result.durationMs / 1000
    const opusChannels = await readOpusChannelCount(blob)
    if (disposed) return

    outputUrl = URL.createObjectURL(blob)
    setOutput({ url: outputUrl, size: blob.size, duration, mimeType: currentLane.mimeType, opusChannels, chunks: chunks.length })
    log.push(`stop · ${blob.size} bytes · OpusHead 声道数=${opusChannels ?? '—'}`, 'success')
  }

  const revokeOutput = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    outputUrl = null
    setOutput(null)
  }

  const releaseAll = async () => {
    await stop()
    disconnectMic()
    disconnectMeeting()
    revokeOutput()
    setState('idle')
    log.push('已释放全部资源')
  }

  onCleanup(() => {
    disposed = true
    meter?.dispose()
    void lane?.stop()
    void context?.close()
    microphone?.release()
    detachMeeting?.()
    sources.meeting?.getTracks().forEach((track) => track.stop())
    if (outputUrl) URL.revokeObjectURL(outputUrl)
  })

  return (
    <PageShell
      title="AudioLaneRecorder"
      description="录制 AudioContext 里的固定目标节点：麦克风与会议声音两路输入在目标节点相加，录制中可随时接上、拔掉或调增益，时间轴保持连续。"
    >
      <Panel title="输入" description="录制前后都可以接入；拔掉某一路时该路写入静音，不会中断录制。">
        <div class="grid gap-4 md:grid-cols-2">
          <InputCard
            title="mic（麦克风）"
            label={ sourceLabels().mic }
            gain={ gains().mic }
            onGain={ (value) => changeGain('mic', value) }
            onConnect={ () => void connectMic() }
            onDisconnect={ disconnectMic }
          />
          <InputCard
            title="meeting（屏幕共享声音）"
            label={ sourceLabels().meeting }
            gain={ gains().meeting }
            onGain={ (value) => changeGain('meeting', value) }
            onConnect={ () => void connectMeeting() }
            onDisconnect={ disconnectMeeting }
          />
        </div>
      </Panel>

      <Panel title="录制" description={ `timesliceMs=${TIMESLICE_MS}；声道数在创建录制器时固定，录制中不可修改。` }>
        <div class="max-w-xs">
          <SelectField label="channelCount" value={ channelCount() } options={ CHANNEL_OPTIONS } disabled={ isActive() } onChange={ setChannelCount } />
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={ () => void start() } disabled={ isActive() }>start</Button>
          <Button onClick={ pause } disabled={ state() !== 'recording' }>pause</Button>
          <Button onClick={ resume } disabled={ state() !== 'paused' }>resume</Button>
          <Button onClick={ () => void stop() } disabled={ !isActive() }>stop</Button>
          <Button variant="danger" onClick={ () => void releaseAll() }>全部释放</Button>
          <StatusBadge
            tone={ state() === 'recording'
              ? 'warning'
              : state() === 'stopped'
              ? 'success'
              : 'neutral' }
          >
            { state() }
          </StatusBadge>
        </div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="inputIds" value={ inputIds().join(', ') || '—' } />
          <Metric label="分片数" value={ String(chunkCount()) } />
          <Metric label="lane.stream 峰值" value={ level().toFixed(3) } />
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div class="h-full bg-emerald-400 transition-[width] duration-75" style={ { width: `${Math.min(level(), 1) * 100}%` } } />
        </div>
      </Panel>

      <Panel
        title="输出"
        description="OpusHead 声道数读自 WebM CodecPrivate 里 OpusHead 魔数后偏移 +9 的字节；track.getSettings().channelCount 不可靠，以此为准。"
      >
        { output()
          ? (
            <div class="space-y-4">
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="大小" value={ `${output()!.size} bytes` } />
                <Metric label="时长" value={ formatDuration(output()!.duration) } />
                <Metric label="mimeType" value={ output()!.mimeType } />
                <Metric label="OpusHead 声道数" value={ String(output()!.opusChannels ?? '—（非 Opus）') } />
                <Metric label="分片数" value={ String(output()!.chunks) } />
              </div>
              <audio class="w-full" controls src={ output()!.url } />
              <a class="inline-flex text-sm text-emerald-300 underline" href={ output()!.url } download={ `audio-lane.${extensionOf(output()!.mimeType)}` }>
                下载录音
              </a>
            </div>
          )
          : <p class="text-sm text-slate-500">停止录制后在这里回放</p> }
      </Panel>

      <Panel title="事件">
        <EventLog entries={ log.entries() } />
      </Panel>
    </PageShell>
  )
}

function InputCard(props: InputCardProps) {
  return (
    <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div class="flex items-center justify-between gap-3">
        <span class="font-medium text-slate-200">{ props.title }</span>
        <StatusBadge
          tone={ props.label === null
            ? 'neutral'
            : 'success' }
        >
          { props.label === null
            ? '未接入'
            : '已接入' }
        </StatusBadge>
      </div>
      <p class="mt-2 min-h-5 break-all font-mono text-xs text-slate-400">{ props.label || '—' }</p>
      <label class="mt-3 block text-xs text-slate-500">
        { `gain ${props.gain.toFixed(2)}` }
        <input
          class="mt-2 w-full accent-emerald-400"
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={ props.gain }
          onInput={ (event) => props.onGain(Number(event.currentTarget.value)) }
        />
      </label>
      <div class="mt-3 flex gap-2">
        <Button onClick={ props.onConnect }>接入</Button>
        <Button onClick={ props.onDisconnect } disabled={ props.label === null }>拔掉</Button>
      </div>
    </div>
  )
}

type InputId = 'mic' | 'meeting'
type ChannelOption = typeof CHANNEL_OPTIONS[number]['value']
type ViewState = AudioLaneRecorderState | 'idle'

interface RecordingOutput {
  url: string
  size: number
  duration: number | null
  mimeType: string
  opusChannels: number | null
  chunks: number
}

interface InputCardProps {
  title: string
  label: string | null
  gain: number
  onGain: (value: number) => void
  onConnect: () => void
  onDisconnect: () => void
}
