import type { MediaOptions } from './recording'
import { resolveMediaOptions } from './recording'

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
    const SpeechRecognitionCtor = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window
      ? webkitSpeechRecognition
      : (typeof SpeechRecognition !== 'undefined'
        ? SpeechRecognition
        : undefined)
    if (!SpeechRecognitionCtor && !options.environment?.createRecognition) {
      throw new Error('Please use the latest version of Chrome or Edge browser')
    }

    this.recognition = options.environment?.createRecognition?.() ?? new SpeechRecognitionCtor!()

    const defaultOptions: Partial<SpeakToTxtOptions> = {
      continuous: false,
      interimResults: false,
      lang: 'zh-CN',
      maxAlternatives: 1,
      onstart: () => {},
      onEnd: () => {},
    }
    this.config = { ...defaultOptions, ...options } as SpeakToTxtOptions
    this.init()
  }

  /** 开始识别 */
  start() {
    if (!this.destroyed) this.recognition.start()
    return this
  }

  /** 停止识别 */
  stop() {
    this.recognition.stop()
    return this
  }

  /** 立即取消本次识别，不等待最终结果 */
  abort() {
    this.recognition.abort()
    return this
  }

  private destroyed = false

  /** 幂等清理本实例事件与识别会话 */
  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    for (const key of this.boundEvents) this.recognition[key] = null as never
    this.recognition.abort()
  }

  private readonly boundEvents = [
    'onstart',
    'onend',
    'onresult',
    'onerror',
    'onnomatch',
    'onaudiostart',
    'onaudioend',
    'onsoundstart',
    'onsoundend',
    'onspeechstart',
    'onspeechend',
  ] as const

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

    Object.assign(
      recognition,
      resolveMediaOptions<SpeechRecognitionOptions>({
        continuous: continuous ?? false,
        interimResults: interimResults ?? false,
        lang: lang ?? 'zh-CN',
        maxAlternatives: this.config.maxAlternatives ?? 1,
        ...(this.config.grammars
          ? { grammars: this.config.grammars }
          : {}),
      }, this.config.recognitionOptions),
    )

    recognition.onerror = this.config.onError ?? (() => {})
    recognition.onnomatch = this.config.onNoMatch ?? (() => {})
    recognition.onaudiostart = this.config.onAudioStart ?? (() => {})
    recognition.onaudioend = this.config.onAudioEnd ?? (() => {})
    recognition.onsoundstart = this.config.onSoundStart ?? (() => {})
    recognition.onsoundend = this.config.onSoundEnd ?? (() => {})
    recognition.onspeechstart = this.config.onSpeechStart ?? (() => {})
    recognition.onspeechend = this.config.onSpeechEnd ?? (() => {})

    recognition.onstart = onstart!
    recognition.onend = onEnd!
    recognition.onresult = (e) => {
      onResult(e.results[0][0].transcript, e)
    }
  }
}

/** 原生识别配置；扩展项直接赋值，浏览器决定是否支持 */
export type SpeechRecognitionOptions =
  & Partial<Pick<SpeechRecognition, 'continuous' | 'interimResults' | 'lang' | 'maxAlternatives' | 'grammars' | 'serviceURI'>>
  & {
    processLocally?: boolean
    phrases?: Array<{ phrase: string; boost: number }>
    [key: string]: unknown
  }

/** 识别配置；未提供的事件回调不执行 */
export type SpeakToTxtOptions = {
  /** 每个识别结果的候选数。@default 1 */
  maxAlternatives?: number
  /** 原生语法列表（现代浏览器可能忽略）。@default 浏览器默认 */
  grammars?: SpeechGrammarList
  /** 完整原生配置覆盖快捷项，函数返回完整对象。@default 由快捷项生成 */
  recognitionOptions?: MediaOptions<SpeechRecognitionOptions>
  /** 原生错误事件，保留 error/message */
  onError?: (event: SpeechRecognitionError) => void
  onNoMatch?: (event: SpeechRecognitionEvent) => void
  onAudioStart?: (event: Event) => void
  onAudioEnd?: (event: Event) => void
  onSoundStart?: (event: Event) => void
  onSoundEnd?: (event: Event) => void
  onSpeechStart?: (event: Event) => void
  onSpeechEnd?: (event: Event) => void
  /** 构造依赖。@default 当前浏览器 SpeechRecognition/webkitSpeechRecognition */
  environment?: { createRecognition?: () => SpeechRecognition }

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
