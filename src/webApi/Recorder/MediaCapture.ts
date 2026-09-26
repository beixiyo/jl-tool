/** 媒体采集、原始分片交付与最终录音文件的生命周期 */
import type { RecordingResult } from '../recording'
import { finalizeRecording, RecordingClock, resolveMediaOptions } from '../recording'
import type { CaptureConfig, RecorderOptions } from './types'

export class MediaCapture {
  stream: MediaStream | null = null
  mediaRecorder: MediaRecorder | null = null
  mimeType = 'audio/webm'
  chunks: Blob[] = []
  audioUrl = ''
  result: RecordingResult | null = null

  private config: CaptureConfig
  private hooks: RecorderOptions
  private clock: RecordingClock
  private ownsStream = false
  private generation = 0
  private initPromise: Promise<void> | null = null
  private completion: Promise<void> | null = null
  private resolveCompletion?: () => void
  private rejectCompletion?: (error: unknown) => void
  /** 本轮已开始且最终输出尚未交付；期间不能重建录制器 */
  private pending = false
  private dirty = false

  constructor(config: CaptureConfig, hooks: RecorderOptions = {}) {
    this.config = this.normalize(config)
    this.hooks = hooks
    this.clock = new RecordingClock(this.config.environment?.now)
  }

  private normalize(config: CaptureConfig): CaptureConfig {
    return {
      ...config,
      echoCancellation: config.echoCancellation ?? true,
      noiseSuppression: config.noiseSuppression ?? true,
      autoGainControl: config.autoGainControl ?? true,
      retainChunks: config.retainChunks ?? true,
      preferredMimeTypes: config.preferredMimeTypes ?? ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/webm'],
      source: config.source ?? { kind: 'microphone' },
      environment: config.environment ?? {},
    }
  }

  /** 更新下轮采集配置；正在录制时不打断流 */
  updateConfig(config: CaptureConfig) {
    this.config = this.normalize(config)
    this.dirty = true
  }

