/**
 * 录音相关的类型定义
 * 该文件定义了对外暴露的配置与回调类型
 */

/**
 * 采集配置（媒体流与编码偏好）
 */
export type CaptureConfig = {
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

/**
 * 录音门面配置
 */
export type RecorderOptions = CaptureConfig & AnalysisConfig & {
  /** 录音完成回调，返回音频 URL 与数据块 */
  onFinish?: (audioUrl: string, chunks: Blob[]) => void
  /** 发生错误时回调 */
  onError?: (error: Error) => void
  /** 是否在构造器中自动初始化 @default true */
  autoInit?: boolean
}
