import type { RecorderOptions } from '@/webApi/Recorder'
import type { ScreenRecorderOptions } from '@/webApi/ScreenRecord'
import type { SpeakerOptions } from '@/webApi/Speaker'
import type { SpeakToTxtOptions } from '@/webApi/SpeakToTxt'
import { Button, Panel, Toggle } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import type { FinalizerMode } from './FinalizerField'
/** 录音台的 Recorder/ScreenRecorder/语音合成/语音识别实验面板，统一观察事件并释放资源 */
import { Recorder } from '@/webApi/Recorder'
import { ScreenRecorder } from '@/webApi/ScreenRecord'
import { Speaker } from '@/webApi/Speaker'
import { SpeakToTxt } from '@/webApi/SpeakToTxt'
import { createDemoFinalizer, FinalizerField } from './FinalizerField'
import { nativeOptions, NativeOptionsField, parseOptions } from './NativeOptionsField'

export function MediaApiControls(props: { stream: () => MediaStream | null; log: (message: string) => void }) {
  const [functional, setFunctional] = createSignal(false)
  const [injected, setInjected] = createSignal(false)
  const [useMix, setUseMix] = createSignal(false)
  const [finalizerMode, setFinalizerMode] = createSignal<FinalizerMode>('none')
  const [ownMix, setOwnMix] = createSignal(false)
  const [grammar, setGrammar] = createSignal('')
  const [recorderJson, setRecorderJson] = createSignal('{"timesliceMs": 500, "createAnalyser": false, "retainChunks": true}')
  const [audioJson, setAudioJson] = createSignal('{"channelCount": 1, "sampleRate": 48000}')
  const [encodingJson, setEncodingJson] = createSignal('{"mimeType": "audio/webm;codecs=opus", "audioBitsPerSecond": 64000}')
  const [screenJson, setScreenJson] = createSignal(
    '{"audioOnly": true, "micAudio": true, "systemAudio": false, "timesliceMs": 500, "retainChunks": true}',
  )
  const [displayJson, setDisplayJson] = createSignal('{"video": true, "audio": true}')
  const [speakerJson, setSpeakerJson] = createSignal('{"txt": "你好，媒体 API 配置测试。", "lang": "zh-CN", "rate": 1, "pitch": 1, "volume": 1}')
  const [utteranceJson, setUtteranceJson] = createSignal('{}')
  const [voiceNames, setVoiceNames] = createSignal<SpeechSynthesisVoice[]>([])
  const [voiceName, setVoiceName] = createSignal('')
  const [recognitionJson, setRecognitionJson] = createSignal('{"lang": "zh-CN", "continuous": false, "interimResults": true, "maxAlternatives": 3}')
  const [recognitionNativeJson, setRecognitionNativeJson] = createSignal('{"processLocally": false}')
  const [url, setUrl] = createSignal('')
  let recorder: Recorder | null = null
  let screen: ScreenRecorder | null = null
  let speaker: Speaker | null = null
  let recognition: SpeakToTxt | null = null
  let disposed = false
  let screenUrl = ''
  const event = (name: string) => () => props.log(name)
  const error = (value: unknown) =>
    props.log(`error · ${
      value instanceof Error
        ? value.message
        : String(value)
    }`)
  let pending = false
  const run = (action: () => unknown) => {
    if (pending || disposed) return
    pending = true
    void Promise.resolve().then(action).catch(error).finally(() => {
      pending = false
    })
  }
  const showBlob = (blob: Blob | null) => {
    if (disposed) return
    if (screenUrl) URL.revokeObjectURL(screenUrl)
    screenUrl = blob
      ? URL.createObjectURL(blob)
      : ''
    setUrl(screenUrl)
  }
  const createRecorder = async () => {
    const config = parseOptions<RecorderOptions>(recorderJson())
    const audio = nativeOptions<MediaTrackConstraints>(audioJson(), functional())
    const recorderOptions = nativeOptions<MediaRecorderOptions>(encodingJson(), functional())
    const stream = useMix()
      ? props.stream()
      : null
    if (useMix() && !stream) throw new Error('请先在上方开始混音录制，再接入混音输出')
    await recorder?.destroy()
    if (disposed) return
    recorder = new Recorder({
      ...config,
      autoInit: config.autoInit ?? false,
      audio,
      recorderOptions,
      finalizeBlob: createDemoFinalizer(finalizerMode(), props.log),
      source: stream
        ? { kind: 'media-stream', stream, stopTracksOnDestroy: ownMix() }
        : { kind: 'microphone' },
      environment: injected()
        ? {
          mediaDevices: {
            getUserMedia: (constraints) => {
              props.log(`DI getUserMedia ${JSON.stringify(constraints)}`)
              return navigator.mediaDevices.getUserMedia(constraints)
            },
          },
          createMediaRecorder: (input, options) => {
            props.log(`DI MediaRecorder ${JSON.stringify(options)}`)
            return new MediaRecorder(input, options)
          },
        }
        : undefined,
      onDataAvailable: (blob) => props.log(`Recorder data · ${blob.size}`),
      onFinish: (_url, chunks) => props.log(`Recorder onFinish · ${chunks.length} raw chunks`),
      onStateChange: (state) => props.log(`Recorder state · ${state}`),
      onStart: event('Recorder start'),
      onPause: event('Recorder pause'),
      onResume: event('Recorder resume'),
      onError: error,
      onStop: (result) => {
        props.log(`Recorder stop · ${result.durationMs.toFixed(0)} ms`)
        showBlob(result.blob)
      },
    })
    await recorder.start()
  }
  const createScreen = async () => {
    screen?.dispose()
    screen = new ScreenRecorder({
      ...parseOptions<ScreenRecorderOptions>(screenJson()),
      displayMediaOptions: nativeOptions(displayJson(), functional()),
      recorderOptions: nativeOptions(encodingJson(), functional()),
      finalizeBlob: createDemoFinalizer(finalizerMode(), props.log),
      onDataAvailable: (event) => props.log(`Screen data · ${event.data.size}`),
      onStateChange: (state) => props.log(`Screen state · ${state}`),
      onError: error,
      onStart: event('Screen start'),
      onPause: event('Screen pause'),
      onResume: event('Screen resume'),
      onStop: (blob) => props.log(`Screen onStop · ${blob?.size ?? 0} bytes`),
      onResult: (result) => {
        props.log(`Screen result · ${result.durationMs.toFixed(0)} ms`)
        showBlob(result.blob)
      },
    })
    await screen.start()
  }
  const createSpeaker = (play: boolean) => {
    speaker?.destroy()
    speaker = new Speaker({
      ...parseOptions<SpeakerOptions>(speakerJson()),
      ...(voiceName()
        ? { voiceName: voiceName() }
        : {}),
      utteranceOptions: nativeOptions(utteranceJson(), functional()),
      environment: injected()
        ? {
          speechSynthesis,
          createUtterance: () => {
            props.log('DI utterance')
            return new SpeechSynthesisUtterance()
          },
        }
        : undefined,
      onVoicesChanged: (voices) => {
        setVoiceNames(voices)
        props.log(`Speaker voiceschanged · ${voices.length}`)
      },
      onStart: event('Speaker start'),
      onEnd: event('Speaker end'),
      onPause: event('Speaker pause'),
      onResume: event('Speaker resume'),
      onBoundary: (value) => props.log(`Speaker boundary · ${value.charIndex}`),
      onMark: event('Speaker mark'),
      onError: (value) => props.log(`Speaker error · ${value.error}`),
    })
    if (play) speaker.play()
  }
  const createRecognition = () => {
    recognition?.destroy()
    let grammars: SpeechGrammarList | undefined
    if (grammar().trim()) {
      const Ctor = typeof SpeechGrammarList === 'undefined'
        ? webkitSpeechGrammarList
        : SpeechGrammarList
      grammars = new Ctor()
      grammars.addFromString(grammar(), 1)
    }
    recognition = new SpeakToTxt({
      ...parseOptions<SpeakToTxtOptions>(recognitionJson()),
      grammars,
      recognitionOptions: nativeOptions(recognitionNativeJson(), functional()),
      environment: injected()
        ? {
          createRecognition: () => {
            props.log('DI SpeechRecognition')
            const Ctor = typeof SpeechRecognition === 'undefined'
              ? webkitSpeechRecognition
              : SpeechRecognition
            return new Ctor()
          },
        }
        : undefined,
      onstart: event('STT start'),
      onEnd: event('STT end'),
      onResult: (text, value) => props.log(`STT result · ${text} · alternatives=${value.results[value.resultIndex]?.length}`),
      onError: (value) => props.log(`STT error · ${value.error} · ${value.message}`),
      onNoMatch: event('STT nomatch'),
      onAudioStart: event('STT audiostart'),
      onAudioEnd: event('STT audioend'),
      onSoundStart: event('STT soundstart'),
      onSoundEnd: event('STT soundend'),
      onSpeechStart: event('STT speechstart'),
      onSpeechEnd: event('STT speechend'),
    })
    recognition.start()
  }
  onCleanup(() => {
    disposed = true
    void recorder?.destroy()
    screen?.dispose()
    speaker?.destroy()
    recognition?.destroy()
    if (screenUrl) URL.revokeObjectURL(screenUrl)
  })
  return (
    <Panel
      title="其他媒体 API · 完整配置实验室"
      description="JSON 支持所有可序列化原生字段，事件统一进入下方日志。环境注入使用真实浏览器代理，不伪造权限。配置在创建时生效。"
    >
      <div class="flex flex-wrap gap-4">
        <Toggle checked={ functional() } onChange={ setFunctional }>函数式加工默认值</Toggle>
        <Toggle checked={ injected() } onChange={ setInjected }>environment 注入并记录参数</Toggle>
        <FinalizerField value={ finalizerMode() } onChange={ setFinalizerMode } />
      </div>
      <details class="mt-5" open>
        <summary>Recorder · 麦克风 / 混音流</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <NativeOptionsField label="Recorder 配置（含 deviceId / preferredMimeTypes / analyser）" value={ recorderJson() } onChange={ setRecorderJson } />
          <NativeOptionsField label="Recorder audio 完整约束" value={ audioJson() } onChange={ setAudioJson } />
          <NativeOptionsField label="原生 MediaRecorderOptions（Recorder / Screen 共用）" value={ encodingJson() } onChange={ setEncodingJson } />
        </div>
        <Toggle checked={ useMix() } onChange={ setUseMix }>来源使用上方混音输出（借用，不停止音轨）</Toggle>
        <Toggle checked={ ownMix() } onChange={ setOwnMix }>stopTracksOnDestroy（销毁时也停止混音输出轨）</Toggle>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button onClick={ () => run(createRecorder) }>Recorder 创建并 start</Button>
          <Button onClick={ () => run(() => recorder?.pause()) }>Recorder pause</Button>
          <Button onClick={ () => run(() => recorder?.resume()) }>Recorder resume</Button>
          <Button onClick={ () => run(() => recorder?.requestData()) }>Recorder requestData</Button>
          <Button onClick={ () => run(() => recorder?.stop()) }>Recorder stop</Button>
          <Button onClick={ () => run(() => recorder?.destroy()) }>Recorder destroy</Button>
        </div>
      </details>
      <details class="mt-5">
        <summary>ScreenRecorder · 屏幕 / 音频</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <NativeOptionsField label="ScreenRecorder 完整配置" value={ screenJson() } onChange={ setScreenJson } />
          <NativeOptionsField label="Screen getDisplayMedia 完整配置" value={ displayJson() } onChange={ setDisplayJson } />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button onClick={ () => run(createScreen) }>Screen start</Button>
          <Button onClick={ () => run(() => screen?.pause()) }>Screen pause</Button>
          <Button onClick={ () => run(() => screen?.resume()) }>Screen resume</Button>
          <Button onClick={ () => run(() => screen?.requestData()) }>Screen requestData</Button>
          <Button onClick={ () => run(() => screen?.stop()) }>Screen stop</Button>
          <Button onClick={ () => screen?.dispose() }>Screen dispose</Button>
        </div>
      </details>
      <details class="mt-5">
        <summary>Speaker · 全事件 / 声音异步加载</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <NativeOptionsField label="Speaker 完整配置（含 voiceName）" value={ speakerJson() } onChange={ setSpeakerJson } />
          <NativeOptionsField label="SpeechSynthesisUtterance 原生配置" value={ utteranceJson() } onChange={ setUtteranceJson } />
        </div>
        <label class="block text-sm">
          声音（创建后自动加载）
          <select class="m-3 bg-slate-950" value={ voiceName() } onChange={ (event) => setVoiceName(event.currentTarget.value) }>
            <option value="">按 JSON 的 voiceName</option>
            { voiceNames().map((voice) => <option value={ voice.name }>{ voice.name }</option>) }
          </select>
        </label>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button onClick={ () => run(() => createSpeaker(false)) }>加载声音</Button>
          <Button onClick={ () => run(() => createSpeaker(true)) }>Speaker play</Button>
          <Button onClick={ () => speaker?.pause() }>Speaker pause</Button>
          <Button onClick={ () => speaker?.resume() }>Speaker resume</Button>
          <Button onClick={ () => speaker?.stop() }>Speaker stop</Button>
          <Button onClick={ () => speaker?.destroy() }>Speaker destroy</Button>
        </div>
      </details>
      <details class="mt-5">
        <summary>SpeakToTxt · 原生配置 / 错误事件</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <NativeOptionsField label="SpeakToTxt 完整配置" value={ recognitionJson() } onChange={ setRecognitionJson } />
          <NativeOptionsField
            label="SpeechRecognition 原生配置（如 processLocally / phrases）"
            value={ recognitionNativeJson() }
            onChange={ setRecognitionNativeJson }
          />
          <NativeOptionsField label="SpeechGrammarList · JSGF（可空，浏览器可能忽略）" value={ grammar() } onChange={ setGrammar } />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button onClick={ () => run(createRecognition) }>STT start</Button>
          <Button onClick={ () => run(() => recognition?.stop()) }>STT stop</Button>
          <Button onClick={ () => run(() => recognition?.abort()) }>STT abort</Button>
          <Button onClick={ () => run(() => recognition?.destroy()) }>STT destroy</Button>
        </div>
      </details>
      { url() && <audio class="mt-5 w-full" aria-label="其他 API 录音输出" controls preload="metadata" src={ url() } /> }
    </Panel>
  )
}
