import { downloadByData } from '@/fileTool/tools'

/**
 * 录音机类，提供录音、播放、音频分析等功能
 * @example
 * ```ts
 * const recorder = new Recorder({
 *   onFinish: (audioUrl, chunks) => {
 *     console.log('录音完成:', audioUrl)
 *     recorder.play()
 *   }
 * })
 *
 * await recorder.init()
 * recorder.start()
 *
 * // 停止
 * setTimeout(() => {
 *   recorder.stop()
 * }, 5000)
 * ```
 */
export class Recorder {
  /** 录制的音频的临时 URL。录制完毕后自动赋值，每次开始录制前会清空 */
  audioUrl = ''
  /** 录制的音频 Blob 数据块。录制完毕后自动赋值，每次开始录制前会清空 */
  chunks: Blob[] = []
  /** MediaStream 实例，代表一个媒体内容的流 */
  stream: MediaStream | null = null
  /** MediaRecorder 实例，用于录制媒体 */
  mediaRecorder: MediaRecorder | null = null
  /** 初始化时实际选用的录制 MIME 类型 */
  mimeType = 'audio/webm'
  /** AudioContext 实例，用于处理和合成音频 */
  audioContext: AudioContext | null = null
  /** AnalyserNode 实例，用于获取音频时间和频率数据，实现音频可视化 */
  analyser: AnalyserNode | null = null

  /** 录音器的配置选项 */
  private options: RecorderOptions

  /**
   * 优先选用的录制 MIME 类型顺序，可外部覆盖以自定义优先级
   */
  static preferredMimeTypes = [
    'audio/mp4;codecs=mp4a.40.2', // AAC/M4A
    'audio/webm;codecs=opus', // OGG/Opus
    'audio/webm',
  ]

  /**
   * @param options 录音器配置选项
   */
  constructor(options?: RecorderOptions) {
    const defaultOptions: Partial<RecorderOptions> = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      createAnalyser: false,
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
    }
    this.options = { ...defaultOptions, ...options }
  }

  /**
   * 初始化录音机，获取用户媒体权限并设置好 MediaRecorder 和 AnalyserNode
   * @returns Promise<void>
   */
  async init(): Promise<void> {
    try {
      const { deviceId, echoCancellation, noiseSuppression, autoGainControl } = this.options
      const audioConstraints: MediaTrackConstraints = deviceId
        ? {
            deviceId: { exact: deviceId },
            echoCancellation,
            noiseSuppression,
            autoGainControl,
          }
        : {
            echoCancellation,
            noiseSuppression,
            autoGainControl,
          }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })

      /** 动态选择最优录制 MIME（按 Recorder.preferredMimeTypes 顺序） */
      const supportedMimeType = Recorder.preferredMimeTypes.find((t) => {
        try { return MediaRecorder.isTypeSupported?.(t) }
        catch { return false }
      }) || ''

      this.mediaRecorder = new MediaRecorder(this.stream, supportedMimeType
        ? { mimeType: supportedMimeType }
        : {})
      /** 存储 MIME 类型 */
      this.mimeType = this.mediaRecorder.mimeType || 'audio/webm'

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        if (this.chunks.length === 0)
          return

        const audioBlob = new Blob(this.chunks, { type: this.mimeType })
        this.audioUrl = URL.createObjectURL(audioBlob)

        this.options.onFinish?.(this.audioUrl, this.chunks)
      }

      /** 如果需要，创建音频分析器 */
      if (this.options.createAnalyser) {
        const AudioContextConstructor
          = window.AudioContext
            || (window as any).webkitAudioContext
        this.audioContext = new AudioContextConstructor()
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = this.options.fftSize!
        this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant!

        const source = this.audioContext.createMediaStreamSource(this.stream)
        source.connect(this.analyser)
      }
    }
    catch (error) {
      console.error('获取麦克风权限失败(Error accessing microphone):', error)
      this.options.onError?.(error as Error)
    }
  }

  /**
   * 获取实时音频频域数据
   * 如果 AnalyserNode 未创建，则返回 null
   * @returns Uint8Array | null
   */
  getByteFrequencyData(): Uint8Array | null {
    if (!this.analyser)
      return null
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  /**
   * 开始录音
   * @returns this
   */
  start() {
    if (!this.mediaRecorder) {
      console.warn('请先调用`init`方法并等待初始化完成')
      return this
    }

    /** 如果正在录音，则先停止上一次的录音 */
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }

    this.chunks = []
    this.audioUrl = ''
    this.mediaRecorder.start()
    return this
  }

  /**
   * 停止录音
   * 停止后，结果会通过构造器中传递的 `onFinish` 回调返回
   * @returns this
   */
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
    return this
  }

  /**
   * 检查是否正在录制
   * @returns boolean
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || false
  }

  /**
   * 播放录音
   * @param url 可选，要播放的音频 URL，如果未提供，则播放上一次录制的音频
   * @returns this
   */
  play(url?: string) {
    const targetUrl = url ?? this.audioUrl
    if (!targetUrl) {
      console.warn('无可用音频资源，请在录音完成后或在`onFinish`回调中调用')
      return this
    }

    const audio = new Audio(targetUrl)
    audio.play()
    return this
  }

  /**
   * 下载录音文件，支持指定目标格式（扩展名），优先按后端支持格式命名
   * @param format 目标格式，支持：'wav'|'mp3'|'ogg'|'aac'|'m4a'|'webm'|'mp4'，默认按录制格式
   * @param filename 文件名（不含扩展名），默认为时间戳
   */
  download(filename?: string) {
    if (!this.audioUrl) {
      console.warn('无可用音频资源，请在录音完成后或在`onFinish`回调中调用')
      return this
    }
    const baseName = filename || new Date().toISOString().replace(/[:.]/g, '-')
    const audioBlob = new Blob(this.chunks, { type: this.mimeType })
    downloadByData(audioBlob, baseName)
    return this
  }

  /**
   * 销毁实例，释放所有占用的媒体资源
   */
  destroy() {
    this.stop()
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    this.mediaRecorder = null
    this.audioContext = null
    this.analyser = null
    this.chunks = []
    this.audioUrl = ''
  }

  /**
   * 获取可用的音频输入设备列表
   * @returns Promise<MediaDeviceInfo[]>
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      /** 请求一次权限，以便获取完整的设备列表信息（特别是 label） */
      await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    catch (error) {
      console.warn('请求麦克风权限失败，设备列表可能不完整:', error)
    }
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'audioinput')
  }
}

export type RecorderOptions = {
  /** 录音完成的回调 */
  onFinish?: (audioUrl: string, chunks: Blob[]) => void
  /** 发生错误时的回调 */
  onError?: (error: Error) => void
  /** 指定要使用的音频设备 ID */
  deviceId?: string
  /**
   * 是否开启回声消除
   * @default true
   */
  echoCancellation?: boolean
  /**
   * 是否开启噪声抑制
   * @default true
   */
  noiseSuppression?: boolean
  /**
   * 是否开启自动增益控制
   * @default true
   */
  autoGainControl?: boolean
  /**
   * 是否创建 AnalyserNode 用于音频分析
   * @default false
   */
  createAnalyser?: boolean
  /**
   * AnalyserNode 的 FFT 大小
   * @default 2048
   */
  fftSize?: number
  /**
   * AnalyserNode 的平滑时间常数
   * @default 0.8
   */
  smoothingTimeConstant?: number
}
