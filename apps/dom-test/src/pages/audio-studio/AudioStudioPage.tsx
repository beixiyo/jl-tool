import type { AudioLaneRecorderOptions } from '@/webApi/AudioLaneRecorder'
import type { AudioLaneRecorderState } from '@/webApi/AudioLaneRecorder'
import { AudioLaneRecorder } from '@/webApi/AudioLaneRecorder'
import type { NativeDisplayMediaOptions } from '@/webApi/DisplayAudio'
import { isDisplayAudioSupported, requestDisplayAudio } from '@/webApi/DisplayAudio'
import { MicrophoneInput } from '@/webApi/MicrophoneInput'
import type { NativeRecorderOptions } from '@/webApi/recording'
import { Button, createEventLog, EventLog, Metric, PageShell, Panel, SelectField, StatusBadge, Toggle } from '@app/components'
import { createLevelMeter, extensionOf, formatDuration, readOpusChannelCount } from '@app/utils/audio'
import { createSignal, onCleanup, onMount } from 'solid-js'
import type { FinalizerMode } from './FinalizerField'
import { createDemoFinalizer, FinalizerField } from './FinalizerField'
import { MediaApiControls } from './MediaApiControls'
import { nativeOptions, NativeOptionsField, parseOptions } from './NativeOptionsField'

const SURFACE_OPTIONS = [
  { value: 'browser', label: 'browser（标签页）' },
  { value: 'window', label: 'window（窗口）' },
  { value: 'monitor', label: 'monitor（整个屏幕）' },
] as const

const SYSTEM_AUDIO_OPTIONS = [
  { value: 'include' },
  { value: 'exclude' },
] as const

const WINDOW_AUDIO_OPTIONS = [
  { value: 'window', label: 'window（应用级，需实验开关）' },
  { value: 'system', label: 'system（整个系统混音）' },
  { value: 'exclude', label: 'exclude（不提供音频）' },
] as const

const TONE_FREQ_OPTIONS = [
  { value: '440' },
  { value: '1000' },
] as const

const CHANNEL_OPTIONS = [
  { value: '1', label: '1（单声道，默认）' },
  { value: '2', label: '2（双声道）' },
] as const

const TIMESLICE_OPTIONS = [
  { value: 'off', label: 'off（停止时一次产出）' },
  { value: '500' },
  { value: '1000' },
  { value: '2000' },
  { value: '5000' },
] as const

const BITRATE_OPTIONS = [
  { value: 'default', label: 'default（不指定）' },
  { value: '24000' },
  { value: '64000' },
  { value: '128000' },
] as const

const SOURCE_IDS = ['mic', 'share', 'tone'] as const

/**
 * 集成录音台：麦克风、共享声音与检测音任意组合，
 * 全部喂给 AudioLaneRecorder 混音录制，验证三个库组合工作的真实链路
 */
