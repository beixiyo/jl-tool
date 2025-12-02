import type { AnalysisConfig, CaptureConfig, RecorderOptions } from './types'
import { AudioAnalysis } from './AudioAnalysis'
import { COMMON_FORMATS } from './constants'
import { MediaCapture } from './MediaCapture'
import * as output from './output'

/**
 * 录音门面：组合采集/分析/输出
 */
export class Recorder {
  audioUrl = ''
  chunks: Blob[] = []
  mimeType = 'audio/webm'

  /** 直接暴露给外部以兼容可视化/状态读取 */
  mediaRecorder: MediaRecorder | null = null
  analyser: AnalyserNode | null = null

  capture: MediaCapture
  analysis: AudioAnalysis
  private config: RecorderOptions
  private initPromise: Promise<void> | null = null

  constructor(options?: RecorderOptions) {
    const defaultOptions: Partial<RecorderOptions> = {
      autoInit: true,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      createAnalyser: false,
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      preferredMimeTypes: [
        'audio/mp4;codecs=mp4a.40.2',
        'audio/webm;codecs=opus',
        'audio/webm',
      ],
    }
    this.config = { ...defaultOptions, ...options }

    this.capture = new MediaCapture(this.pickCapture(this.config), {
      onFinish: (url, chunks) => {
        this.audioUrl = url
        this.chunks = chunks
        this.mimeType = this.capture.mimeType
        this.config.onFinish?.(url, chunks)
      },
      onError: e => this.config.onError?.(e),
    })
    this.analysis = new AudioAnalysis(this.pickAnalysis(this.config))

    if (this.config.autoInit) {
      this.init()
    }
  }

  /**
   * 检测浏览器支持的音频格式
   * @param formatList 要检测的格式列表，默认使用常见格式列表
   * @returns 返回支持的格式数组，按检测顺序排序
   */
  static getSupportedFormats(formatList: string[] = COMMON_FORMATS): string[] {
    const supported: string[] = []

    for (const format of formatList) {
      try {
        if ((MediaRecorder as any).isTypeSupported?.(format)) {
          supported.push(format)
        }
      }
      catch {
        /** 忽略不支持的格式，继续检测下一个 */
      }
    }

    return supported
  }

  private pickCapture(c: RecorderOptions): CaptureConfig {
    return {
      deviceId: c.deviceId,
      preferredMimeTypes: c.preferredMimeTypes,
      echoCancellation: c.echoCancellation,
      noiseSuppression: c.noiseSuppression,
      autoGainControl: c.autoGainControl,
    }
  }

  private pickAnalysis(c: RecorderOptions): AnalysisConfig {
    return {
      createAnalyser: c.createAnalyser,
      fftSize: c.fftSize,
      smoothingTimeConstant: c.smoothingTimeConstant,
    }
  }

  /** 显式初始化，可重入（合流避免并发） */
  async init() {
    if (this.initPromise)
      return this.initPromise
    this.initPromise = (async () => {
      await this.capture.init()
      this.mediaRecorder = this.capture.mediaRecorder
      if (this.capture.stream) {
        await this.analysis.detach()
        this.analysis.attach(this.capture.stream)
        this.analyser = this.analysis.analyser
      }
      this.mimeType = this.capture.mimeType
    })()
    try {
      await this.initPromise
    }
    finally {
      this.initPromise = null
    }
  }

  /** 判定是否已完成所需初始化（采集 + 可选分析） */
  private get isReady() {
    if (!this.capture.mediaRecorder)
      return false
    if (this.config.createAnalyser && !this.analysis.analyser)
      return false
    return true
  }

  /** 开始录音 */
  async start() {
    if (!this.isReady) {
      await this.init()
    }
    await this.capture.start()
    this.mediaRecorder = this.capture.mediaRecorder
  }

  /** 停止录音 */
  async stop() {
    await this.capture.stop()
  }

  /** 暂停录音 */
  async pause() {
    await this.capture.pause()
  }

  /** 继续录音 */
  async resume() {
    await this.capture.resume()
  }

  /** 是否在录制 */
  get isRecording() {
    return this.capture.isRecording
  }

  /** 是否暂停 */
  get isPaused() {
    return this.capture.isPaused
  }

  /** 获取频域数据 */
  getByteFrequencyData(out?: Uint8Array<ArrayBuffer>) {
    return this.analysis.getByteFrequencyData(out)
  }

  /** 下载录音 */
  download(fileName?: string) {
    if (!this.chunks.length)
      return this
    const blob = new Blob(this.chunks, { type: this.mimeType })
    output.download(blob, fileName || '', this.mimeType)
    return this
  }

  /** 播放录音 */
  play(url?: string) {
    const target = url ?? this.audioUrl
    if (!target)
      return this
    output.play(target)
    return this
  }

  /** 更新配置（采集/分析分别更新） */
  updateConfig(options: Partial<RecorderOptions>) {
    const before = this.config
    this.config = { ...before, ...options }

    /** 分析参数即时更新 */
    this.analysis.updateConfig(this.pickAnalysis(this.config))

    /** 采集相关变化需要重建 */
    const reinitRelated: (keyof RecorderOptions)[] = [
      'deviceId',
      'echoCancellation',
      'noiseSuppression',
      'autoGainControl',
      'preferredMimeTypes',
      'createAnalyser',
    ]
    const anyOpts = options as any
    const willReinit = reinitRelated.some(k => anyOpts[k] !== undefined && anyOpts[k] !== (before as any)[k])

    if (willReinit && this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
      /** 录制/暂停中不重建，交由调用方在停止后再改 */
      return this
    }

    if (willReinit) {
      this.init().catch(e => this.config.onError?.(e))
    }
    return this
  }

  /** 销毁：释放所有资源并撤销 URL */
  async destroy() {
    await this.analysis.detach()
    await this.capture.release()
    this.mediaRecorder = null
    this.analyser = null
    this.chunks = []
    this.audioUrl = ''
  }
}
