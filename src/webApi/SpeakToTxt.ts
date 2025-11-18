/**
 * 语音转文字，默认中文识别
 * @example
 * ```ts
 * const speakToTxt = new SpeakToTxt({
 *   onResult: (data) => {
 *     console.log(data)
 *   }
 * })
 * speakTxtBtn.onclick = () => speakToTxt.start()
 * ```
 */
export class SpeakToTxt {
  recognition: SpeechRecognition
  /** 语音识别器的配置选项 */
  private config: SpeakToTxtOptions

  /**
   * 调用 start 方法开始录音，默认中文识别
   * @param options 配置项
   */
  constructor(options: SpeakToTxtOptions) {
    if ('webkitSpeechRecognition' in window) {
      // eslint-disable-next-line new-cap
      this.recognition = new webkitSpeechRecognition()
    }
    else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition()
    }
    else {
      throw new Error('请使用最新版 Chrome 或者 Edge 浏览器')
    }

    const defaultOptions: Partial<SpeakToTxtOptions> = {
      continuous: false,
      interimResults: false,
      lang: 'zh-CN',
      onstart: () => { },
      onEnd: () => { },
    }
    this.config = { ...defaultOptions, ...options } as SpeakToTxtOptions
    this.init()
  }

  /** 开始识别 */
  start() {
    this.recognition.start()
    return this
  }

  /** 停止识别 */
  stop() {
    this.recognition.stop()
    return this
  }

  private init() {
    const { recognition } = this
    const {
      onstart,
      onEnd,
      continuous,
      interimResults,
      lang,
      onResult,
    } = this.config

    recognition.continuous = continuous!
    recognition.interimResults = interimResults!
    recognition.lang = lang!

    recognition.onstart = onstart!
    recognition.onend = onEnd!
    recognition.onresult = (e) => {
      onResult(e.results[0][0].transcript, e)
    }
  }
}

export type SpeakToTxtOptions = {
  /** 返回结果的回调 */
  onResult: (data: string, e: SpeechRecognitionEvent) => void
  /**
   * 识别开始的回调
   * @default () => {}
   */
  onstart?: (ev: Event) => void
  /**
   * 识别结束的回调
   * @default () => {}
   */
  onEnd?: (ev: Event) => void
  /**
   * 是否在用户停止说话后继续识别
   * @default false
   */
  continuous?: boolean
  /**
   * 是否返回临时结果
   * @default false
   */
  interimResults?: boolean
  /**
   * 语言代码
   * @default 'zh-CN'
   */
  lang?: string
}
