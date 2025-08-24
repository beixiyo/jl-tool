/**
 * 语音转文字，默认中文识别
 * @example
 * ```ts
 * const speakToTxt = new SpeakToTxt((data) => {
 *     console.log(data)
 * })
 * speakTxtBtn.onclick = () => speakToTxt.start()
 * ```
 */
export class SpeakToTxt {
  private recognition: SpeechRecognition
  private onResult: SpeakToTxtOnResult
  private opts: SpeakToTxtOpts

  /**
   * 调用 start 方法开始录音，默认中文识别
   * @param onResult 返回结果的回调
   * @param opts 配置项
   */
  constructor(onResult: SpeakToTxtOnResult, opts: SpeakToTxtOpts = {}) {
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

    this.opts = opts
    this.onResult = onResult
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
    }
      = this.opts

    recognition.continuous = continuous ?? false
    recognition.interimResults = interimResults ?? false
    recognition.lang = lang || 'zh-CN'

    recognition.onstart = onstart || (() => { })
    recognition.onend = onEnd || (() => { })
    recognition.onresult = (e) => {
      this.onResult(e.results[0][0].transcript, e)
    }
  }
}

export type SpeakToTxtOpts = {
  onstart?: (ev: Event) => void
  onEnd?: (ev: Event) => void
  /** 是否在用户停止说话后继续识别，默认 `false` */
  continuous?: boolean
  /** 是否返回临时结果，默认 `false` */
  interimResults?: boolean
  lang?: string
}

export type SpeakToTxtOnResult = (data: string, e: SpeechRecognitionEvent) => void
