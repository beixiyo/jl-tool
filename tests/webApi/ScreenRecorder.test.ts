import { ScreenRecorder } from '@/webApi/ScreenRecord/ScreenRecorder'
import type { RecorderBlobEvent } from '@/webApi/ScreenRecord/type'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chunkBytes } from './mediaFakes'

class MockTrack extends EventTarget {
  stop = vi.fn()
}

class MockMediaStream extends EventTarget {
  constructor(private readonly tracks: MockTrack[] = []) {
    super()
  }

  getTracks() {
    return this.tracks
  }

  getAudioTracks() {
    return this.tracks
  }

  getVideoTracks() {
    return []
  }

  removeTrack(track: MockTrack) {
    const index = this.tracks.indexOf(track)
    if (index >= 0) this.tracks.splice(index, 1)
  }
}

class MockMediaRecorder {
  static instances: MockMediaRecorder[] = []

  static isTypeSupported() {
    return true
  }

  state: RecordingState = 'inactive'
  readonly mimeType = 'audio/webm;codecs=opus'
  ondataavailable: ((event: RecorderBlobEvent) => void) | null = null
  onstart: (() => void) | null = null
  onpause: (() => void) | null = null
  onresume: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onstop: (() => void) | null = null
  startTimeslice?: number
  emitFinalOnStop = true

  constructor(readonly stream?: MediaStream, readonly options?: MediaRecorderOptions) {
    MockMediaRecorder.instances.push(this)
  }

  start(timeslice?: number) {
    this.startTimeslice = timeslice
    this.state = 'recording'
    this.onstart?.()
  }

  stop() {
    if (this.emitFinalOnStop) {
      this.emit('final')
    }
    this.state = 'inactive'
    this.onstop?.()
  }

  pause() {
    this.state = 'paused'
    this.onpause?.()
  }

  resume() {
    this.state = 'recording'
    this.onresume?.()
  }

  requestData() {}

  emit(content: string) {
    this.ondataavailable?.({ data: new Blob([content], { type: this.mimeType }) })
  }
}

