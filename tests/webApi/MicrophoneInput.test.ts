import type { MicrophoneInputEnvironment, MicrophoneInputEvent } from '@/webApi/MicrophoneInput'
import { describe, expect, it, vi } from 'vitest'
import { MicrophoneInput } from '@/webApi/MicrophoneInput'

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live'
  constructor(readonly label: string) {
    super()
  }

  stop() {
    this.readyState = 'ended'
  }

  /** 模拟设备被拔掉：浏览器结束音轨并派发 ended */
  unplug() {
    this.readyState = 'ended'
    this.dispatchEvent(new Event('ended'))
  }
}

function createStream(label: string) {
  const track = new FakeTrack(label)
  const stream = {
    track,
    getAudioTracks: () => [track],
    getTracks: () => [track],
  }
  return stream as unknown as MediaStream & { track: FakeTrack }
}

function createEnvironment() {
  const deviceEvents = new EventTarget()
  const getUserMedia = vi.fn<(constraints?: MediaStreamConstraints) => Promise<MediaStream>>()
  let devices: MediaDeviceInfo[] = [{ kind: 'audioinput' } as MediaDeviceInfo]
  const environment: MicrophoneInputEnvironment = {
    mediaDevices: {
      getUserMedia,
      enumerateDevices: async () => devices,
      addEventListener: deviceEvents.addEventListener.bind(deviceEvents),
      removeEventListener: deviceEvents.removeEventListener.bind(deviceEvents),
    },
    permissions: {
      query: async () => ({ state: 'granted', addEventListener() {}, removeEventListener() {} }) as unknown as PermissionStatus,
    },
  }
  return {
    environment,
    getUserMedia,
    setDevices: (next: MediaDeviceInfo[]) => {
      devices = next
    },
    fireDeviceChange: () => deviceEvents.dispatchEvent(new Event('devicechange')),
  }
}

async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

/**
 * 录音中拔掉麦克风时录音不能停：必须先交出 null 让下游写静音，再接回系统默认设备；
 * 接不回时只通知一次，设备插回后自动恢复
 */
describe('microphoneInput', () => {
  it('音轨 ended 后交出 null 并接回新设备', async () => {
    const env = createEnvironment()
    const first = createStream('Built-in')
    const second = createStream('USB Mic')
    env.getUserMedia.mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    const streams: Array<MediaStream | null> = []
    const events: MicrophoneInputEvent[] = []
    const input = new MicrophoneInput({
      environment: env.environment,
      onStreamChange: s => streams.push(s),
      onEvent: e => events.push(e),
    })

    await input.acquire()
    input.startWatching()
    first.track.unplug()
    await flush()

    expect(streams).toEqual([first, null, second])
    expect(events).toEqual([{ type: 'recovered', stream: second, deviceLabel: 'USB Mic' }])
    expect(input.stream).toBe(second)
  })

  it('没有设备时只通知一次，devicechange 后自动接回', async () => {
    const env = createEnvironment()
    const first = createStream('Built-in')
    const later = createStream('Headset')
    const notFound = new DOMException('Requested device not found', 'NotFoundError')
    env.getUserMedia
      .mockResolvedValueOnce(first)
      .mockRejectedValueOnce(notFound)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(later)
    const events: MicrophoneInputEvent[] = []
    const input = new MicrophoneInput({ environment: env.environment, onEvent: e => events.push(e) })

    await input.acquire()
    input.startWatching()
    env.setDevices([])
    first.track.unplug()
    await flush()
    env.fireDeviceChange()
    await flush()
    env.setDevices([{ kind: 'audioinput' } as MediaDeviceInfo])
    env.fireDeviceChange()
    await flush()

    expect(events).toEqual([
      { type: 'unavailable', failure: 'no-device' },
      { type: 'recovered', stream: later, deviceLabel: 'Headset' },
    ])
  })

  it('接回过程中被 release：不接新流，新拿到的流被停掉', async () => {
    const env = createEnvironment()
    const first = createStream('Built-in')
    const second = createStream('USB Mic')
    let resolveSecond!: (stream: MediaStream) => void
    env.getUserMedia
      .mockResolvedValueOnce(first)
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSecond = resolve
      }))
    const events: MicrophoneInputEvent[] = []
    const input = new MicrophoneInput({ environment: env.environment, onEvent: e => events.push(e) })

    await input.acquire()
    input.startWatching()
    first.track.unplug()
    await flush()
    input.release()
    resolveSecond(second)
    await flush()

    expect(input.stream).toBeNull()
    expect(second.track.readyState).toBe('ended')
    expect(events).toEqual([])
  })
})
