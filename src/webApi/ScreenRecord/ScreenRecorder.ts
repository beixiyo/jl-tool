import type { RecordingResult } from '../recording'
import { finalizeRecording, RecordingClock, resolveMediaOptions } from '../recording'
import type { RecorderBlobEvent, RecorderMimeType, RecorderState, ScreenRecorderOptions } from './type'
import { buildMicConstraints, createDesktopCaptureStream, mixAudioStreams, pickSupportedMimeType } from './utils'

/**
 * 屏幕录制器
 */
export class ScreenRecorder {
  /** 录制状态 */
  private _state: RecorderState = 'idle'
  /** 原始显示流（屏幕/窗口/标签页） */
  private displayStream: MediaStream | null = null
  /** 麦克风流 */
  private micStream: MediaStream | null = null
  /** 合成用于录制的最终流（包含视频、单路音频） */
  private recordStream: MediaStream | null = null
  /** 媒体录制器 */
  private mediaRecorder: MediaRecorder | null = null
  /** 分片数据缓存（仅在 retainChunks 未关闭时用于汇总最终 Blob） */
  private chunks: Blob[] = []
  /** 选择到的 mimeType */
  private selectedMimeType: RecorderMimeType | undefined
  /** 音频混音的 AudioContext（用于后续清理） */
  private audioContext: AudioContext | null = null
  /** 流结束监听器的清理函数 */
  private streamStopListeners: Array<() => void> = []
  /** 用于在 stop() 方法中等待最终 blob 的 Promise 解析器 */
  private stopResolver: ((blob: Blob | null) => void) | null = null

  private readonly clock = new RecordingClock()
  private finalBlob: Blob | null = null
  private finishing: Promise<Blob | null> | null = null
  private stopPromise: Promise<Blob | null> | null = null
  private stopReject: ((error: unknown) => void) | null = null
  private generation = 0
  private startPromise: Promise<void> | null = null
  private result: RecordingResult | null = null

  constructor(private readonly config: ScreenRecorderOptions = {}) {
    this.config = { ...config }
  }

  /** 最终输出（含有效录制时长）；stop 完成后可读 */
  getResult(): RecordingResult | null {
    return this.result
  }

  updateConfig(config: Partial<ScreenRecorderOptions>) {
    Object.assign(this.config, config)
  }

  /** 当前状态 */
  get state(): RecorderState {
    return this._state
  }

