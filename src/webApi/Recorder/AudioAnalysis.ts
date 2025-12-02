import type { AnalysisConfig } from './types'

/**
 * 音频分析模块：管理 AudioContext/AnalyserNode
 */
export class AudioAnalysis {
  analyser: AnalyserNode | null = null
  audioContext: AudioContext | null = null
  private config: AnalysisConfig
  private sourceNode: MediaStreamAudioSourceNode | null = null

  constructor(config: AnalysisConfig) {
    this.config = config
  }

  /** 附加媒体流，按配置创建 Analyser */
  attach(stream: MediaStream) {
    if (!this.config.createAnalyser)
      return

    const AudioContextCtor
      = window.AudioContext || (window as any).webkitAudioContext

    this.audioContext = new AudioContextCtor()
    const analyser = this.audioContext.createAnalyser()

    const fftSize = this.safeFftSize(this.config.fftSize ?? 2048)
    const smoothing = this.safeSmoothing(this.config.smoothingTimeConstant ?? 0.8)

    analyser.fftSize = fftSize
    analyser.smoothingTimeConstant = smoothing

    const source = this.audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    this.analyser = analyser
    this.sourceNode = source
  }

  /** 分离媒体流并关闭上下文 */
  async detach() {
    this.analyser = null
    this.sourceNode = null
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { await this.audioContext.close() }
      catch {}
    }
    this.audioContext = null
  }

  /** 获取频域数据，支持外部传入缓冲复用 */
  getByteFrequencyData(out?: Uint8Array<ArrayBuffer>) {
    if (!this.analyser)
      return null
    const data = out ?? new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    return data
  }

  /** 更新分析配置（即时生效） */
  updateConfig(partial: AnalysisConfig) {
    this.config = { ...this.config, ...partial }
    if (this.analyser) {
      if (typeof partial.fftSize === 'number') {
        this.analyser.fftSize = this.safeFftSize(partial.fftSize)
      }
      if (typeof partial.smoothingTimeConstant === 'number') {
        this.analyser.smoothingTimeConstant = this.safeSmoothing(partial.smoothingTimeConstant)
      }
    }
  }

  private safeFftSize(v: number) {
    const min = 32; const max = 32768
    let n = Math.max(min, Math.min(max, v | 0))
    /** 向最近的 2 的幂取整 */
    n = 1 << Math.round(Math.log2(n))
    return n
  }

  private safeSmoothing(v: number) {
    if (Number.isNaN(v))
      return 0.8
    return Math.max(0, Math.min(1, v))
  }
}