  /** 初始化；并发调用合流，销毁期间晚到的自有流立即停止 */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.initialize()
    try {
      await this.initPromise
    }
    finally {
      this.initPromise = null
    }
  }

  private async initialize(): Promise<void> {
    const generation = this.generation + 1
    /** 重建时继续使用的外部流不能被停止，否则新录制器会接到已结束的轨道 */
    const nextSource = this.config.source
    await this.release(nextSource?.kind === 'media-stream'
      ? nextSource.stream
      : undefined)

    if (generation !== this.generation) return
    const config = this.config
    const environment = config.environment!
    const source = config.source!
    const ownsStream = source.kind === 'microphone' || source.stopTracksOnDestroy === true

    try {
      const defaults: MediaTrackConstraints = {
        echoCancellation: config.echoCancellation,
        noiseSuppression: config.noiseSuppression,
        autoGainControl: config.autoGainControl,
        ...(config.deviceId
          ? { deviceId: { exact: config.deviceId } }
          : {}),
      }

      const stream = source.kind === 'media-stream'
        ? source.stream
        : await (environment.mediaDevices ?? navigator.mediaDevices).getUserMedia({ audio: resolveMediaOptions(defaults, config.audio) })

      if (generation !== this.generation) {
        if (ownsStream) stream.getTracks().forEach((track) => track.stop())
        return
      }

      this.stream = stream
      this.ownsStream = ownsStream

      const supports = environment.isTypeSupported ?? ((mime) => globalThis.MediaRecorder?.isTypeSupported(mime) ?? false)
      const mime = config.preferredMimeTypes!.find((value) => {
        try {
          return supports(value)
        }
        catch {
          return false
        }
      })

      const create = environment.createMediaRecorder ?? ((input, options) => new MediaRecorder(input, options))
      const recorder = create(
        stream,
        resolveMediaOptions(
          mime
            ? { mimeType: mime }
            : {},
          config.recorderOptions,
        ),
      )

      this.mediaRecorder = recorder
      this.mimeType = recorder.mimeType || mime || 'audio/webm'
      this.clock = new RecordingClock(environment.now)
      this.dirty = config !== this.config

      recorder.ondataavailable = (event) => {
        if (!event.data.size) return
        if (config.retainChunks) this.chunks.push(event.data)
        this.hooks.onDataAvailable?.(event.data, event)
      }
      recorder.onstart = () => {
        /** 调用方的 recorderOptions 可能去掉了自动选择的 MIME，以原生实际编码为准 */
        this.mimeType = recorder.mimeType || this.mimeType
        this.hooks.onStateChange?.('recording')
        this.hooks.onStart?.()
      }
      recorder.onpause = () => {
        this.hooks.onStateChange?.('paused')
        this.hooks.onPause?.()
      }
      recorder.onresume = () => {
        this.hooks.onStateChange?.('recording')
        this.hooks.onResume?.()
      }

      recorder.onerror = (event) => {
        const error = (event as Event & { error?: Error }).error ?? new Error('MediaRecorder error')
        this.rejectCompletion?.(error)
        this.hooks.onError?.(error)
      }
      recorder.onstop = () => {
        this.clock.pause()
        void this.finish(config, generation).then(this.resolveCompletion, (error) => {
          if (generation !== this.generation) return
          this.rejectCompletion?.(error)
          this.hooks.onError?.(error)
        })
      }
    }
    catch (error) {
      if (generation !== this.generation) return
      await this.release()
      this.hooks.onError?.(error as Error)
      throw error
    }
  }

  private async finish(config: CaptureConfig, generation: number): Promise<void> {
    const durationMs = this.clock.durationMs
    const blob = this.chunks.length
      ? await finalizeRecording({
        blob: new Blob(this.chunks, { type: this.mimeType }),
        durationMs,
        finalizeBlob: config.finalizeBlob,
      })
      : null

    if (generation !== this.generation) return
    this.result = { blob, durationMs, mimeType: this.mimeType }

    if (blob) {
      this.audioUrl = URL.createObjectURL(blob)
      this.hooks.onFinish?.(this.audioUrl, this.chunks)
    }
    this.hooks.onStateChange?.('inactive')
    this.hooks.onStop?.(this.result)
  }

  /** 是否有录制中、暂停中或正在生成最终输出的一轮 */
  get isBusy(): boolean {
    return this.pending || (!!this.mediaRecorder && this.mediaRecorder.state !== 'inactive')
  }

  /** 启动下一轮；重入先完成上一轮文件。上一轮的失败已由其 stop/onError 交付，不阻塞新一轮 */
  async start(timesliceMs?: number): Promise<void> {
    if (this.mediaRecorder?.state !== 'inactive' && this.mediaRecorder) await this.stop().catch(() => {})
    if (this.completion) await this.completion.catch(() => {})
    if (!this.mediaRecorder || this.dirty) await this.init()
    if (!this.mediaRecorder) return
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl)

    this.audioUrl = ''
    this.chunks = []
    this.result = null
    const completion = new Promise<void>((resolve, reject) => {
      this.resolveCompletion = resolve
      this.rejectCompletion = reject
    })
    this.completion = completion
    this.pending = true

    /** 原生异步错误可能发生在调用 stop 之前，保留拒绝结果但避免未处理 rejection */
    void completion
      .catch(() => {})
      .finally(() => {
        if (this.completion === completion) this.pending = false
      })
    this.clock.start()
    try {
      this.mediaRecorder.start(timesliceMs ?? this.config.timesliceMs)
    }
    catch (error) {
      this.clock.pause()
      this.rejectCompletion?.(error)
      this.hooks.onError?.(error as Error)
      throw error
    }
  }

  /** 等待最后分片和外部最终文件处理；同步原生失败保持抛错语义 */
  async stop(): Promise<void> {
    if (!this.mediaRecorder) return
    if (this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
        this.clock.pause()
      }
      catch (error) {
        this.rejectCompletion?.(error)
        this.hooks.onError?.(error as Error)
        throw error
      }
    }
    await this.completion
  }

  /** 原生同步失败只通知 onError，保持既有不抛错语义 */
  async pause(): Promise<void> {
    if (this.mediaRecorder?.state !== 'recording') return
    try {
      this.mediaRecorder.pause()
      this.clock.pause()
    }
    catch (error) {
      this.hooks.onError?.(error as Error)
    }
  }

  /** 原生同步失败只通知 onError，保持既有不抛错语义 */
  async resume(): Promise<void> {
    if (this.mediaRecorder?.state !== 'paused') return
    try {
      this.mediaRecorder.resume()
      this.clock.resume()
    }
    catch (error) {
      this.hooks.onError?.(error as Error)
    }
  }

  get isRecording() {
    return this.mediaRecorder?.state === 'recording'
  }

  get isPaused() {
    return this.mediaRecorder?.state === 'paused'
  }

  /**
   * 释放自有资源；外部流默认仅解除引用
   * @param reusedStream 重建后仍要使用的流，即使拥有所有权也不停止
   */
  async release(reusedStream?: MediaStream): Promise<void> {
    this.generation++
    const recorder = this.mediaRecorder

    if (recorder) {
      recorder.ondataavailable =
        recorder.onstop =
        recorder.onerror =
        recorder.onstart =
        recorder.onpause =
        recorder.onresume =
          null
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop()
        }
        catch { /* 仍然继续清理 */ }
      }
    }

    this.resolveCompletion?.()
    this.completion = null
    this.pending = false
    this.mediaRecorder = null

    if (this.ownsStream && this.stream !== reusedStream) this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl)

    this.audioUrl = ''
    this.chunks = []
    this.result = null
  }
}