  /** 是否可用 */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined'
      && !!navigator.mediaDevices
      && typeof navigator.mediaDevices.getDisplayMedia === 'function'
      && typeof MediaRecorder !== 'undefined'
  }

  /** 获取实际使用的 mimeType（在 start 之后可用） */
  get mimeType(): string | undefined {
    return this.mediaRecorder?.mimeType || this.selectedMimeType
  }

  /** 更新状态并触发回调 */
  private setState(next: RecorderState) {
    this._state = next
    this.config.onStateChange?.(next)
  }

  /**
   * 提取并混音音频流
   * - 从 displayStream 和 micStream 中提取音频轨道并混音
   */
  private async prepareAudioStream(): Promise<MediaStream | undefined> {
    const systemAudioStream = this.displayStream?.getAudioTracks().length
      ? new MediaStream(this.displayStream.getAudioTracks())
      : undefined
    const microphoneStream = this.micStream?.getAudioTracks().length
      ? new MediaStream(this.micStream.getAudioTracks())
      : undefined

    const { stream, audioContext } = await mixAudioStreams(systemAudioStream, microphoneStream)
    /** 保存 AudioContext 以便后续清理 */
    if (audioContext) {
      this.audioContext = audioContext
    }
    return stream
  }

  /**
   * 安全地移除视频轨道（兼容不支持 removeTrack 的浏览器）
   */
  private removeVideoTracks(stream: MediaStream): void {
    const videoTracks = stream.getVideoTracks()
    videoTracks.forEach((track) => {
      try {
        track.stop()
        /** 某些浏览器可能不支持 removeTrack，需要兼容处理 */
        if (typeof stream.removeTrack === 'function') {
          stream.removeTrack(track)
        }
      }
      catch {
        /** 忽略错误，继续处理其他轨道 */
      }
    })
  }

  /**
   * 添加流结束监听器
   */
  private addStreamStopListener(stream: MediaStream, callback: () => void): void {
    const cleanup = () => {
      stream.removeEventListener('ended', callback)
      stream.removeEventListener('inactive', callback)
      stream.getTracks().forEach((track) => {
        track.removeEventListener('ended', callback)
        track.removeEventListener('inactive', callback)
      })
    }

    stream.addEventListener('ended', callback)
    stream.addEventListener('inactive', callback)
    stream.getTracks().forEach((track) => {
      track.addEventListener('ended', callback)
      track.addEventListener('inactive', callback)
    })

    this.streamStopListeners.push(cleanup)
  }

  /**
   * 开始录制
   * - 弹出浏览器的屏幕选择器
   */
  async start(): Promise<void> {
    if (this.startPromise) return this.startPromise
    this.startPromise = this.startRecording()

    try {
      await this.startPromise
    }
    finally {
      this.startPromise = null
    }
  }

  private async startRecording(): Promise<void> {
    if (!ScreenRecorder.isSupported()) {
      const err = new Error('Screen recording is not supported in this environment')
      this.setState('error')
      this.config.onError?.(err)
      throw err
    }
    if (this.mediaRecorder || this.finishing) {
      /** 上一轮的失败已由其 stop 拒绝和 onError 交付，不能阻塞新一轮 */
      await this.stop().catch(() => {})
    }
    else {
      /**
       * 如果上一次录制流程在创建 MediaRecorder 之前异常中断，
       * 此时可能还持有旧的 MediaStream，需要先主动停止以避免
       * 浏览器抛出「Could not start video source」之类的错误
       */
      this.cleanupTracks()
    }

    const generation = ++this.generation
    this.finalBlob = null
    this.result = null
    this.finishing = null
    this.stopPromise = null
    try {
      const { audioOnly = false, systemAudio, micAudio } = this.config
      const desktopSource = this.config.desktopSource
      const wantSystemAudio = !!systemAudio

      if (audioOnly) {
        /**
         * 仅音频模式
         * 1. 获取系统音频（部分浏览器要求通过 getDisplayMedia 才能拿到系统音）
         */
        if (systemAudio) {
          if (desktopSource) {
            this.displayStream = await createDesktopCaptureStream({
              source: desktopSource,
              withAudio: true,
              withVideo: true,
            })
          }
          else {
            this.displayStream = await navigator.mediaDevices.getDisplayMedia(resolveMediaOptions({
              video: true,
              audio: systemAudio,
            }, this.config.displayMediaOptions))
          }
          if (this.cancelled(generation)) return
          /** 添加流结束监听 */
          if (this.displayStream) {
            this.addStreamStopListener(this.displayStream, () => {
              if (this._state === 'recording' || this._state === 'paused') {
                this.stop().catch(() => {})
              }
            })
            /** 立刻停止并移除视频轨道，避免录制中包含视频 */
            this.removeVideoTracks(this.displayStream)
          }
          /** 立刻停止并移除视频轨道，避免录制中包含视频 */
        }
        // 2. 获取麦克风（可选）
        if (micAudio) {
          const micConstraints = buildMicConstraints(micAudio)
          this.micStream = await navigator.mediaDevices.getUserMedia(micConstraints)
          if (this.cancelled(generation)) return
          /** 添加流结束监听 */
          if (this.micStream) {
            this.addStreamStopListener(this.micStream, () => {
              if (this._state === 'recording' || this._state === 'paused') {
                this.stop().catch(() => {})
              }
            })
          }
        }

        // 3. 混音音频流
        const mixedAudio = await this.prepareAudioStream()
        if (this.cancelled(generation)) return
        const audioTrack = mixedAudio?.getAudioTracks()[0]
        if (!audioTrack) {
          throw new Error('Failed to get audio track. Please ensure that at least system audio or microphone audio is enabled')
        }
        this.recordStream = new MediaStream([audioTrack])
      }
      else {
        /**
         * 音视频模式
         * 1. 获取显示媒体（可能包含系统音频）
         */
        if (desktopSource) {
          this.displayStream = await createDesktopCaptureStream({
            source: desktopSource,
            withAudio: wantSystemAudio,
            withVideo: true,
          })
        }
        else {
          const displayConstraints = resolveMediaOptions({
            video: this.config.video ?? true,
            audio: this.config.systemAudio,
          }, this.config.displayMediaOptions)
          this.displayStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints)
        }

        if (this.cancelled(generation)) return
        /** 添加流结束监听 */
        if (this.displayStream) {
          this.addStreamStopListener(this.displayStream, () => {
            if (this._state === 'recording' || this._state === 'paused') {
              this.stop().catch(() => {})
            }
          })
        }

        // 2. 根据需要获取麦克风
        if (micAudio) {
          const micConstraints = buildMicConstraints(micAudio)
          this.micStream = await navigator.mediaDevices.getUserMedia(micConstraints)
          if (this.cancelled(generation)) return
          /** 添加流结束监听 */
          if (this.micStream) {
            this.addStreamStopListener(this.micStream, () => {
              if (this._state === 'recording' || this._state === 'paused') {
                this.stop().catch(() => {})
              }
            })
          }
        }

        // 3. 组装最终录制流：视频 track 来自 display；音频 track 来自混音结果
        const videoTrack = this.displayStream.getVideoTracks()[0]
        if (!videoTrack) {
          throw new Error('Failed to get video track')
        }

        const mixedAudio = await this.prepareAudioStream()
        if (this.cancelled(generation)) return
        const tracks: MediaStreamTrack[] = [videoTrack]
        if (mixedAudio) {
          const audioTrack = mixedAudio.getAudioTracks()[0]
          if (audioTrack) {
            tracks.push(audioTrack)
          }
        }
        this.recordStream = new MediaStream(tracks)
      }

      // 4. 选择合适的 mimeType
      const prefer = this.config.preferMimeTypes
        ?? (this.config.audioOnly
          ? ['audio/webm;codecs=opus', 'audio/webm']
          : undefined)
      this.selectedMimeType = pickSupportedMimeType(prefer)
      const init: MediaRecorderOptions = {
        mimeType: this.selectedMimeType,
        bitsPerSecond: this.config.bitsPerSecond,
      }
      this.mediaRecorder = new MediaRecorder(this.recordStream, resolveMediaOptions(init, this.config.recorderOptions))
      this.selectedMimeType = this.mediaRecorder.mimeType || this.selectedMimeType

      // 5. 绑定事件
      this.chunks = []
      this.mediaRecorder.ondataavailable = (evt: RecorderBlobEvent) => {
        if (evt.data && evt.data.size > 0) {
          if (this.config.retainChunks !== false) {
            this.chunks.push(evt.data)
          }
          this.config.onDataAvailable?.(evt)
        }
      }
      this.mediaRecorder.onstart = () => {
        this.setState('recording')
        this.config.onStart?.()
      }
      this.mediaRecorder.onpause = () => {
        this.setState('paused')
        this.config.onPause?.()
      }
      this.mediaRecorder.onresume = () => {
        this.setState('recording')
        this.config.onResume?.()
      }

      this.mediaRecorder.onerror = (e) => {
        this.setState('error')
        this.config.onError?.(e)
      }
      this.mediaRecorder.onstop = () => {
        /**
         * 某些浏览器会在最后一次 dataavailable 之后立即触发 stop，
         * 通过微任务或下一帧确保最后分片已推入 chunks
         */
        this.clock.pause()
        const finalize = () => {
          if (generation !== this.generation) return
          this.finishing ??= this.finalize(generation)
          void this.finishing.catch((error) => {
            if (generation !== this.generation) return
            this.stopReject?.(error)
            this.stopResolver = null
            this.setState('error')
            this.config.onError?.(error)
          })
        }
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(finalize)
        }
        else {
          setTimeout(finalize, 0)
        }
      }

      // 6. 开始录制；提前建立完成信号，覆盖原生先变 inactive、稍后交付分片的窗口
      this.stopPromise = new Promise<Blob | null>((resolve, reject) => {
        this.stopResolver = resolve
        this.stopReject = reject
      })
      void this.stopPromise.catch(() => {})
      this.clock.start()
      const timeslice = this.config.timesliceMs
      if (timeslice != null && timeslice > 0) {
        this.mediaRecorder.start(timeslice)
      }
      else {
        this.mediaRecorder.start()
      }
    }
    catch (e) {
      if (this.cancelled(generation)) return
      this.stopReject?.(e)
      this.setState('error')
      this.cleanupTracks()
      this.config.onError?.(e)
      throw e
    }
  }

  /** 取消的异步采集只释放迟到资源，不再发出状态与输出事件 */
  private cancelled(generation: number): boolean {
    if (generation === this.generation) return false
    this.cleanupTracks()
    return true
  }

  /** 暂停录制 */
  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      this.clock.pause()
    }
  }

  /** 恢复录制 */
  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      this.clock.resume()
    }
  }

  /**
   * 停止录制
   * - 默认返回由全部分片组成的最终 Blob
   * - `retainChunks` 为 `false` 时等待最终分片交付后返回 `null`
   */
  async stop(): Promise<Blob | null> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
        this.clock.pause()
      }
      catch (error) {
        this.stopReject?.(error)
        this.cleanupTracks()
        throw error
      }
    }
    return this.stopPromise ?? this.finishing ?? this.finalBlob
  }

  /** 手动请求分片数据（部分浏览器允许在录制中调用） */
  requestData() {
    this.mediaRecorder?.requestData()
  }

  /** 销毁与释放所有资源 */
  dispose() {
    this.generation++
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop =
        this.mediaRecorder.ondataavailable =
        this.mediaRecorder.onstart =
        this.mediaRecorder.onpause =
        this.mediaRecorder.onresume =
        this.mediaRecorder.onerror =
          null
    }

    this.stopResolver?.(null)
    this.stopResolver = null
    this.finalBlob = null
    this.result = null
    this.finishing = null
    this.stopPromise = null

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
    }
    catch {
      // ignore
    }
    this.cleanupTracks()
    this.chunks = []
    this.setState('idle')
  }

  /** 导出当前流（可选：用于预览） */
  getMediaStream(): MediaStream | null {
    return this.recordStream
  }

  /** 停止后统一封装输出，天然停止也释放采集资源 */
  private async finalize(generation: number): Promise<Blob | null> {
    this.clock.pause()

    const durationMs = this.clock.durationMs
    const raw = this.buildFinalBlob()
    const mimeType = this.mimeType ?? raw?.type ?? ''
    const finalizeBlob = this.config.finalizeBlob
    /** 外部处理可能缓慢或失败，不能继续持有摄像/麦克风资源 */
    this.cleanupTracks()
    this.chunks = []
    const blob = raw
      ? await finalizeRecording({ blob: raw, durationMs, finalizeBlob })
      : null

    if (generation !== this.generation) return null

    this.finalBlob = blob
    this.result = { blob, durationMs, mimeType }
    this.chunks = []

    const resolve = this.stopResolver
    this.stopResolver = null
    resolve?.(blob)

    this.setState('stopped')
    this.config.onStop?.(blob)
    this.config.onResult?.(this.result)
    return blob
  }

  /** 生成最终 Blob */
  private buildFinalBlob(): Blob | null {
    if (this.chunks.length === 0) return null
    const hasVideo = !!this.recordStream?.getVideoTracks().length
    const fallback = hasVideo
      ? 'video/webm'
      : 'audio/webm'
    return new Blob(this.chunks, { type: this.mimeType || fallback })
  }

  /** 清理所有轨道与流 */
  private cleanupTracks() {
    /** 清理流结束监听器 */
    this.streamStopListeners.forEach((cleanup) => {
      try {
        cleanup()
      }
      catch {
        // ignore
      }
    })
    this.streamStopListeners = []

    /** 停止所有轨道 */
    const stopStream = (stream: MediaStream | null) => {
      if (!stream) return
      stream.getTracks().forEach((t) => {
        try {
          t.stop()
        }
        catch {
          // ignore
        }
      })
    }
    stopStream(this.recordStream)
    stopStream(this.displayStream)
    stopStream(this.micStream)

    /** 关闭 AudioContext（如果存在） */
    if (this.audioContext) {
      try {
        /** 检查 AudioContext 的状态，只有在 running 或 suspended 时才关闭 */
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(() => {
            /** 忽略关闭错误 */
          })
        }
      }
      catch {
        // ignore
      }
      this.audioContext = null
    }

    /** 清理引用 */
    this.recordStream = null
    this.displayStream = null
    this.micStream = null
    this.mediaRecorder = null
  }
}
