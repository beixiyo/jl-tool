import type { PcmCaptureEnvironment, PcmCaptureFrame, PcmWorkletOptions } from '@/webApi/PcmCapture'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PcmCapture } from '@/webApi/PcmCapture'

class FakeMessagePort {
  onmessage: ((event: MessageEvent) => void) | null = null
  messages: Array<{ type: string }> = []
  closed = false
  autoRespond = true

  postMessage(message: { type: string }) {
    this.messages.push(message)
    if (!this.autoRespond) return
    queueMicrotask(() => {
      this.emit({ type: message.type === 'start'
        ? 'started'
        : 'flushed' })
    })
  }

  close() {
    this.closed = true
  }

  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent)
  }
}

class FakeAudioNode {
  connectTargets: unknown[] = []
  disconnectTargets: unknown[] = []

  connect(target: unknown) {
    this.connectTargets.push(target)
    return target
  }

  disconnect(target?: unknown) {
    this.disconnectTargets.push(target)
  }
}

class FakeWorkletNode extends FakeAudioNode {
  port = new FakeMessagePort()
}

class FakeGainNode extends FakeAudioNode {
  gain = { value: 1 }
}

class FakeAudioContext {
  state: AudioContextState = 'suspended'
  destination = new FakeAudioNode()
  audioWorklet = { addModule: vi.fn(async (_url: string) => {}) }
  sourceNode = new FakeAudioNode()
  gainNode = new FakeGainNode()
  resume = vi.fn(async () => {
    this.state = 'running'
  })

  close = vi.fn(async () => {
    this.state = 'closed'
  })

  createMediaStreamSource = vi.fn((_stream: MediaStream) => this.sourceNode)
  createGain = vi.fn(() => this.gainNode)

  constructor(public sampleRate = 48000) {}
}