export function AudioStudioPage() {
  const shareSupported = isDisplayAudioSupported()
  const log = createEventLog()

  const [micDevice, setMicDevice] = createSignal('default')
  const [ec, setEc] = createSignal(true)
  const [ns, setNs] = createSignal(true)
  const [agc, setAgc] = createSignal(true)
  const [watching, setWatching] = createSignal(true)
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([])

  const [preferSurface, setPreferSurface] = createSignal<SurfaceOption>('browser')
  const [systemAudio, setSystemAudio] = createSignal<SystemAudio>('include')
  const [windowAudio, setWindowAudio] = createSignal<WindowAudio>('window')
  const [focusCapturedSurface, setFocusCapturedSurface] = createSignal(false)
  const [toneFreq, setToneFreq] = createSignal('440')
  const [monitorSurfaces, setMonitorSurfaces] = createSignal<'include' | 'exclude'>('include')
  const [selfSurface, setSelfSurface] = createSignal<'include' | 'exclude'>('exclude')
  const [switching, setSwitching] = createSignal<'include' | 'exclude'>('exclude')
  const [suppressLocal, setSuppressLocal] = createSignal(false)
  const [functional, setFunctional] = createSignal(false)
  const [injected, setInjected] = createSignal(false)
  const [micJson, setMicJson] = createSignal('{}')
  const [shareJson, setShareJson] = createSignal('{}')
  const [laneJson, setLaneJson] = createSignal('{}')
  const [encodingJson, setEncodingJson] = createSignal('{"mimeType": "audio/webm;codecs=opus"}')
  const [finalizerMode, setFinalizerMode] = createSignal<FinalizerMode>('none')
  const [retainChunks, setRetainChunks] = createSignal(true)
  const [busy, setBusy] = createSignal(false)
  const [rawDuration, setRawDuration] = createSignal('—')
  const [fixedDuration, setFixedDuration] = createSignal('—')

  const [channelCount, setChannelCount] = createSignal('1')
  const [timeslice, setTimeslice] = createSignal('1000')
  const [bitrate, setBitrate] = createSignal('default')
  const [state, setState] = createSignal<ViewState>('idle')
  const [inputIds, setInputIds] = createSignal<string[]>([])
  const [chunkCount, setChunkCount] = createSignal(0)
  const [mixLevel, setMixLevel] = createSignal(0)
  const [output, setOutput] = createSignal<RecordingOutput | null>(null)

  const [gains, setGains] = createSignal<Record<SourceId, number>>({ mic: 1, share: 1, tone: 0.5 })
  const [sources, setSources] = createSignal<Record<SourceId, SourceState>>({
    mic: { label: null, level: 0 },
    share: { label: null, level: 0 },
    tone: { label: null, level: 0 },
  })

  const srcs: Record<SourceId, MediaStream | AudioNode | null> = { mic: null, share: null, tone: null }
  const meters: Partial<Record<SourceId, LevelMeterHandle>> = {}
  let microphone: MicrophoneInput | null = null
  let detachShare: (() => void) | null = null
  let oscillator: OscillatorNode | null = null
  let context: AudioContext | null = null
  let lane: AudioLaneRecorder | null = null
  let mixMeter: LevelMeterHandle | null = null
  let chunks: Blob[] = []
  let outputUrl: string | null = null
  let rawUrl: string | null = null
  let micRequest = 0
  let shareRequest = 0
  let disposed = false

  const isActive = () => state() === 'recording' || state() === 'paused'

  const updateSource = (id: SourceId, patch: Partial<SourceState>) => {
    setSources((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  }

  /** 持有 AudioContext：源接入与录制共用同一个，停止录制不关闭，全部释放才关闭 */
  const ensureContext = async () => {
    context ??= new AudioContext()
    if (context.state !== 'running') await context.resume()
    return context
  }

  /** 统一换源入口：换电平表、同步到录制器（录制中热切换生效） */
  const setSource = (id: SourceId, source: MediaStream | AudioNode | null, label: string | null) => {
    srcs[id] = source
    meters[id]?.dispose()
    delete meters[id]
    if (source && context) {
      meters[id] = createLevelMeter(context, source, (level) => updateSource(id, { level }))
    }
    if (lane) {
      lane.setInput(id, source, { gain: gains()[id] })
      setInputIds(lane.inputIds)
    }
    updateSource(id, { label, level: 0 })
  }

  const changeGain = (id: SourceId, value: number) => {
    setGains((current) => ({ ...current, [id]: value }))
    if (lane) lane.setInput(id, srcs[id], { gain: value })
  }

  const buildMicConstraints = (): MediaStreamConstraints => {
    const audio: MediaTrackConstraints = {
      echoCancellation: ec(),
      noiseSuppression: ns(),
      autoGainControl: agc(),
    }
    if (micDevice() !== 'default') audio.deviceId = { exact: micDevice() }
    return { audio: { ...audio, ...parseOptions<MediaTrackConstraints>(micJson()) } }
  }

  const connectMic = async () => {
    const request = ++micRequest
    await ensureContext()
    if (disposed || request !== micRequest) return
    microphone?.release()
    const input = new MicrophoneInput({
      constraints: buildMicConstraints(),
      onStreamChange: (next) => {
        if (disposed || request !== micRequest) return
        setSource('mic', next, next?.getAudioTracks()[0]?.label ?? null)
        log.push(`mic onStreamChange · ${
          next
            ? 'stream'
            : 'null（写入静音）'
        }`)
      },
      onEvent: (event) => {
        log.push(
          `mic onEvent · ${event.type}`,
          event.type === 'recovered'
            ? 'success'
            : 'warning',
        )
      },
    })
    microphone = input
    const result = await input.acquire()
    if (disposed || request !== micRequest) {
      input.release()
      return
    }
    if (!result.ok) {
      log.push(`麦克风获取失败 · ${result.failure} · permissionState=${result.permissionState}`, 'danger')
      return
    }
    if (watching()) input.startWatching()
    setSource('mic', result.stream, result.stream.getAudioTracks()[0]?.label ?? null)
    log.push(
      `麦克风已接入${
        watching()
          ? ' · watching'
          : ''
      }`,
      'success',
    )
  }

  const disconnectMic = () => {
    micRequest++
    microphone?.release()
    microphone = null
    setSource('mic', null, null)
  }

  /** 设备与处理开关在接入时固定，变更后自动用新约束重连 */
  const reconnectMicOnChange = () => {
    if (microphone) {
      log.push('麦克风约束已变更，重连中')
      run(connectMic)
    }
  }

  const connectShare = async () => {
    disconnectShare()
    const request = ++shareRequest
    await ensureContext()
    if (disposed || request !== shareRequest) return
    const result = await requestDisplayAudio({
      preferSurface: preferSurface(),
      systemAudio: systemAudio(),
      windowAudio: windowAudio(),
      focusCapturedSurface: focusCapturedSurface(),
      monitorTypeSurfaces: monitorSurfaces(),
      selfBrowserSurface: selfSurface(),
      surfaceSwitching: switching(),
      suppressLocalAudioPlayback: suppressLocal(),
      displayMediaOptions: nativeOptions<NativeDisplayMediaOptions>(shareJson(), functional()),
      environment: injected()
        ? {
          mediaDevices: {
            getDisplayMedia: (options) => {
              log.push(`DI getDisplayMedia · ${JSON.stringify(options)}`)
              return navigator.mediaDevices.getDisplayMedia(options)
            },
            getSupportedConstraints: () => navigator.mediaDevices.getSupportedConstraints(),
          },
        }
        : undefined,
    })
    if (disposed || request !== shareRequest) {
      if (result.ok) result.stream.getTracks().forEach((track) => track.stop())
      return
    }
    if (!result.ok) {
      log.push(`共享声音获取失败 · ${result.failure}`, 'danger')
      return
    }
    const track = result.stream.getAudioTracks()[0]
    if (!track) {
      log.push(`已选择 ${result.surface}，但没有分享声音`, 'warning')
      return
    }

    const handleEnded = () => {
      log.push('共享声音已停止（提示条或共享方停止）', 'warning')
      disconnectShare()
    }
    track.addEventListener('ended', handleEnded)
    detachShare = () => track.removeEventListener('ended', handleEnded)
    setSource('share', result.stream, track.label)
    log.push(`共享声音已接入 · ${result.surface}`, 'success')
  }

  const disconnectShare = () => {
    shareRequest++
    detachShare?.()
    detachShare = null
    if (srcs.share instanceof MediaStream) srcs.share.getTracks().forEach((track) => track.stop())
    setSource('share', null, null)
  }

  /** 检测音：同一 AudioContext 里的 OscillatorNode，免权限即可验证混音与录制链路 */
  const connectTone = async () => {
    await ensureContext()
    if (disposed) return
    disconnectTone()
    const osc = context!.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = Number(toneFreq())
    oscillator = osc
    osc.start()
    setSource('tone', osc, `${toneFreq()} Hz sine`)
    log.push('检测音已接入', 'success')
  }

  const disconnectTone = () => {
    oscillator?.stop()
    oscillator = null
    setSource('tone', null, null)
  }

  const startRecording = async () => {
    if (lane) return
    await ensureContext()
    if (disposed) return
    revokeOutput()
    chunks = []
    setChunkCount(0)
    lane = new AudioLaneRecorder({
      context: context!,
      timesliceMs: timeslice() === 'off'
        ? undefined
        : Number(timeslice()),
      channelCount: Number(channelCount()) as 1 | 2,
      audioBitsPerSecond: bitrate() === 'default'
        ? undefined
        : Number(bitrate()),
      ...parseOptions<Partial<AudioLaneRecorderOptions>>(laneJson()),
      recorderOptions: nativeOptions<NativeRecorderOptions>(encodingJson(), functional()),
      finalizeBlob: createDemoFinalizer(finalizerMode(), (message) => log.push(message)),
      retainChunks: retainChunks(),
      environment: injected()
        ? {
          createMediaRecorder: (stream, options) => {
            log.push(`DI MediaRecorder · ${JSON.stringify(options)}`)
            return new MediaRecorder(stream, options)
          },
        }
        : undefined,
      onError: (error) => log.push(`Lane error · ${error.message}`, 'danger'),
      onStateChange: (state) => {
        if (!disposed) setState(state)
        log.push(`Lane state · ${state}`)
      },
      onStop: (result) => log.push(`Lane onStop · ${result.durationMs.toFixed(0)} ms`),
      onDataAvailable: (blob) => {
        chunks.push(blob)
        setChunkCount(chunks.length)
      },
    })
    SOURCE_IDS.forEach((id) => {
      lane!.setInput(id, srcs[id], { gain: gains()[id] })
    })
    setInputIds(lane.inputIds)
    mixMeter = createLevelMeter(context!, lane.stream, setMixLevel)
    lane.start()
    setState(lane.state)
    log.push(`start · ${lane.mimeType} · timeslice=${timeslice()} · bitrate=${bitrate()}`, 'success')
  }

  const pause = () => {
    lane?.pause()
    if (lane) setState(lane.state)
  }

  const resume = () => {
    lane?.resume()
    if (lane) setState(lane.state)
  }

  const stopRecording = async () => {
    const currentLane = lane
    if (!currentLane || !context) return

    /** 先摘引用，重复点击直接返回；AudioContext 保留给还接着的源与解码 */
    lane = null
    await currentLane.stop()
    mixMeter?.dispose()
    mixMeter = null
    setMixLevel(0)
    setInputIds([])
    setState('stopped')

    const result = currentLane.getResult()
    const blob = result?.blob
    if (!blob || disposed) {
      log.push('未缓存最终文件；原始分片已通过 onDataAvailable 交付')
      return
    }
    const duration = result.durationMs / 1000
    const opusChannels = await readOpusChannelCount(blob)
    if (disposed) return
    rawUrl = URL.createObjectURL(new Blob(chunks, { type: currentLane.mimeType }))
    outputUrl = URL.createObjectURL(blob)
    setOutput({
      url: outputUrl,
      rawUrl,
      size: blob.size,
      duration,
      mimeType: currentLane.mimeType,
      opusChannels,
      chunks: chunks.length,
    })
    log.push(`stop · ${blob.size} bytes · 时长 ${formatDuration(duration)} · OpusHead 声道数=${opusChannels ?? '—'}`, 'success')
  }

  const revokeOutput = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    if (rawUrl) URL.revokeObjectURL(rawUrl)
    outputUrl = null
    rawUrl = null
    setRawDuration('—')
    setFixedDuration('—')
    setOutput(null)
  }

  /** 释放一切：录制、三路输入与 AudioContext；音频约束下次接入时重新生效 */
  const releaseAll = async () => {
    await stopRecording()
    disconnectMic()
    disconnectShare()
    disconnectTone()
    const currentContext = context
    context = null
    await currentContext?.close()
    setState('idle')
    log.push('已释放全部资源（AudioContext 已关闭）')
  }

  /** 串行化录制/停止/释放，异常进入页面日志 */
  const run = (action: () => Promise<void>) => {
    if (busy() || disposed) return
    setBusy(true)
    void action().catch((error) => log.push(String(error), 'danger')).finally(() => {
      if (!disposed) setBusy(false)
    })
  }

  onMount(() => {
    const refreshDevices = () => {
      void navigator.mediaDevices?.enumerateDevices().then((list) => {
        setDevices(list.filter((device) => device.kind === 'audioinput'))
      })
    }
    refreshDevices()
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices)
    onCleanup(() => navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices))
  })

  onCleanup(() => {
    disposed = true
    microphone?.release()
    detachShare?.()
    if (srcs.share instanceof MediaStream) srcs.share.getTracks().forEach((track) => track.stop())
    oscillator?.stop()
    void lane?.stop()
    Object.values(meters).forEach((meter) => meter?.dispose())
    mixMeter?.dispose()
    void context?.close()
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    if (rawUrl) URL.revokeObjectURL(rawUrl)
  })

  return (
    <PageShell
      title="AudioStudio"
      description="集成录音台：麦克风（断线自动接回）、共享声音（标签页/窗口/系统）与检测音三路任意组合，实时电平监视，喂给 AudioLaneRecorder 混音录制。录制中可随时接入、拔掉、调增益，时间轴保持连续。"
    >
      <Panel title="输入 · 麦克风" description="约束在接入时固定，修改后自动重连；watching 开启时拔掉设备会先写静音再自动接回系统默认麦克风。">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="deviceId"
            value={ micDevice() }
            options={ deviceOptions(devices()) }
            onChange={ (value) => {
              setMicDevice(value)
              reconnectMicOnChange()
            } }
          />
          <div class="flex flex-wrap items-end gap-4 pb-2">
            <Toggle
              checked={ ec() }
              onChange={ (value) => {
                setEc(value)
                reconnectMicOnChange()
              } }
            >
              echoCancellation
            </Toggle>
            <Toggle
              checked={ ns() }
              onChange={ (value) => {
                setNs(value)
                reconnectMicOnChange()
              } }
            >
              noiseSuppression
            </Toggle>
          </div>
          <div class="flex flex-wrap items-end gap-4 pb-2">
            <Toggle
              checked={ agc() }
              onChange={ (value) => {
                setAgc(value)
                reconnectMicOnChange()
              } }
            >
              autoGainControl
            </Toggle>
            <Toggle
              checked={ watching() }
              onChange={ (value) => {
                setWatching(value)
                if (microphone) {
                  value
                    ? microphone.startWatching()
                    : microphone.stopWatching()
                }
              } }
            >
              watching
            </Toggle>
          </div>
        </div>
        <NativeOptionsField label="麦克风完整 MediaTrackConstraints（覆盖上方开关）" value={ micJson() } onChange={ setMicJson } />
        <SourceControls
          label={ sources().mic.label }
          level={ sources().mic.level }
          gain={ gains().mic }
          connectText={ sources().mic.label
            ? '重连'
            : '接入' }
          onConnect={ () => run(connectMic) }
          onDisconnect={ disconnectMic }
          onGain={ (value) => changeGain('mic', value) }
        />
      </Panel>

      <Panel
        title="输入 · 共享声音"
        description="走 requestDisplayAudio：只取声音，视频轨即时停止。选标签页记得勾「分享标签页音频」；窗口应用级音频需 chrome://flags 开启，且选中 Chromium 系浏览器窗口时音频开关会被禁用（分享按钮变灰），换非浏览器窗口即可；不支持时回退系统混音。"
      >
        <div class="mb-4 flex items-center gap-3">
          <span class="text-sm text-slate-400">isDisplayAudioSupported()</span>
          <StatusBadge
            tone={ shareSupported
              ? 'success'
              : 'danger' }
          >
            { String(shareSupported) }
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
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <SelectField label="monitorTypeSurfaces" value={ monitorSurfaces() } options={ SYSTEM_AUDIO_OPTIONS } onChange={ setMonitorSurfaces } />
          <SelectField label="selfBrowserSurface" value={ selfSurface() } options={ SYSTEM_AUDIO_OPTIONS } onChange={ setSelfSurface } />
          <SelectField label="surfaceSwitching" value={ switching() } options={ SYSTEM_AUDIO_OPTIONS } onChange={ setSwitching } />
        </div>
        <Toggle checked={ suppressLocal() } onChange={ setSuppressLocal }>suppressLocalAudioPlayback</Toggle>
        <NativeOptionsField label="完整 getDisplayMedia options（覆盖快捷项，audio 可填完整约束）" value={ shareJson() } onChange={ setShareJson } />
        <SourceControls
          label={ sources().share.label }
          level={ sources().share.level }
          gain={ gains().share }
          connectText={ sources().share.label
            ? '重新选择'
            : '接入' }
          onConnect={ () => run(connectShare) }
          onDisconnect={ disconnectShare }
          onGain={ (value) => changeGain('share', value) }
        />
      </Panel>

      <Panel
        title="输入 · 检测音"
        description="同一 AudioContext 里的正弦波，无需任何权限；用来在不弹授权的情况下验证混音与录制链路本身。注意：接入后会持续混入录音（听起来像电话等待音），测完记得拔掉或把 gain 拉到 0。"
      >
        <div class="max-w-xs">
          <SelectField
            label="frequency"
            value={ toneFreq() }
            options={ TONE_FREQ_OPTIONS }
            disabled={ Boolean(sources().tone.label) }
            onChange={ (value) => {
              setToneFreq(value)
              if (sources().tone.label) void connectTone()
            } }
          />
        </div>
        <SourceControls
          label={ sources().tone.label }
          level={ sources().tone.level }
          gain={ gains().tone }
          connectText={ sources().tone.label
            ? '重启'
            : '开启' }
          onConnect={ () => run(connectTone) }
          onDisconnect={ disconnectTone }
          onGain={ (value) => changeGain('tone', value) }
        />
      </Panel>

      <Panel title="录制" description="AudioLaneRecorder 构造参数在 start 时固定；输入接入、拔掉与增益调整录制中实时生效。">
        <div class="grid gap-4 sm:grid-cols-3">
          <SelectField label="channelCount" value={ channelCount() } options={ CHANNEL_OPTIONS } disabled={ isActive() } onChange={ setChannelCount } />
          <SelectField label="timesliceMs" value={ timeslice() } options={ TIMESLICE_OPTIONS } disabled={ isActive() } onChange={ setTimeslice } />
          <SelectField label="audioBitsPerSecond" value={ bitrate() } options={ BITRATE_OPTIONS } disabled={ isActive() } onChange={ setBitrate } />
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <NativeOptionsField
            label="Lane 配置覆盖（mimeTypes / timesliceMs / channelCount / audioBitsPerSecond）"
            value={ laneJson() }
            onChange={ setLaneJson }
            disabled={ isActive() }
          />
          <NativeOptionsField label="Lane 原生 MediaRecorderOptions" value={ encodingJson() } onChange={ setEncodingJson } disabled={ isActive() } />
        </div>
        <div class="mt-4 flex flex-wrap gap-4">
          <FinalizerField value={ finalizerMode() } onChange={ setFinalizerMode } disabled={ isActive() } />
          <Toggle checked={ retainChunks() } onChange={ setRetainChunks } disabled={ isActive() }>retainChunks</Toggle>
          <Toggle checked={ functional() } onChange={ setFunctional }>函数式配置（共享 / Lane）</Toggle>
          <Toggle checked={ injected() } onChange={ setInjected }>environment 注入（共享 / Lane）</Toggle>
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={ () => run(startRecording) } disabled={ isActive() || busy() }>start</Button>
          <Button onClick={ pause } disabled={ state() !== 'recording' }>pause</Button>
          <Button onClick={ resume } disabled={ state() !== 'paused' }>resume</Button>
          <Button onClick={ () => run(stopRecording) } disabled={ !isActive() || busy() }>stop</Button>
          <Button onClick={ () => lane?.requestData() } disabled={ !isActive() }>requestData</Button>
          <Button variant="danger" onClick={ () => run(releaseAll) } disabled={ busy() }>全部释放</Button>
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
        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="inputIds" value={ inputIds().join(', ') || '—' } />
          <Metric label="分片数" value={ String(chunkCount()) } />
          <Metric label="混音峰值" value={ mixLevel().toFixed(3) } />
        </div>
        <div class="mt-3">
          <LevelBar level={ mixLevel() } />
        </div>
      </Panel>

      <Panel title="输出" description="默认不修复容器时长；WebM 控件可能仍为 Infinity。下方统计时长由库的有效录制时钟提供；需要控件时长请自行注入修复器。">
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
              <Metric label="原始 loadedmetadata duration" value={ rawDuration() } />
              <audio
                aria-label="原始 WebM"
                class="w-full"
                controls
                preload="metadata"
                src={ output()!.rawUrl }
                onLoadedMetadata={ (event) => setRawDuration(String(event.currentTarget.duration)) }
              />
              <Metric label="最终 loadedmetadata duration" value={ fixedDuration() } />
              <audio
                aria-label="最终 WebM"
                class="w-full"
                controls
                preload="metadata"
                src={ output()!.url }
                onLoadedMetadata={ (event) => setFixedDuration(String(event.currentTarget.duration)) }
              />
              <a class="inline-flex text-sm text-emerald-300 underline" href={ output()!.url } download={ `audio-studio.${extensionOf(output()!.mimeType)}` }>
                下载录音
              </a>
            </div>
          )
          : <p class="text-sm text-slate-500">停止录制后在这里回放</p> }
      </Panel>

      <MediaApiControls stream={ () => lane?.stream ?? null } log={ (message) => log.push(message) } />

      <Panel title="事件">
        <EventLog entries={ log.entries() } />
      </Panel>
    </PageShell>
  )
}

