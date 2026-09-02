/** 浏览器音频源到实时 PCM 帧的通用采集边界 */

import type {
  PcmCaptureEnvironment,
  PcmCaptureFormat,
  PcmCaptureFrame,
  PcmCaptureInfo,
  PcmCaptureOptions,
  PcmCaptureSource,
  PcmCaptureState,
  PcmCaptureSummary,
} from './types'
import { PCM_CAPTURE_AUDIO_WORKLET_URL } from '@/browserAssetUrls'

const DEFAULT_FRAME_DURATION_MS = 100
const DEFAULT_LEVEL_INTERVAL_MS = 50
const DEFAULT_COMMAND_TIMEOUT_MS = 1000
const DEFAULT_PCM_PROCESSOR_NAME = '@jl-org/pcm-capture'

/**
 * 从麦克风、MediaStream 或 AudioNode 持续采集原始 PCM
 *
 * prepare/start/stop/destroy 均可重复调用；同一实例可执行多轮 start/stop，destroy 后不可复用
 */
export class PcmCapture {
  constructor(private readonly options: PcmCaptureOptions) {
    if (typeof options.onFrame !== 'function') throw new TypeError('PcmCapture requires onFrame')
    if (options.worklet?.processorName !== undefined && options.worklet.moduleUrl === undefined) {
      throw new TypeError('PcmCapture worklet.processorName requires worklet.moduleUrl')
    }
  }

  private stateValue: PcmCaptureState = 'idle'
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private sourceNode: AudioNode | null = null
  private workletNode: AudioWorkletNode | null = null
  private silentGain: GainNode | null = null
  private formatValue: Readonly<PcmCaptureFormat> | null = null
  private ownsContext = false
  private stopTracksOnDestroy = false
  private pendingCommand: PendingCommand | null = null
  private sequence = 0
  private frames = 0
  private bytes = 0
  private samplesPerChannel = 0

  /** 申请输入源并创建音频图，但不开始消费音频。 */
  async prepare(): Promise<PcmCaptureInfo> {
    this.assertAlive()
    if (this.stateValue === 'ready' || this.stateValue === 'recording' || this.stateValue === 'stopping') {
      return this.captureInfo
    }
    if (this.stateValue === 'preparing') throw new Error('PcmCapture is already preparing')

    this.setState('preparing')
    try {
      const source = this.options.source ?? { kind: 'microphone', constraints: true }
      await this.prepareSource(source)
      this.assertAlive()

      const context = this.resolveAudioContext(source)
      this.context = context
      this.assertRequestedSampleRate(context)
      this.formatValue = Object.freeze(normalizeFormat(this.options, context.sampleRate))

      const processorName = this.options.worklet?.processorName ?? DEFAULT_PCM_PROCESSOR_NAME
      const moduleUrl = this.options.worklet?.moduleUrl ?? PCM_CAPTURE_AUDIO_WORKLET_URL
      await context.audioWorklet.addModule(String(moduleUrl))
      this.assertAlive()

      const createNode = this.environment.createAudioWorkletNode
        ?? ((audioContext, name, nodeOptions) => new AudioWorkletNode(audioContext, name, nodeOptions))
      const levelMeter = normalizeLevelMeter(this.options)
      const workletNode = createNode(context, processorName, {
        channelCount: this.formatValue.channelCount,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: {
          frameSamples: this.formatValue.frameSamples,
          channelCount: this.formatValue.channelCount,
          encoding: this.formatValue.encoding,
          levelEnabled: levelMeter.enabled,
          levelIntervalSamples: Math.max(1, Math.round(context.sampleRate * levelMeter.intervalMs / 1000)),
          levelGain: levelMeter.gain,
        },
      })
      const silentGain = context.createGain()
      silentGain.gain.value = 0
      workletNode.connect(silentGain).connect(context.destination)
      workletNode.port.onmessage = event => this.handleWorkletMessage(event as MessageEvent<PcmWorkletMessage>)

      this.workletNode = workletNode
      this.silentGain = silentGain
      this.sourceNode = this.resolveSourceNode(source, context)
      this.setState('ready')
      return this.captureInfo
    }
    catch (error) {
      const normalized = toError(error)
      await this.cleanupResources()
      if (this.stateValue !== 'destroyed') this.setState('idle')
      this.reportError(normalized)
      throw normalized
    }
  }