describe('screenRecorder 分片保留策略', () => {
  beforeEach(() => {
    MockMediaRecorder.instances = []
    vi.stubGlobal('MediaStream', MockMediaStream)
    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getDisplayMedia: vi.fn(),
        getUserMedia: vi.fn(async () => new MockMediaStream([new MockTrack()])),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('默认保留分片并在停止时返回完整 Blob', async () => {
    const onDataAvailable = vi.fn()
    const recorder = new ScreenRecorder({
      audioOnly: true,
      micAudio: true,
      timesliceMs: 5_000,
      onDataAvailable,
    })

    await recorder.start()
    const mediaRecorder = MockMediaRecorder.instances[0]
    mediaRecorder.emit('first')
    const blob = await recorder.stop()

    expect(mediaRecorder.startTimeslice).toBe(5_000)
    expect(onDataAvailable).toHaveBeenCalledTimes(2)
    expect(blob?.size).toBe(10)
  })

  it('关闭保留后只交付分片且停止时不生成内存副本', async () => {
    const chunks: Blob[] = []
    const onStop = vi.fn()
    const recorder = new ScreenRecorder({
      audioOnly: true,
      micAudio: true,
      timesliceMs: 5_000,
      retainChunks: false,
      onDataAvailable: (event) => chunks.push(event.data),
      onStop,
    })

    await recorder.start()
    const mediaRecorder = MockMediaRecorder.instances[0]
    mediaRecorder.emit('first')
    const blob = await recorder.stop()

    expect(blob).toBeNull()
    expect(onStop).toHaveBeenCalledWith(null)
    expect(chunks.map((chunk) => chunk.size)).toEqual([5, 5])
  })

  it('完整参数透传；等待外部 Blob 处理，传入有效时长并复用最终输出', async () => {
    const processed = new Blob(['external output'], { type: 'audio/webm;codecs=opus' })
    let finish!: (blob: Blob) => void
    const finalizeBlob = vi.fn(() =>
      new Promise<Blob>((resolve) => {
        finish = resolve
      })
    )
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const getDisplayMedia = vi.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockResolvedValue(
      new MockMediaStream([new MockTrack()]) as unknown as MediaStream,
    )
    const recorder = new ScreenRecorder({
      audioOnly: true,
      systemAudio: true,
      displayMediaOptions: (defaults) => ({ ...defaults, monitorTypeSurfaces: 'exclude', video: { displaySurface: 'browser' } }),
      recorderOptions: { audioBitsPerSecond: 64000, audioBitrateMode: 'constant' },
      finalizeBlob,
    })
    await recorder.start()
    expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining({ monitorTypeSurfaces: 'exclude', video: { displaySurface: 'browser' } }))
    const native = MockMediaRecorder.instances[0]
    expect(native.options).toMatchObject({ audioBitsPerSecond: 64000, audioBitrateMode: 'constant' })
    native.ondataavailable?.({ data: new Blob([chunkBytes], { type: native.mimeType }) })
    native.emitFinalOnStop = false
    now = 1000
    recorder.pause()
    now = 5000
    recorder.resume()
    now = 6000
    const stops = Promise.all([recorder.stop(), recorder.stop()])
    await vi.waitFor(() => expect(finalizeBlob).toHaveBeenCalledTimes(1))
    expect(recorder.getResult()).toBeNull()
    expect(finalizeBlob.mock.calls[0]).toEqual([{ blob: expect.any(Blob), durationMs: 2000 }])
    finish(processed)
    const [first, second] = await stops
    expect(second).toBe(first)
    expect(first).toBe(processed)
    expect(recorder.getResult()?.durationMs).toBe(2000)
    expect(await recorder.stop()).toBe(first)
  })

  it('外部处理失败时释放采集资源，通知错误且 stop 不会永久等待；下一轮不被旧错误阻塞', async () => {
    const track = new MockTrack()
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(new MockMediaStream([track]) as unknown as MediaStream)
    const failure = new Error('external failure')
    const onError = vi.fn()
    let fail = true
    const recorder = new ScreenRecorder({
      audioOnly: true,
      micAudio: true,
      onError,
      finalizeBlob: async ({ blob }) => {
        if (fail) throw failure
        return blob
      },
    })
    await recorder.start()
    await expect(recorder.stop()).rejects.toBe(failure)
    expect(track.stop).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(failure)
    expect(recorder.state).toBe('error')

    fail = false
    await recorder.start()
    expect(recorder.state).toBe('recording')
    expect((await recorder.stop())?.size).toBeGreaterThan(0)
  })

  it('dispose 期间晚到的处理结果不再发布，等待中的 stop 结束', async () => {
    let finish!: (blob: Blob) => void
    const finalizeBlob = vi.fn(() =>
      new Promise<Blob>((resolve) => {
        finish = resolve
      })
    )
    const onStop = vi.fn()
    const recorder = new ScreenRecorder({ audioOnly: true, micAudio: true, finalizeBlob, onStop })
    await recorder.start()
    const stop = recorder.stop()
    await vi.waitFor(() => expect(finalizeBlob).toHaveBeenCalled())
    recorder.dispose()
    finish(new Blob(['late']))
    expect(await stop).toBeNull()
    expect(onStop).not.toHaveBeenCalled()
    expect(recorder.getResult()).toBeNull()
    expect(recorder.state).toBe('idle')
  })

  it('dispose 期间晚到的采集结果会释放，不重新启动或发出录制输出', async () => {
    const track = new MockTrack()
    let deliver!: (stream: MediaStream) => void
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockReturnValue(
      new Promise((resolve) => {
        deliver = resolve
      }),
    )
    const onStop = vi.fn()
    const recorder = new ScreenRecorder({ audioOnly: true, micAudio: true, onStop })
    const pending = recorder.start()
    recorder.dispose()
    deliver(new MockMediaStream([track]) as unknown as MediaStream)
    await pending
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(MockMediaRecorder.instances).toHaveLength(0)
    expect(onStop).not.toHaveBeenCalled()
    expect(recorder.state).toBe('idle')
  })

  it('没有数据分片时停止应该返回 null 并进入 stopped 状态', async () => {
    const onStateChange = vi.fn()
    const recorder = new ScreenRecorder({
      audioOnly: true,
      micAudio: true,
      onStateChange,
    })

    await recorder.start()
    MockMediaRecorder.instances[0].emitFinalOnStop = false
    const blob = await recorder.stop()

    expect(blob).toBeNull()
    expect(recorder.state).toBe('stopped')
    expect(onStateChange).toHaveBeenLastCalledWith('stopped')
  })
})
