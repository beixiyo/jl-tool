/** PcmCapture 使用的独立 AudioWorklet 处理器 */

/* global AudioWorkletProcessor, registerProcessor */

class JlPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const config = options.processorOptions
    this.frameSamples = config.frameSamples
    this.channelCount = config.channelCount
    this.encoding = config.encoding
    this.bytesPerSample = this.encoding === 's16le'
      ? 2
      : 4
    this.levelEnabled = config.levelEnabled
    this.levelIntervalSamples = config.levelIntervalSamples
    this.levelGain = config.levelGain
    this.pending = new ArrayBuffer(this.frameSamples * this.channelCount * this.bytesPerSample)
    this.pendingView = new DataView(this.pending)
    this.pendingSamples = 0
    this.levelSumSquares = 0
    this.levelSamples = 0
    this.running = false

    this.port.onmessage = ({ data }) => {
      if (data?.type === 'start') {
        this.resetFrame()
        this.levelSumSquares = 0
        this.levelSamples = 0
        this.running = true
        this.port.postMessage({ type: 'started' })
        return
      }
      if (data?.type === 'flush') {
        this.running = false
        this.flushFrame()
        this.port.postMessage({ type: 'flushed' })
      }
    }
  }

  process(inputs) {
    if (!this.running) return true
    const channels = inputs[0]
    if (!channels?.length) return true

    const inputSamples = channels[0].length
    for (let sampleIndex = 0; sampleIndex < inputSamples; sampleIndex++) {
      let levelSample = 0
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        levelSample += channels[channelIndex][sampleIndex] ?? 0
      }
      levelSample = this.clamp(levelSample / channels.length)

      for (let outputChannel = 0; outputChannel < this.channelCount; outputChannel++) {
        const inputChannel = channels[outputChannel] ?? channels[0]
        const sample = this.channelCount === 1
          ? levelSample
          : this.clamp(inputChannel[sampleIndex] ?? 0)
        this.writeSample(this.pendingSamples, outputChannel, sample)
      }

      this.pendingSamples++
      if (this.levelEnabled) {
        this.levelSumSquares += levelSample * levelSample
        this.levelSamples++
        if (this.levelSamples >= this.levelIntervalSamples) this.flushLevel()
      }
      if (this.pendingSamples === this.frameSamples) this.flushFrame()
    }
    return true
  }

  clamp(sample) {
    return Math.max(-1, Math.min(1, sample))
  }

  writeSample(sampleIndex, channelIndex, sample) {
    const byteOffset = (sampleIndex * this.channelCount + channelIndex) * this.bytesPerSample
    if (this.encoding === 's16le') {
      const value = sample < 0
        ? Math.round(sample * 0x8000)
        : Math.round(sample * 0x7FFF)
      this.pendingView.setInt16(byteOffset, value, true)
      return
    }
    this.pendingView.setFloat32(byteOffset, sample, true)
  }

  flushFrame() {
    if (!this.pendingSamples) return
    const byteLength = this.pendingSamples * this.channelCount * this.bytesPerSample
    const buffer = byteLength === this.pending.byteLength
      ? this.pending
      : this.pending.slice(0, byteLength)
    this.port.postMessage({ type: 'frame', buffer, samplesPerChannel: this.pendingSamples }, [buffer])
    this.resetFrame()
  }

  resetFrame() {
    this.pending = new ArrayBuffer(this.frameSamples * this.channelCount * this.bytesPerSample)
    this.pendingView = new DataView(this.pending)
    this.pendingSamples = 0
  }

  flushLevel() {
    const rms = Math.sqrt(this.levelSumSquares / this.levelSamples)
    this.port.postMessage({ type: 'level', value: Math.min(1, rms * this.levelGain) })
    this.levelSumSquares = 0
    this.levelSamples = 0
  }
}

registerProcessor('@jl-org/pcm-capture', JlPcmCaptureProcessor)
