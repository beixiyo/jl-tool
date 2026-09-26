/** 语音播放、声音列表就绪通知与可释放的原生事件桥接 */
import type { MediaOptions } from './recording'
import { resolveMediaOptions } from './recording'

/** 语音播放器；stop/pause/resume 操作浏览器共享 speechSynthesis 队列 */
export class Speaker {
  voiceArr: SpeechSynthesisVoice[] = []
  speak: SpeechSynthesisUtterance
  private readonly synthesis: SpeechSynthesis
  private readonly config: SpeakerOptions
  private destroyed = false
  private active = false
  private explicitVoice: boolean
  private playEnd?: (event: SpeechSynthesisEvent) => void
  private readonly listeners: Array<() => void> = []

  private readonly initVoice = () => {
    if (this.destroyed) return
    this.voiceArr = this.synthesis.getVoices()
    if (!this.explicitVoice) {
      const index = this.voiceArr.findIndex((voice) => voice.name === this.config.voiceName)
      if (index !== -1) this.setVoice(index)
    }
    this.config.onVoicesChanged?.([...this.voiceArr])
  }

  constructor(options: SpeakerOptions = {}) {
    this.config = {
      ...options,
      txt: options.txt ?? '',
      volume: options.volume ?? 1,
      lang: options.lang ?? 'zh-CN',
      voiceName: options.voiceName ?? 'Microsoft Kangkang - Chinese (Simplified, PRC)',
      rate: options.rate ?? 1,
      pitch: options.pitch ?? 1,
    }
    this.synthesis = options.environment?.speechSynthesis ?? speechSynthesis
    this.speak = options.environment?.createUtterance?.() ?? new SpeechSynthesisUtterance()

    const native = resolveMediaOptions<SpeakerUtteranceOptions>({
      text: this.config.txt,
      volume: this.config.volume,
      lang: this.config.lang,
      rate: this.config.rate,
      pitch: this.config.pitch,
      voice: null,
    }, options.utteranceOptions)
    Object.assign(this.speak, native)

    this.explicitVoice = native.voice != null
    const callbacks: SpeakerEvents = {
      start: (event) => {
        this.active = true
        options.onStart?.(event)
      },
      end: (event) => {
        this.active = false
        options.onEnd?.(event)
        this.playEnd?.(event)
      },
      error: (event) => {
        this.active = false
        options.onError?.(event)
      },
      pause: options.onPause,
      resume: options.onResume,
      boundary: options.onBoundary,
      mark: options.onMark,
    }

    for (const key of Object.keys(callbacks) as (keyof SpeakerEvents)[]) {
      const callback = callbacks[key]
      if (!callback) continue
      const listener = callback as EventListener
      this.speak.addEventListener(key, listener)
      this.listeners.push(() => this.speak.removeEventListener(key, listener))
    }
    this.synthesis.addEventListener('voiceschanged', this.initVoice)
    this.initVoice()
  }

  /** 播放；onEnd 保留到下次显式传入（兼容旧行为），与构造器 onEnd 均会执行 */
  play(onEnd?: (event: SpeechSynthesisEvent) => void) {
    if (this.destroyed) return this
    this.stop()
    if (onEnd) this.playEnd = onEnd
    this.active = true
    this.synthesis.speak(this.speak)
    return this
  }

  /** 清空全局合成队列（浏览器原生 cancel 语义） */
  stop() {
    this.synthesis.cancel()
    this.active = false
    return this
  }

  /** 暂停全局合成队列 */
  pause() {
    this.synthesis.pause()
    return this
  }

  /** 恢复全局合成队列 */
  resume() {
    this.synthesis.resume()
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

  /** 设置声音类型；列表未加载或索引不合法时不改变原值 */
  setVoice(index: number) {
    if (!Number.isInteger(index) || index < 0 || !this.voiceArr.length) return
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

  /** 幂等移除声音列表与播放事件监听；本实例仍在队列中时 cancel 全局队列 */
  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.synthesis.removeEventListener('voiceschanged', this.initVoice)
    this.listeners.forEach((remove) => remove())
    this.listeners.length = 0
    this.playEnd = undefined
    if (this.active) this.stop()
  }
}

/** 原生 utterance 配置，扩展字段原样赋值，不把实例交给配置回调 */
export type SpeakerUtteranceOptions = Partial<Pick<SpeechSynthesisUtterance, 'text' | 'lang' | 'voice' | 'volume' | 'rate' | 'pitch'>> & Record<string, unknown>

/** 播放器配置。未提供的事件回调不执行 */
export type SpeakerOptions = {
  /** 播放文本。@default '' */
  txt?: string
  /** 音量 0..1。@default 1 */
  volume?: number
  /** 语言代码。@default 'zh-CN' */
  lang?: string
  /** 异步列表加载后也会重新匹配。@default 'Microsoft Kangkang - Chinese (Simplified, PRC)' */
  voiceName?: string
  /** 语速 0.1..10。@default 1 */
  rate?: number
  /** 音高 0..2。@default 1 */
  pitch?: number
  /** 原生配置覆盖快捷项；显式 voice 优先于 voiceName。@default 由快捷项生成 */
  utteranceOptions?: MediaOptions<SpeakerUtteranceOptions>
  /** 初始化和 voiceschanged 时交付快照，可能为空 */
  onVoicesChanged?: (voices: SpeechSynthesisVoice[]) => void
  onStart?: (event: SpeechSynthesisEvent) => void
  onEnd?: (event: SpeechSynthesisEvent) => void
  onPause?: (event: SpeechSynthesisEvent) => void
  onResume?: (event: SpeechSynthesisEvent) => void
  onBoundary?: (event: SpeechSynthesisEvent) => void
  onMark?: (event: SpeechSynthesisEvent) => void
  onError?: (event: SpeechSynthesisErrorEvent) => void
  /** 浏览器依赖。@default 当前浏览器环境 */
  environment?: {
    speechSynthesis?: SpeechSynthesis
    createUtterance?: () => SpeechSynthesisUtterance
  }
}

type SpeakerEvents = {
  [K in keyof SpeechSynthesisUtteranceEventMap]?: (event: SpeechSynthesisUtteranceEventMap[K]) => void
}