function SourceControls(props: SourceControlsProps) {
  return (
    <div class="mt-5">
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={ props.onConnect }>{ props.connectText }</Button>
        <Button variant="danger" onClick={ props.onDisconnect } disabled={ !props.label }>拔掉</Button>
        <StatusBadge
          tone={ props.label
            ? 'success'
            : 'neutral' }
        >
          { props.label
            ? '已接入'
            : '未接入' }
        </StatusBadge>
      </div>
      <p class="mt-3 min-h-5 break-all font-mono text-xs text-slate-400">{ props.label || '—' }</p>
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
      <div class="mt-3">
        <LevelBar level={ props.level } />
      </div>
    </div>
  )
}

function LevelBar(props: { level: number }) {
  return (
    <div class="h-2 overflow-hidden rounded-full bg-slate-800">
      <div class="h-full bg-emerald-400 transition-[width] duration-75" style={ { width: `${Math.min(props.level, 1) * 100}%` } } />
    </div>
  )
}

function deviceOptions(devices: MediaDeviceInfo[]): { value: string; label?: string }[] {
  return [
    { value: 'default', label: 'default（跟随系统默认）' },
    ...devices.map((device) => ({
      value: device.deviceId,
      label: device.label || `（未授权设备 ${device.deviceId.slice(0, 6)}…）`,
    })),
  ]
}

type SourceId = typeof SOURCE_IDS[number]
type SurfaceOption = typeof SURFACE_OPTIONS[number]['value']
type SystemAudio = typeof SYSTEM_AUDIO_OPTIONS[number]['value']
type WindowAudio = typeof WINDOW_AUDIO_OPTIONS[number]['value']
type ViewState = AudioLaneRecorderState | 'idle'
type LevelMeterHandle = { dispose: () => void }

interface SourceState {
  label: string | null
  level: number
}

interface RecordingOutput {
  url: string
  rawUrl: string
  size: number
  duration: number | null
  mimeType: string
  opusChannels: number | null
  chunks: number
}

interface SourceControlsProps {
  label: string | null
  level: number
  gain: number
  connectText: string
  onConnect: () => void
  onDisconnect: () => void
  onGain: (value: number) => void
}
