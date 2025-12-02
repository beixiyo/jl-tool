import type { CaptureConfig, RecorderOptions } from './types'

/**
 * 媒体采集与录制控制模块
 */
export class MediaCapture {
  stream: MediaStream | null = null
  mediaRecorder: MediaRecorder | null = null
  mimeType = 'audio/webm'
  chunks: Blob[] = []
  audioUrl = ''

  private config: CaptureConfig
  private onFinish?: RecorderOptions['onFinish']
  private onError?: RecorderOptions['onError']
  private initPromise: Promise<void> | null = null

  constructor(config: CaptureConfig, hooks?: { onFinish?: RecorderOptions['onFinish'], onError?: RecorderOptions['onError'] }) {
    this.config = config
    this.onFinish = hooks?.onFinish
    this.onError = hooks?.onError
  }

  /** 初始化媒体流与 MediaRecorder */
  async init() {
    if (this.initPromise)
      return this.initPromise

    this.initPromise = (async () => {
      await this.release()

      const { deviceId, echoCancellation = true, noiseSuppression = true, autoGainControl = true } = this.config

      const audioConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, echoCancellation, noiseSuppression, autoGainControl }
        : { echoCancellation, noiseSuppression, autoGainControl }

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      }
      catch (error) {
        this.onError?.(error as Error)
        throw error
      }

      const mime = this.pickSupportedMime(this.config.preferredMimeTypes || [
        'audio/mp4;codecs=mp4a.40.2',
        'audio/webm;codecs=opus',
        'audio/webm',
      ])

      this.mediaRecorder = new MediaRecorder(this.stream, mime
        ? { mimeType: mime }
        : {})
      this.mimeType = this.mediaRecorder.mimeType || mime || 'audio/webm'

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0)
          this.chunks.push(e.data)
      }

      this.mediaRecorder.onstop = () => {
        if (this.chunks.length === 0)
          return
        const blob = new Blob(this.chunks, { type: this.mimeType })
        if (this.audioUrl && this.audioUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(this.audioUrl) }
          catch { }
        }
        this.audioUrl = URL.createObjectURL(blob)
        this.onFinish?.(this.audioUrl, this.chunks)
      }
    })()

    try {
      await this.initPromise
    }
    finally {
      this.initPromise = null
    }
  }

  /**
   * 从优先类型中选择受支持的 MIME 类型
   */
  private pickSupportedMime(preferred: string[]) {
    for (const t of preferred) {
      try {
        if ((MediaRecorder as any).isTypeSupported?.(t))
          return t
      }
      catch { }
    }
    return ''
  }

  /** 启动录制：若已在录制，则先等待停止后再启动 */
  async start() {
    if (!this.mediaRecorder)
      await this.init()
    if (!this.mediaRecorder)
      return

    if (this.mediaRecorder.state === 'recording') {
      await this.stop()
    }

    this.chunks = []
    this.audioUrl = ''
    try {
      this.mediaRecorder.start()
    }
    catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  /** 停止录制（等待 onstop） */
  async stop() {
    if (!this.mediaRecorder)
      return
    if (this.mediaRecorder.state === 'inactive')
      return

    const once = new Promise<void>((resolve) => {
      const handler = () => {
        this.mediaRecorder?.removeEventListener('stop', handler as any)
        resolve()
      }
      this.mediaRecorder?.addEventListener('stop', handler as any, { once: true })
    })

    try { this.mediaRecorder.stop() }
    catch (error) {
      this.onError?.(error as Error)
    }

    await once
  }

  async pause() {
    if (!this.mediaRecorder)
      return
    if (this.mediaRecorder.state === 'recording') {
      try { this.mediaRecorder.pause() }
      catch (e) { this.onError?.(e as Error) }
    }
  }

  async resume() {
    if (!this.mediaRecorder)
      return
    if (this.mediaRecorder.state === 'paused') {
      try { this.mediaRecorder.resume() }
      catch (e) { this.onError?.(e as Error) }
    }
  }

  get isRecording() {
    return this.mediaRecorder?.state === 'recording' || false
  }

  get isPaused() {
    return this.mediaRecorder?.state === 'paused' || false
  }

  /** 释放媒体资源 */
  async release() {
    if (this.stream) {
      try { this.stream.getTracks().forEach(t => t.stop()) }
      catch { }
      this.stream = null
    }
    if (this.mediaRecorder) {
      try {
        /** 清理事件，避免销毁后触发 */
        this.mediaRecorder.ondataavailable = null as any
        this.mediaRecorder.onstop = null as any
      }
      catch { }
      this.mediaRecorder = null
    }
    if (this.audioUrl && this.audioUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(this.audioUrl) }
      catch { }
    }
    this.audioUrl = ''
    this.chunks = []
  }
}