  /** 开始一轮采集；重复调用不会创建第二轮。 */
  async start(): Promise<void> {
    this.assertAlive()
    if (this.stateValue === 'recording') return
    if (this.stateValue === 'idle') await this.prepare()
    if (this.stateValue !== 'ready') throw new Error(`Cannot start PcmCapture while ${this.stateValue}`)

    this.resetSummary()
    try {
      await this.context!.resume()
      await this.sendCommand('start')
      this.assertAlive()
      this.sourceNode!.connect(this.workletNode!)
      this.setState('recording')
    }
    catch (error) {
      const normalized = toError(error)
      if (!this.destroyed) this.setState('ready')
      this.reportError(normalized)
      throw normalized
    }
  }

  /** 停止当前轮并等待 Worklet 交出最后一帧。 */
  async stop(): Promise<PcmCaptureSummary | null> {
    if (this.stateValue === 'destroyed' || this.stateValue === 'idle') return null
    if (this.stateValue === 'ready') return this.summary
    if (this.stateValue !== 'recording') throw new Error(`Cannot stop PcmCapture while ${this.stateValue}`)

    this.setState('stopping')
    this.sourceNode?.disconnect(this.workletNode!)
    try {
      await this.sendCommand('flush')
      this.setState('ready')
      return this.summary
    }
    catch (error) {
      const normalized = toError(error)
      if (!this.destroyed) this.setState('ready')
      this.reportError(normalized)
      throw normalized
    }
  }

  /** 释放输入源和 Web Audio 资源；可重复调用。 */
  async destroy(): Promise<void> {
    if (this.stateValue === 'destroyed') return

    let stopError: Error | null = null
    if (this.stateValue === 'recording') {
      try {
        await this.stop()
      }
      catch (error) {
        stopError = toError(error)
      }
    }

    this.setState('destroyed')
    this.rejectPendingCommand(new Error('PcmCapture was destroyed'))
    await this.cleanupResources()
    if (stopError) throw stopError
  }

  get state(): PcmCaptureState {
    return this.stateValue
  }

  get isRecording(): boolean {
    return this.stateValue === 'recording'
  }

  get format(): Readonly<PcmCaptureFormat> | null {
    return this.formatValue
  }

  get captureInfo(): PcmCaptureInfo {
    if (!this.formatValue) throw new Error('PcmCapture has not been prepared')
    return {
      format: this.formatValue,
      trackSettings: this.stream?.getAudioTracks()[0]?.getSettings() ?? null,
    }
  }

  get summary(): PcmCaptureSummary {
    if (!this.formatValue) throw new Error('PcmCapture has not been prepared')
    return {
      frames: this.frames,
      bytes: this.bytes,
      samplesPerChannel: this.samplesPerChannel,
      durationMs: this.samplesPerChannel / this.formatValue.sampleRate * 1000,
      format: this.formatValue,
    }
  }

  private get environment(): PcmCaptureEnvironment {
    return this.options.environment ?? {}
  }

  private get destroyed(): boolean {
    return this.stateValue === 'destroyed'
  }

  private async prepareSource(source: PcmCaptureSource): Promise<void> {
    if (source.kind === 'audio-node') return
    if (source.kind === 'media-stream') {
      this.stream = source.stream
      this.stopTracksOnDestroy = source.stopTracksOnDestroy ?? false
      return
    }

    const mediaDevices = this.environment.mediaDevices ?? globalThis.navigator?.mediaDevices
    if (!mediaDevices) throw new Error('Current environment does not support getUserMedia')
    const stream = await mediaDevices.getUserMedia({ audio: source.constraints ?? true })
    this.stream = stream
    this.stopTracksOnDestroy = true
    if (this.stateValue === 'destroyed') stream.getTracks().forEach(track => track.stop())
  }

