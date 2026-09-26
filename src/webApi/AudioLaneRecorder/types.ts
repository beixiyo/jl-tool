import type { RecorderMimeType } from '../ScreenRecord/type'

/** {@link AudioLaneRecorder} 的构造参数 */
export interface AudioLaneRecorderOptions {
  /** 所属 AudioContext；同一场录音的多路共用一个，保证时钟一致。由调用方创建和关闭 */
  context: AudioContext
  /** MediaRecorder 分片间隔（毫秒）；不传则只在停止时产出一个分片 */
  timesliceMs?: number
  /**
   * 编码格式候选，按顺序取第一个浏览器支持的
   * @default ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
   */
  mimeTypes?: RecorderMimeType[]
  /**
   * 输出声道数；输入会按 speakers 规则下混 / 上混到该声道数
   * @default 1
   */
  channelCount?: 1 | 2
  /** 音频码率 */
  audioBitsPerSecond?: number
  /** 每个非空分片 */
  onDataAvailable?: (blob: Blob) => void
  /** 可替换的浏览器环境依赖 */
  environment?: AudioLaneRecorderEnvironment
}

/** {@link AudioLaneRecorder.setInput} 的选项 */
export interface AudioLaneInputOptions {
  /**
   * 该路输入的增益
   * @default 1
   */
  gain?: number
}

/** 输入源：采集流或已在同一 AudioContext 里的音频节点 */
export type AudioLaneSource = MediaStream | AudioNode

/** 录制状态；`stopped` 表示已调用 stop，实例不可再用 */
export type AudioLaneRecorderState = RecordingState | 'stopped'

/** 可替换的浏览器环境依赖，供测试或宿主注入 */
export interface AudioLaneRecorderEnvironment {
  createMediaRecorder?: (stream: MediaStream, options: MediaRecorderOptions) => MediaRecorder
}