describe('pcmCapture', () => {
  let context: FakeAudioContext
  let worklet: FakeWorkletNode
  let track: MediaStreamTrack & { stop: ReturnType<typeof vi.fn> }
  let stream: MediaStream
  let contextOptions: AudioContextOptions | undefined
  let nodeOptions: AudioWorkletNodeOptions | undefined
  let environment: PcmCaptureEnvironment

  beforeEach(() => {
    context = new FakeAudioContext()
    worklet = new FakeWorkletNode()
    track = {
      stop: vi.fn(),
      getSettings: () => ({ sampleRate: 48000 }),
    } as unknown as MediaStreamTrack & { stop: ReturnType<typeof vi.fn> }
    stream = {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    } as unknown as MediaStream
    environment = {
      mediaDevices: { getUserMedia: vi.fn(async () => stream) },
      createAudioContext: vi.fn((options) => {
        contextOptions = options
        context.sampleRate = options?.sampleRate ?? 48000
        return context as unknown as AudioContext
      }),
      createAudioWorkletNode: vi.fn((_context, _name, options) => {
        nodeOptions = options
        return worklet as unknown as AudioWorkletNode
      }),
    }
  })

  it('默认从麦克风建立可复用的 PCM 采集生命周期', async () => {
    const states: string[] = []
    const frames: PcmCaptureFrame[] = []
    const capture = new PcmCapture({
      environment,
      onFrame: frame => frames.push(frame),
      onStateChange: state => states.push(state),
    })

    const info = await capture.prepare()
    expect(environment.mediaDevices!.getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(info.format).toMatchObject({
      sampleRate: 48000,
      channelCount: 1,
      encoding: 's16le',
      frameDurationMs: 100,
      frameSamples: 4800,
      frameBytes: 9600,
    })
    expect(context.audioWorklet.addModule).toHaveBeenCalledWith(
      expect.stringMatching(/\/worklet\/pcmCapture\.js\?no-inline$/),
    )

    await capture.start()
    const data = new ArrayBuffer(9600)
    worklet.port.emit({ type: 'frame', buffer: data, samplesPerChannel: 4800 })
    const summary = await capture.stop()

    expect(frames[0]).toMatchObject({ sequence: 0, timestampMs: 0, samplesPerChannel: 4800 })
    expect(frames[0].data).toBe(data)
    expect(summary).toMatchObject({ frames: 1, bytes: 9600, samplesPerChannel: 4800, durationMs: 100 })
    expect(worklet.port.messages).toEqual([{ type: 'start' }, { type: 'flush' }])
    expect(states).toEqual(['preparing', 'ready', 'recording', 'stopping', 'ready'])

    await capture.start()
    worklet.port.emit({ type: 'frame', buffer: new ArrayBuffer(2), samplesPerChannel: 1 })
    expect(frames.at(-1)?.sequence).toBe(0)
    await capture.destroy()
    expect(track.stop).toHaveBeenCalledOnce()
    expect(context.close).toHaveBeenCalledOnce()
  })

  it('完整归一化格式、音量计、Context 与外部 Worklet 配置', async () => {
    const levels: number[] = []
    const capture = new PcmCapture({
      source: { kind: 'media-stream', stream },
      format: {
        sampleRate: 16000,
        channelCount: 2,
        encoding: 'f32le',
        frameSamples: 800,
      },
      levelMeter: { enabled: true, intervalMs: 25, gain: 2.5 },
      audioContext: { options: { latencyHint: 'interactive' } },
      worklet: { moduleUrl: '/assets/custom-pcm-worklet.js', processorName: 'custom-pcm' },
      environment,
      onFrame: () => {},
      onLevel: value => levels.push(value),
    })

    const info = await capture.prepare()
    worklet.port.emit({ type: 'level', value: 1.5 })

    expect(contextOptions).toEqual({ latencyHint: 'interactive', sampleRate: 16000 })
    expect(context.audioWorklet.addModule).toHaveBeenCalledWith('/assets/custom-pcm-worklet.js')
    expect(info.format).toEqual({
      sampleRate: 16000,
      channelCount: 2,
      encoding: 'f32le',
      frameSamples: 800,
      frameDurationMs: 50,
      bytesPerSample: 4,
      frameBytes: 6400,
    })
    expect(nodeOptions?.processorOptions).toMatchObject({
      frameSamples: 800,
      channelCount: 2,
      encoding: 'f32le',
      levelEnabled: true,
      levelIntervalSamples: 400,
      levelGain: 2.5,
    })
    expect(levels).toEqual([1])

    await capture.destroy()
    expect(track.stop).not.toHaveBeenCalled()
  })

  it('尊重外部 MediaStream 和 AudioContext 的资源所有权', async () => {
    const capture = new PcmCapture({
      source: { kind: 'media-stream', stream, stopTracksOnDestroy: true },
      audioContext: {
        instance: context as unknown as AudioContext,
        closeOnDestroy: true,
      },
      environment,
      onFrame: () => {},
    })

    await capture.prepare()
    await capture.destroy()

    expect(track.stop).toHaveBeenCalledOnce()
    expect(context.close).toHaveBeenCalledOnce()
    expect(environment.createAudioContext).not.toHaveBeenCalled()
  })

  it('拒绝互斥帧配置和无法满足的目标采样率', async () => {
    const invalidFrameSize = new PcmCapture({
      format: { frameDurationMs: 20, frameSamples: 320 },
      environment,
      onFrame: () => {},
    })
    await expect(invalidFrameSize.prepare()).rejects.toThrow('mutually exclusive')

    const externalContext = new FakeAudioContext(48000)
    const invalidSampleRate = new PcmCapture({
      source: { kind: 'media-stream', stream },
      format: { sampleRate: 16000 },
      audioContext: { instance: externalContext as unknown as AudioContext },
      environment,
      onFrame: () => {},
    })
    await expect(invalidSampleRate.prepare()).rejects.toThrow('AudioContext uses 48000 Hz')
  })

  it('自定义 processor 名称必须和自定义模块一起提供', () => {
    expect(() => new PcmCapture({
      worklet: { processorName: 'custom-pcm' } as PcmWorkletOptions,
      environment,
      onFrame: () => {},
    })).toThrow('processorName requires worklet.moduleUrl')
  })

  it('worklet 不确认控制消息时按配置超时，不把状态留在 stopping', async () => {
    vi.useFakeTimers()
    worklet.port.autoRespond = false
    const errors: Error[] = []
    const capture = new PcmCapture({
      source: { kind: 'media-stream', stream },
      worklet: { commandTimeoutMs: 20 },
      environment,
      onFrame: () => {},
      onError: error => errors.push(error),
    })

    await capture.prepare()
    const startResult = expect(capture.start()).rejects.toThrow('start timed out')
    await vi.advanceTimersByTimeAsync(20)
    await startResult
    expect(capture.state).toBe('ready')
    expect(errors).toHaveLength(1)

    await capture.destroy()
    vi.useRealTimers()
  })
})
