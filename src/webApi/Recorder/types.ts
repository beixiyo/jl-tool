/**
 * 录音相关的类型定义
 * 该文件定义了对外暴露的配置与回调类型
 */

import type { MediaOptions, NativeRecorderOptions, RecordingFinalizer, RecordingResult } from '../recording'

/** 可替换的采集与录制依赖 */
export interface RecorderEnvironment {
  /** 麦克风采集依赖。@default navigator.mediaDevices */
  mediaDevices?: Pick<MediaDevices, 'getUserMedia'>
  /** 原生编码器工厂。@default new MediaRecorder */
  createMediaRecorder?: (stream: MediaStream, options: MediaRecorderOptions) => MediaRecorder
  /** MIME 支持检测。@default MediaRecorder.isTypeSupported */
  isTypeSupported?: (mimeType: string) => boolean
  /** 单调毫秒时钟。@default performance.now */
  now?: () => number
}

/** Recorder 来源；外部流默认不转移所有权 */
export type RecorderSource =
  | { kind: 'microphone' }
  | {
    kind: 'media-stream'
    stream: MediaStream
    /** 销毁或切换到其他来源时停止此流的轨道；配置变更重建时继续使用同一流，不会停止。@default false */
    stopTracksOnDestroy?: boolean
  }

/**
 * 采集配置（媒体流与编码偏好）
 */
export type CaptureConfig = {
  /** 来源。外部流 stopTracksOnDestroy 默认 false。@default { kind: 'microphone' } */
  source?: RecorderSource
  /** 完整音频约束；对象覆盖旧快捷字段，函数返回完整约束。@default 由 deviceId 和三个处理开关生成 */
  audio?: MediaOptions<MediaTrackConstraints>
  /** 原生编码配置，覆盖 MIME 自动选择结果；函数可完全替换默认值。@default 自动选择 MIME */
  recorderOptions?: MediaOptions<NativeRecorderOptions>
  /** 分片间隔（毫秒）。@default undefined（仅停止时产出） */
  timesliceMs?: number
  /** 缓存分片并生成最终输出；false 时仅流式回调。@default true */
  retainChunks?: boolean
  /**
   * 最终 Blob 处理器；stop 等待其完成，原始分片不变
   * WebM 时长修复需由应用自行安装依赖并注入，示例见 {@link RecordingFinalizer}
   * @default undefined（原样输出，不内置时长修复）
   */
  finalizeBlob?: RecordingFinalizer
  /** 浏览器依赖。@default 当前浏览器环境 */
  environment?: RecorderEnvironment
  /** 指定要使用的音频设备 ID */
  deviceId?: string
  /** 优先选用的录制 MIME 类型顺序 */
  preferredMimeTypes?: string[]
  /** 是否开启回声消除 @default true */
  echoCancellation?: boolean
  /** 是否开启噪声抑制 @default true */
  noiseSuppression?: boolean
  /** 是否开启自动增益控制 @default true */
  autoGainControl?: boolean
}

/**
 * 分析配置（音频可视化）
 */
export type AnalysisConfig = {
  /** 是否创建 AnalyserNode 用于音频分析 @default false */
  createAnalyser?: boolean
  /** AnalyserNode 的 FFT 大小（2 的幂，32~32768） @default 2048 */
  fftSize?: number
  /** AnalyserNode 的平滑时间常数（0~1） @default 0.8 */
  smoothingTimeConstant?: number
}

/**
 * 输出配置（播放/下载）
 */
export type OutputConfig = {
  /** 下载时的默认文件名（不含扩展名） */
  defaultFileName?: string
  /** 根据 MIME 自动追加扩展名 @default true */
  appendExtFromMime?: boolean
}

/** 录制事件；未提供的回调不执行 */
export type RecorderCallbacks = {
  /** 每个非空原始分片，不含最终文件的时长修复 */
  onDataAvailable?: (blob: Blob, event: BlobEvent) => void
  /** 原生开始事件 */
  onStart?: () => void
  /** 原生暂停事件 */
  onPause?: () => void
  /** 原生恢复事件 */
  onResume?: () => void
  /** 原生状态变化 */
  onStateChange?: (state: RecordingState) => void
  /** 最终输出已处理完毕（包括零分片/流式模式） */
  onStop?: (result: RecordingResult) => void
}

/** 录音门面配置 */
export type RecorderOptions = CaptureConfig & AnalysisConfig & RecorderCallbacks & {
  /** 录音完成回调；URL 指向最终文件，chunks 保持原始分片语义 */
  onFinish?: (audioUrl: string, chunks: Blob[]) => void
  /** 发生错误时回调 */
  onError?: (error: Error) => void
  /** 是否在构造器中自动初始化 @default true */
  autoInit?: boolean
}