  private resolveAudioContext(source: PcmCaptureSource): AudioContext {
    const configured = this.options.audioContext?.instance
    if (source.kind === 'audio-node') {
      const nodeContext = source.node.context
      if (configured && configured !== nodeContext) {
        throw new Error('PcmCapture audio-node and configured AudioContext must match')
      }
      if (!isRealtimeAudioContext(nodeContext)) {
        throw new TypeError('PcmCapture audio-node requires a realtime AudioContext')
      }
      this.ownsContext = this.options.audioContext?.closeOnDestroy ?? false
      return nodeContext
    }
    if (configured) {
      this.ownsContext = this.options.audioContext?.closeOnDestroy ?? false
      return configured
    }

    const createContext = this.environment.createAudioContext
      ?? (contextOptions => new AudioContext(contextOptions))
    this.ownsContext = this.options.audioContext?.closeOnDestroy ?? true
    return createContext({
      ...this.options.audioContext?.options,
      sampleRate: this.options.format?.sampleRate,
    })
  }

  private assertRequestedSampleRate(context: AudioContext): void {
    const requested = this.options.format?.sampleRate
    if (requested !== undefined && context.sampleRate !== requested) {
      throw new Error(`Requested ${requested} Hz PCM, but AudioContext uses ${context.sampleRate} Hz`)
    }
  }

  private resolveSourceNode(source: PcmCaptureSource, context: AudioContext): AudioNode {
    if (source.kind === 'audio-node') return source.node
    return context.createMediaStreamSource(this.stream!)
  }

