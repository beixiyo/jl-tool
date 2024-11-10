/**
 * 录音
 * @example
 * ```ts
 * const recorder = new Recorder()
 * await recorder.init()
 * recorder.start()
 * ```
 */
export class Recorder {
  /** 录制的音频的临时 `URL` 。录制完毕自动赋值，每次录制前都会清空 */
  audioUrl = ''
  /** 录制的音频 `Blob`。录制完毕自动赋值 每次录制前都会清空 */
  chunks: Blob[] = []
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  /** 录音完成回调 */
  private onFinish: undefined | ((audioUrl: string, chunk: Blob[]) => void)

  /**
   * @param onFinish 录音完成的回调
   */
  constructor(onFinish?: (audioUrl: string, chunk: Blob[]) => void) {
    this.onFinish = onFinish
  }

  async init(): Promise<string | undefined> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        if (this.chunks.length === 0) return
        /** audio/wav | audio/mpeg | audio/ogg | audio/aac | audio/mp3 */
        const audioBlob = new Blob(this.chunks, { type: 'audio/mp3' })
        this.audioUrl = URL.createObjectURL(audioBlob)

        this.onFinish && this.onFinish(this.audioUrl, this.chunks)
      }
    }
    catch (error) {
      console.error('获取麦克风权限失败(Error accessing microphone):', error)
      return '获取麦克风权限失败，请手动开启权限'
    }
  }

  /** 开始录音 */
  start() {
    if (!this.mediaRecorder) {
      console.warn('请先调用`init`方法 等待初始化完成')
      return this
    }

    this.chunks = []
    this.stop()
    this.mediaRecorder.start()
    return this
  }

  /** 停止录音，停止后，回调给构造器传递的 `onFinish` */
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
    return this
  }

  /** 播放刚刚的录音，或者指定 base64 的录音 */
  play(url?: string) {
    if (!url && !this.audioUrl) {
      console.warn('录音尚未完成，请使用`onFinish`回调')
      return this
    }

    const audio = new Audio(url ?? this.audioUrl)
    audio.play()
    return this
  }
}
