/** PCM 编码格式。 */
export type PcmEncoding = 's16le' | 'f32le'

/** PCM 采集器生命周期状态。 */
export type PcmCaptureState =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'recording'
  | 'stopping'
  | 'destroyed'

/** 麦克风输入源。 */
export interface PcmMicrophoneSource {
  kind: 'microphone'
  /** 完整透传给 getUserMedia 的音频约束。@default true */
  constraints?: boolean | MediaTrackConstraints
}

/** 已存在的 MediaStream 输入源。 */
export interface PcmMediaStreamSource {
  kind: 'media-stream'
  stream: MediaStream
  /** destroy 时是否停止 stream 中的 track。@default false */
  stopTracksOnDestroy?: boolean
}

/** 已存在的 Web Audio 节点输入源。 */
export interface PcmAudioNodeSource {
  kind: 'audio-node'
  node: AudioNode
}

/** 支持的音频输入源；不传时默认申请麦克风。 */
export type PcmCaptureSource = PcmMicrophoneSource | PcmMediaStreamSource | PcmAudioNodeSource

/** PCM 输出格式。 */
export interface PcmCaptureFormatOptions {
  /** 目标采样率；不传时使用 AudioContext 的实际采样率。 */
  sampleRate?: number
  /** 输出声道数。@default 1 */
  channelCount?: 1 | 2
  /** 输出编码。@default 's16le' */
  encoding?: PcmEncoding
  /** 每帧时长；与 frameSamples 互斥。@default 100 */
  frameDurationMs?: number
  /** 每声道每帧采样点数；与 frameDurationMs 互斥。 */
  frameSamples?: number
}

/** 音量计配置。 */
export interface PcmLevelMeterOptions {
  /** 是否计算音量。@default true */
  enabled?: boolean
  /** 音量回调间隔。@default 50 */
  intervalMs?: number
  /** RMS 映射增益。@default 1 */
  gain?: number
}

/** AudioContext 的创建与所有权配置。 */
export interface PcmAudioContextOptions {
  /** 复用现有 AudioContext；audio-node 来源必须和它属于同一 Context。 */
  instance?: AudioContext
  /** 创建新 Context 时透传的选项；sampleRate 由 format.sampleRate 统一管理。 */
  options?: Omit<AudioContextOptions, 'sampleRate'>
  /** destroy 时是否关闭 Context。默认值为“仅关闭本模块创建的 Context”。 */
  closeOnDestroy?: boolean
}

/** AudioWorklet 加载配置。 */
export type PcmWorkletOptions = {
  /** start/flush 握手超时。@default 1000 */
  commandTimeoutMs?: number
} & (
  | {
    /** 使用包内置 Worklet 模块。 */
    moduleUrl?: never
    processorName?: never
  }
  | {
    /** 自定义 Worklet 模块 URL。 */
    moduleUrl: string | URL
    /** 自定义模块注册的 processor 名称。@default '@jl-org/pcm-capture' */
    processorName?: string
  }
)

/** 可替换的浏览器环境依赖，供非 window 环境、测试或宿主注入。 */
export interface PcmCaptureEnvironment {
  mediaDevices?: Pick<MediaDevices, 'getUserMedia'>
  createAudioContext?: (options?: AudioContextOptions) => AudioContext
  createAudioWorkletNode?: (
    context: BaseAudioContext,
    name: string,
    options?: AudioWorkletNodeOptions,
  ) => AudioWorkletNode
  setTimeout?: typeof globalThis.setTimeout
  clearTimeout?: typeof globalThis.clearTimeout
}

/** 一帧 PCM 数据及其稳定元信息。 */
export interface PcmCaptureFrame {
  /** 独占所有权的原始 PCM ArrayBuffer。 */
  data: ArrayBuffer
  /** 当前 start/stop 周期内从 0 开始的帧序号。 */
  sequence: number
  /** 从本轮首个采样点起算的时间戳。 */
  timestampMs: number
  /** 本帧每个声道的采样点数。 */
  samplesPerChannel: number
  format: Readonly<PcmCaptureFormat>
}

/** 已归一化的实际 PCM 格式。 */
export interface PcmCaptureFormat {
  sampleRate: number
  channelCount: 1 | 2
  encoding: PcmEncoding
  frameSamples: number
  frameDurationMs: number
  bytesPerSample: 2 | 4
  frameBytes: number
}

/** 一次 start/stop 周期的统计结果。 */
export interface PcmCaptureSummary {
  frames: number
  bytes: number
  samplesPerChannel: number
  durationMs: number
  format: Readonly<PcmCaptureFormat>
}

/** prepare 后可用于诊断设备与实际输出的信息。 */
export interface PcmCaptureInfo {
  format: Readonly<PcmCaptureFormat>
  trackSettings: MediaTrackSettings | null
}

/** 通用实时 PCM 采集器配置。 */
export interface PcmCaptureOptions {
  /** 音频来源。@default { kind: 'microphone', constraints: true } */
  source?: PcmCaptureSource
  format?: PcmCaptureFormatOptions
  levelMeter?: PcmLevelMeterOptions
  audioContext?: PcmAudioContextOptions
  worklet?: PcmWorkletOptions
  environment?: PcmCaptureEnvironment
  /** 每产生一帧 PCM 时同步调用。 */
  onFrame: (frame: PcmCaptureFrame) => void
  /** 音量值，范围 0..1。 */
  onLevel?: (level: number) => void
  /** 生命周期状态变化。 */
  onStateChange?: (state: PcmCaptureState) => void
  /** Worklet 或回调错误。 */
  onError?: (error: Error) => void
}
