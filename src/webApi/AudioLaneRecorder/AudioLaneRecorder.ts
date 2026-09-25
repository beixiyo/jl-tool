/** 输入源可热切换的单路音频录制 */

import type { RecorderMimeType } from '../ScreenRecord/type'
import type { AudioLaneRecorderEnvironment, AudioLaneRecorderOptions, AudioLaneRecorderState, AudioLaneSource } from './types'
import { pickSupportedMimeType } from '../ScreenRecord/utils'

const DEFAULT_MIME_TYPES: RecorderMimeType[] = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

/**
 * 录制 AudioContext 里一个固定的目标节点，而不是采集流本身
 *
 * MediaRecorder 录制期间不能更换音轨：直接录 getUserMedia 的流，设备一断整段录音就停了
 * 中间垫一层目标节点后，输入源可以随时接上或拔掉：没接源时写入静音，
 * 时间轴保持连续，换设备、中途补上另一路声音都不需要重启录制
 * 多路录音共用同一个 AudioContext 即可保证时钟一致
 *
 * 实例一次性使用：`stop()` 之后不可再次 `start()`。不持有输入源的所有权，
 * `setSource` 传入的流由调用方负责停止；AudioContext 由调用方创建和关闭
 */
export class AudioLaneRecorder {
  constructor(private readonly options: AudioLaneRecorderOptions) {
    const { context, channelCount = 1 } = options
    this.destination = context.createMediaStreamDestination()
    /**
     * 目标节点按规范默认 2 声道：单声道麦克风接进来会被复制成左右两路，录出双声道文件。
     * 固定成 explicit 后，任何输入都按 speakers 规则下混 / 上混到指定声道数
     */
    this.destination.channelCount = channelCount
    this.destination.channelCountMode = 'explicit'
    this.destination.channelInterpretation = 'speakers'

    /** 目标节点在没有任何输入时部分浏览器不产出音频帧，挂一个零增益常量源保证一直有静音帧 */
    this.keepAlive = context.createConstantSource()
    this.keepAliveGain = context.createGain()
    this.keepAliveGain.gain.value = 0
    this.keepAlive.connect(this.keepAliveGain).connect(this.destination)
    this.keepAlive.start()

    const createRecorder = this.environment.createMediaRecorder
      ?? ((stream, recorderOptions) => new MediaRecorder(stream, recorderOptions))
    this.recorder = createRecorder(this.destination.stream, {
      mimeType: pickSupportedMimeType(options.mimeTypes ?? DEFAULT_MIME_TYPES),
      audioBitsPerSecond: options.audioBitsPerSecond,
    })
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.options.onDataAvailable?.(event.data)
    }
  }

  private readonly destination: MediaStreamAudioDestinationNode
  private readonly keepAlive: ConstantSourceNode
  private readonly keepAliveGain: GainNode
  private readonly recorder: MediaRecorder
  private sourceNode: AudioNode | null = null
  private ownsSourceNode = false
  private stopPromise: Promise<void> | null = null

  /** 录制中的输出流（含切换后的输入），可用于音量分析 */
  get stream(): MediaStream {
    return this.destination.stream
  }

  /** 实际使用的编码格式 */
  get mimeType(): string {
    return this.recorder.mimeType
  }

  get state(): AudioLaneRecorderState {
    if (this.stopPromise) return 'stopped'
    return this.recorder.state
  }

  /**
   * 替换输入源；传 `null` 或无音轨的流时写入静音
   *
   * 传入 AudioNode 时只做连接，不负责它的断开以外的清理
   */
  setSource(source: AudioLaneSource | null): void {
    this.sourceNode?.disconnect(this.destination)
    if (this.ownsSourceNode) this.sourceNode?.disconnect()
    this.sourceNode = null
    this.ownsSourceNode = false
    if (!source || this.stopPromise) return

    if (isMediaStream(source)) {
      if (!source.getAudioTracks().length) return

      this.sourceNode = this.options.context.createMediaStreamSource(source)
      this.ownsSourceNode = true
    }
    else {
      this.sourceNode = source
    }
    this.sourceNode.connect(this.destination)
  }

  /** 开始录制；已开始或已停止时忽略 */
  start(): void {
    if (this.stopPromise || this.recorder.state !== 'inactive') return

    this.recorder.start(this.options.timesliceMs)
  }

  pause(): void {
    if (this.recorder.state === 'recording') this.recorder.pause()
  }

  resume(): void {
    if (this.recorder.state === 'paused') this.recorder.resume()
  }

  /** 停止录制并等最后一个分片交付，随后断开输入源与内部节点；可重复调用 */
  stop(): Promise<void> {
    if (this.stopPromise) return this.stopPromise

    this.stopPromise = new Promise<void>((resolve) => {
      if (this.recorder.state === 'inactive') {
        resolve()
        return
      }

      /** stop 事件在最后一次 dataavailable 之后派发，此时分片都已交给调用方 */
      this.recorder.addEventListener('stop', () => resolve(), { once: true })
      this.recorder.stop()
    }).finally(() => {
      this.sourceNode?.disconnect(this.destination)
      if (this.ownsSourceNode) this.sourceNode?.disconnect()
      this.sourceNode = null
      this.keepAlive.stop()
      this.keepAlive.disconnect()
      this.keepAliveGain.disconnect()
    })
    return this.stopPromise
  }

  private get environment(): AudioLaneRecorderEnvironment {
    return this.options.environment ?? {}
  }
}

function isMediaStream(source: AudioLaneSource): source is MediaStream {
  return typeof (source as MediaStream).getAudioTracks === 'function'
}
