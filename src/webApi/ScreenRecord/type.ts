export type RecorderState
  = | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error'

/**
 * 录制类型
 * - 'video': 音视频录制
 * - 'audio': 仅音频录制
 */
export type CaptureKind = 'video' | 'audio'

/**
 * 某些项目未启用 DOM 扩展库时，TS 可能找不到 BlobEvent 类型
 * 这里定义一个最小子集，满足本工具的事件数据读取
 */
export type RecorderBlobEvent = {
  /** 事件携带的二进制数据块 */
  data: Blob
}

/**
 * 常见的媒体类型（容器/编码）
 * 注：不同浏览器支持的类型不同，需运行时检测
 */
export type RecorderMimeType
  = | 'video/webm;codecs=vp9,opus'
  | 'video/webm;codecs=vp8,opus'
  | 'video/webm;codecs=h264,opus'
  | 'video/webm'
  | 'video/mp4;codecs=h264,aac'
  | 'video/mp4'
  | string

/**
 * 屏幕录制回调
 */
export type ScreenRecorderCallbacks = {
  /** 数据片段可用时触发（仅当 timesliceMs 设置时持续触发） */
  onDataAvailable?: (evt: RecorderBlobEvent) => void
  /** 录制开始 */
  onStart?: () => void
  /** 录制停止（注意：停止后才生成最终 Blob） */
  onStop?: (finalBlob: Blob | null) => void
  /** 暂停 */
  onPause?: () => void
  /** 恢复 */
  onResume?: () => void
  /** 状态变更 */
  onStateChange?: (state: RecorderState) => void
  /** 错误 */
  onError?: (error: unknown) => void
}

export type DisplayMediaStreamConstraintsLike = {
  video?: boolean
  audio?: boolean | MediaTrackConstraints
}

/**
 * 显示媒体（屏幕/窗口/标签页）约束
 */
export type DisplayMediaConfig = {
  /**
   * 视频轨道约束
   * @default true
   */
  video?: boolean
  /**
   * 系统音频（系统播放声音）
   * - 大多数浏览器仅当选择“标签页”或特定窗口时才支持
   * - 如果需要系统音频，建议设置为 true 或传入更详细的约束
   * @default false
   */
  systemAudio?: boolean | MediaTrackConstraints
}

/**
 * 麦克风音频约束
 */
export type MicrophoneConfig = boolean | MediaTrackConstraints

/**
 * Electron 桌面捕获配置
 */
export type DesktopSourceConfig = {
  /**
   * desktopCapturer 返回的 source id
   */
  id: string
  /**
   * 录制帧率上限
   * @default 30
   */
  frameRate?: number
  /**
   * 期望宽度
   */
  width?: number
  /**
   * 期望高度
   */
  height?: number
}

/**
 * ScreenRecorder 初始化选项
 */
export type ScreenRecorderOptions = DisplayMediaConfig
  & ScreenRecorderCallbacks
  & {
    /**
     * 是否仅录制音频（不包含视频）
     * - 若同时开启 systemAudio，将尝试通过 getDisplayMedia 捕获系统音频（无视频）
     * - 若仅麦克风，则通过 getUserMedia 捕获麦克风音频
     * @default false
     */
    audioOnly?: boolean
    /**
     * 麦克风音频
     * - 如果同时开启 systemAudio 与 micAudio，将进行混音
     * @default false
     */
    micAudio?: MicrophoneConfig
    /**
     * 期望的媒体类型（按优先级排列，内部会自动择优）
     */
    preferMimeTypes?: RecorderMimeType[]
    /**
     * `MediaRecorder` 总码率（比特/秒），浏览器可能忽略或调整
     */
    bitsPerSecond?: number
    /**
     * 数据分片时间（毫秒）。设置后将在录制中持续触发 `onDataAvailable`
     * 如果不设置，`ondataavailable` 仅在 `stop()` 时触发一次
     */
    timesliceMs?: number
    /**
     * 指定 desktopCapturer 源，提供后将跳过浏览器弹窗，直接按该 source 捕获
     */
    desktopSource?: DesktopSourceConfig
  }


export type ChromeDesktopMandatory = {
  chromeMediaSource: 'desktop'
  chromeMediaSourceId: string
  maxFrameRate?: number
  maxWidth?: number
  maxHeight?: number
}

export type ChromeDesktopTrackConstraints = MediaTrackConstraints & {
  mandatory?: ChromeDesktopMandatory
  optional?: Array<Record<string, number>>
}

export type DesktopStreamRequest = {
  source: DesktopSourceConfig
  withAudio: boolean
  withVideo: boolean
}