import type { RecorderBlobEvent } from '@/webApi/ScreenRecord/type'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScreenRecorder } from '@/webApi/ScreenRecord/ScreenRecorder'

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
    if (index >= 0)
      this.tracks.splice(index, 1)
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

  constructor() {
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
      onDataAvailable: event => chunks.push(event.data),
      onStop,
    })

    await recorder.start()
    const mediaRecorder = MockMediaRecorder.instances[0]
    mediaRecorder.emit('first')
    const blob = await recorder.stop()

    expect(blob).toBeNull()
    expect(onStop).toHaveBeenCalledWith(null)
    expect(chunks.map(chunk => chunk.size)).toEqual([5, 5])
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