  private sendCommand(type: PcmWorkletCommand): Promise<void> {
    if (this.pendingCommand) throw new Error(`PcmCapture is waiting for ${this.pendingCommand.type}`)
    const port = this.workletNode?.port
    if (!port) throw new Error('PcmCapture Worklet is not ready')

    return new Promise((resolve, reject) => {
      const setTimer = this.environment.setTimeout ?? globalThis.setTimeout
      const timeoutMs = this.options.worklet?.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS
      const timer = setTimer(() => {
        this.pendingCommand = null
        reject(new Error(`PcmCapture ${type} timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      this.pendingCommand = { type, resolve, reject, timer }
      port.postMessage({ type })
    })
  }

  private handleWorkletMessage(event: MessageEvent<PcmWorkletMessage>): void {
    const message = event.data
    if (message.type === 'started') {
      this.resolvePendingCommand('start')
      return
    }
    if (message.type === 'flushed') {
      this.resolvePendingCommand('flush')
      return
    }
    if (message.type === 'level') {
      this.options.onLevel?.(Math.max(0, Math.min(1, message.value)))
      return
    }

    const format = this.formatValue
    if (!format || this.stateValue === 'destroyed') return
    const timestampMs = this.samplesPerChannel / format.sampleRate * 1000
    const frame: PcmCaptureFrame = {
      data: message.buffer,
      sequence: this.sequence++,
      timestampMs,
      samplesPerChannel: message.samplesPerChannel,
      format,
    }
    this.frames++
    this.bytes += message.buffer.byteLength
    this.samplesPerChannel += message.samplesPerChannel
    try {
      this.options.onFrame(frame)
    }
    catch (error) {
      this.reportError(toError(error))
    }
  }

  private resolvePendingCommand(type: PcmWorkletCommand): void {
    const pending = this.pendingCommand
    if (!pending || pending.type !== type) return
    this.clearCommandTimer(pending.timer)
    this.pendingCommand = null
    pending.resolve()
  }

  private rejectPendingCommand(error: Error): void {
    const pending = this.pendingCommand
    if (!pending) return
    this.clearCommandTimer(pending.timer)
    this.pendingCommand = null
    pending.reject(error)
  }

  private clearCommandTimer(timer: ReturnType<typeof globalThis.setTimeout>): void {
    const clearTimer = this.environment.clearTimeout ?? globalThis.clearTimeout
    clearTimer(timer)
  }

  private resetSummary(): void {
    this.sequence = 0
    this.frames = 0
    this.bytes = 0
    this.samplesPerChannel = 0
  }

  private async cleanupResources(): Promise<void> {
    this.rejectPendingCommand(new Error('PcmCapture resources were released'))
    this.sourceNode?.disconnect()
    this.workletNode?.disconnect()
    this.silentGain?.disconnect()
    this.workletNode?.port.close()
    if (this.stopTracksOnDestroy) this.stream?.getTracks().forEach(track => track.stop())

    const context = this.context
    const shouldCloseContext = this.ownsContext
    this.context = null
    this.stream = null
    this.sourceNode = null
    this.workletNode = null
    this.silentGain = null
    this.formatValue = null
    this.ownsContext = false
    this.stopTracksOnDestroy = false
    if (context && shouldCloseContext && context.state !== 'closed') await context.close()
  }

  private assertAlive(): void {
    if (this.stateValue === 'destroyed') throw new Error('PcmCapture has been destroyed')
  }

  private setState(state: PcmCaptureState): void {
    if (this.stateValue === state) return
    this.stateValue = state
    this.options.onStateChange?.(state)
  }

  private reportError(error: Error): void {
    this.options.onError?.(error)
  }
}

function normalizeFormat(options: PcmCaptureOptions, actualSampleRate: number): PcmCaptureFormat {
  const format = options.format ?? {}
  if (format.frameDurationMs !== undefined && format.frameSamples !== undefined) {
    throw new TypeError('frameDurationMs and frameSamples are mutually exclusive')
  }

  const sampleRate = assertPositiveNumber(format.sampleRate ?? actualSampleRate, 'sampleRate')
  const channelCount = format.channelCount ?? 1
  const encoding = format.encoding ?? 's16le'
  const frameSamples = format.frameSamples === undefined
    ? Math.round(sampleRate * assertPositiveNumber(format.frameDurationMs ?? DEFAULT_FRAME_DURATION_MS, 'frameDurationMs') / 1000)
    : assertPositiveInteger(format.frameSamples, 'frameSamples')
  if (frameSamples < 1) throw new RangeError('frame size must contain at least one sample')

  const bytesPerSample = encoding === 's16le'
    ? 2
    : 4
  return {
    sampleRate,
    channelCount,
    encoding,
    frameSamples,
    frameDurationMs: frameSamples / sampleRate * 1000,
    bytesPerSample,
    frameBytes: frameSamples * channelCount * bytesPerSample,
  }
}

function normalizeLevelMeter(options: PcmCaptureOptions) {
  const levelMeter = options.levelMeter ?? {}
  return {
    enabled: levelMeter.enabled ?? true,
    intervalMs: assertPositiveNumber(levelMeter.intervalMs ?? DEFAULT_LEVEL_INTERVAL_MS, 'levelMeter.intervalMs'),
    gain: assertNonNegativeNumber(levelMeter.gain ?? 1, 'levelMeter.gain'),
  }
}

function assertPositiveNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive number`)
  return value
}

function assertPositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`)
  return value
}

function assertNonNegativeNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a non-negative number`)
  return value
}

function isRealtimeAudioContext(context: BaseAudioContext): context is AudioContext {
  return 'resume' in context && 'close' in context && 'audioWorklet' in context
}

function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error(String(error))
}

type PcmWorkletCommand = 'start' | 'flush'

type PendingCommand = {
  type: PcmWorkletCommand
  resolve: () => void
  reject: (error: Error) => void
  timer: ReturnType<typeof globalThis.setTimeout>
}

type PcmWorkletMessage =
  | { type: 'started' }
  | { type: 'flushed' }
  | { type: 'level', value: number }
  | { type: 'frame', buffer: ArrayBuffer, samplesPerChannel: number }
