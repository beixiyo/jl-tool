/**
 * 语音播放
 * @example
 * ```ts
 * const speaker = new Speaker({ txt: '你好' })
 * speaker.play()
 * ```
 */
export class Speaker {
  /** 可播放语音列表 */
  voiceArr: SpeechSynthesisVoice[] = []
  /** 内部操作的实例对象 */
  speak = new SpeechSynthesisUtterance()
  /** 语音播放器的配置选项 */
  private config: SpeakerOptions

  private initVoice = () => {
    this.voiceArr = speechSynthesis.getVoices()
    const index = this.voiceArr.findIndex(i => i.name === this.config.voiceName)
    index !== -1 && this.setVoice(index)
  }

  constructor(options?: SpeakerOptions) {
    const defaultOptions: Partial<SpeakerOptions> = {
      txt: '',
      volume: 1,
      lang: 'zh-CN',
      voiceName: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
      rate: 1,
      pitch: 1,
    }
    this.config = { ...defaultOptions, ...options } as SpeakerOptions

    this.speak.text = this.config.txt
    this.speak.volume = this.config.volume
    this.speak.lang = this.config.lang
    this.speak.rate = this.config.rate
    this.speak.pitch = this.config.pitch

    this.init()
  }

  /** 添加所有能用的声音 */
  private init() {
    speechSynthesis.addEventListener('voiceschanged', this.initVoice)
  }

  /**
   * 播放声音
   * @param onEnd 声音播放完毕的回调
   */
  play(onEnd?: (e: SpeechSynthesisEvent) => void) {
    this.stop()
    speechSynthesis.speak(this.speak)

    onEnd && (this.speak.onend = onEnd)
    return this
  }

  /** 停止 */
  stop() {
    speechSynthesis.cancel()
    return this
  }

  /** 暂停 */
  pause() {
    speechSynthesis.pause()
    return this
  }

  /** 继续 */
  resume() {
    speechSynthesis.resume()
    return this
  }

  /** 设置播放文本 */
  setText(txt = '') {
    this.speak.text = txt
    return this
  }

  /** 设置音量 */
  setVolume(volume = 1) {
    this.speak.volume = volume
    return this
  }

  /** 设置声音类型 */
  setVoice(index: number) {
    if (index < 0) {
      return
    }
    this.speak.voice = this.voiceArr[index % this.voiceArr.length]
    return this
  }

  /** 设置语速 */
  setRate(rate: number) {
    this.speak.rate = rate
    return this
  }

  /** 设置音高 */
  setPitch(pitch: number) {
    this.speak.pitch = pitch
    return this
  }
}

export type SpeakerOptions = {
  /**
   * 播放的文本内容
   * @default ''
   */
  txt: string
  /**
   * 音量，范围 0-1
   * @default 1
   */
  volume: number
  /**
   * 语言代码
   * @default 'zh-CN'
   */
  lang: string
  /**
   * 语音名称
   * @default 'Microsoft Kangkang - Chinese (Simplified, PRC)'
   */
  voiceName: string
  /**
   * 语速，范围 0.1-10
   * @default 1
   */
  rate: number
  /**
   * 音高，范围 0-2
   * @default 1
   */
  pitch: number
}
