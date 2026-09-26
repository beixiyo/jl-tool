import type { MicrophoneInputEnvironment, MicrophoneInputEvent } from '@/webApi/MicrophoneInput'
import { describe, expect, it, vi } from 'vitest'
import { getEchoCancellationValues, isEchoCancellationModeSupported, MicrophoneInput } from '@/webApi/MicrophoneInput'

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live'
  muted = false
  constructor(readonly label: string) {
    super()
  }

  stop() {
    this.readyState = 'ended'
  }

  /** 模拟 Safari 中麦克风被其他标签页占用：音轨被静音但不结束 */
  setMuted(muted: boolean) {
    this.muted = muted
    this.dispatchEvent(new Event(muted
      ? 'mute'
      : 'unmute'))
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

  it('并发 acquire 合并为一次请求，先返回的调用方拿到的音轨不会被停掉', async () => {
    const env = createEnvironment()
    const first = createStream('Built-in')
    env.getUserMedia.mockResolvedValue(first)
    const streams: Array<MediaStream | null> = []
    const input = new MicrophoneInput({ environment: env.environment, onStreamChange: s => streams.push(s) })

    const [a, b] = await Promise.all([input.acquire(), input.acquire()])

    expect(env.getUserMedia).toHaveBeenCalledTimes(1)
    expect(a).toEqual({ ok: true, stream: first })
    expect(b).toEqual(a)
    expect(first.track.readyState).toBe('live')
    expect(streams).toEqual([first])
  })

  it('直接 acquire 期间 release：晚到的流被停掉，不成为当前流', async () => {
    const env = createEnvironment()
    const late = createStream('Built-in')
    let resolve!: (stream: MediaStream) => void
    env.getUserMedia.mockImplementationOnce(() => new Promise((done) => {
      resolve = done
    }))
    const input = new MicrophoneInput({ environment: env.environment })

    const pending = input.acquire()
    await flush()
    input.release()
    resolve(late)
    const result = await pending

    expect(result).toMatchObject({ ok: false, failure: 'unknown' })
    expect(late.track.readyState).toBe('ended')
    expect(input.stream).toBeNull()
  })

  it('setConstraints 持有流时按新约束切换；失败保留原来的流', async () => {
    const env = createEnvironment()
    const first = createStream('Built-in')
    const usb = createStream('USB Mic')
    env.getUserMedia
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(usb)
      .mockRejectedValueOnce(new DOMException('Could not start audio source', 'NotReadableError'))
    const streams: Array<MediaStream | null> = []
    const input = new MicrophoneInput({ environment: env.environment, onStreamChange: s => streams.push(s) })
    await input.acquire()

    const switched = await input.setConstraints({ audio: { deviceId: { ideal: 'usb' }, echoCancellation: 'all' } })
    expect(env.getUserMedia).toHaveBeenLastCalledWith({ audio: { deviceId: { ideal: 'usb' }, echoCancellation: 'all' } })
    expect(switched).toEqual({ ok: true, stream: usb })
    expect(first.track.readyState).toBe('ended')

    const failed = await input.setConstraints({ audio: { deviceId: { ideal: 'busy' } } })
    expect(failed).toMatchObject({ ok: false, failure: 'device-busy' })
    expect(input.stream).toBe(usb)
    expect(usb.track.readyState).toBe('live')
    expect(streams).toEqual([first, usb])
  })

  it('音轨静音只转发事件，不当作断开去接回', async () => {
    const env = createEnvironment()
    const first = createStream('Built-in')
    env.getUserMedia.mockResolvedValueOnce(first)
    const events: MicrophoneInputEvent[] = []
    const input = new MicrophoneInput({ environment: env.environment, onEvent: e => events.push(e) })

    await input.acquire()
    input.startWatching()
    first.track.setMuted(true)
    expect(input.muted).toBe(true)
    first.track.setMuted(false)
    await flush()

    expect(events).toEqual([
      { type: 'muted', track: first.track },
      { type: 'unmuted', track: first.track },
    ])
    expect(env.getUserMedia).toHaveBeenCalledTimes(1)
    expect(input.stream).toBe(first)
  })
})

describe('echoCancellation 能力检测', () => {
  it('只在能力列表包含对应模式时判定支持；读取不到能力时返回空', () => {
    const modern = { getCapabilities: () => ({ echoCancellation: [true, false, 'all', 'remote-only'] }) } as unknown as MediaStreamTrack
    const legacy = { getCapabilities: () => ({ echoCancellation: [true, false] }) } as unknown as MediaStreamTrack
    const throwing = { getCapabilities: () => {
      throw new Error('not allowed')
    } } as unknown as MediaStreamTrack

    expect(isEchoCancellationModeSupported(modern, 'all')).toBe(true)
    expect(isEchoCancellationModeSupported(legacy, 'all')).toBe(false)
    expect(getEchoCancellationValues(throwing)).toEqual([])
    expect(getEchoCancellationValues(null)).toEqual([])
  })
})
