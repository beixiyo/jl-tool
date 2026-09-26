import { requestDisplayAudio } from '@/webApi/DisplayAudio'
import { describe, expect, it, vi } from 'vitest'

class FakeTrack {
  readyState: MediaStreamTrackState = 'live'
  constructor(readonly kind: 'audio' | 'video', private readonly settings: MediaTrackSettings = {}) {}

  stop() {
    this.readyState = 'ended'
  }

  getSettings() {
    return this.readyState === 'live'
      ? this.settings
      : {}
  }
}

function createStream(tracks: FakeTrack[]) {
  let list = [...tracks]
  return {
    getTracks: () => list,
    getAudioTracks: () => list.filter((t) => t.kind === 'audio'),
    getVideoTracks: () => list.filter((t) => t.kind === 'video'),
    removeTrack: (track: FakeTrack) => {
      list = list.filter((t) => t !== track)
    },
  } as unknown as MediaStream
}

function envReturning(stream: MediaStream) {
  return envWith(async () => stream)
}

function envRejecting(error: unknown) {
  return envWith(async () => {
    throw error
  })
}

function envWith(getDisplayMedia: () => Promise<MediaStream>) {
  return {
    mediaDevices: {
      getDisplayMedia,
      getSupportedConstraints: () => ({}),
    },
  }
}

/**
 * 只要声音却必须请求视频：视频轨不停，用户的屏幕会一直被采集；
 * 没勾选音频时要让调用方知道，才能提示「只录了麦克风」
 */
describe('requestDisplayAudio', () => {
  it('分享了声音：停掉并移除视频轨，保留音轨，读出来源', async () => {
    const video = new FakeTrack('video', { displaySurface: 'browser' } as MediaTrackSettings)
    const audio = new FakeTrack('audio')
    const result = await requestDisplayAudio({ environment: envReturning(createStream([video, audio])) })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(video.readyState).toBe('ended')
    expect(result.stream.getVideoTracks()).toEqual([])
    expect(result.hasAudio).toBe(true)
    expect(result.surface).toBe('browser')
    expect(audio.readyState).toBe('live')
  })

  it('没勾选音频：hasAudio 为 false，视频轨已停，共享随之结束', async () => {
    const video = new FakeTrack('video', { displaySurface: 'monitor' } as MediaTrackSettings)
    const result = await requestDisplayAudio({ environment: envReturning(createStream([video])) })

    expect(result).toMatchObject({ ok: true, hasAudio: false, surface: 'monitor' })
    expect(video.readyState).toBe('ended')
  })

  it('整屏开关与本地静音正确透传；完整函数配置优先且回调错误仍返回分类结果', async () => {
    const getDisplayMedia = vi.fn(async (_options?: DisplayMediaStreamOptions) => createStream([]))
    const environment = { mediaDevices: { getDisplayMedia, getSupportedConstraints: () => ({}) } }
    await requestDisplayAudio({
      preferSurface: 'browser',
      monitorTypeSurfaces: 'exclude',
      suppressLocalAudioPlayback: true,
      displayMediaOptions: (defaults) => ({ ...defaults, preferCurrentTab: true, audio: { suppressLocalAudioPlayback: false, sampleRate: 48000 } }),
      environment,
    })
    expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining({
      monitorTypeSurfaces: 'exclude',
      preferCurrentTab: true,
      audio: { suppressLocalAudioPlayback: false, sampleRate: 48000 },
    }))
    const result = await requestDisplayAudio({
      environment,
      displayMediaOptions: () => {
        throw new Error('invalid config')
      },
    })
    expect(result).toMatchObject({ ok: false, failure: 'unknown' })
  })

  it('取消选择、系统拒绝与缺少用户激活分别归类', async () => {
    const cancelled = await requestDisplayAudio({
      environment: envRejecting(new DOMException('Permission denied by user', 'NotAllowedError')),
    })
    const systemDenied = await requestDisplayAudio({
      environment: envRejecting(new DOMException('Permission denied by system', 'NotAllowedError')),
    })

    const inactive = await requestDisplayAudio({
      environment: envRejecting(new DOMException('getDisplayMedia must be called from a user gesture handler', 'InvalidStateError')),
    })

    expect(cancelled).toMatchObject({ ok: false, failure: 'cancelled' })
    expect(systemDenied).toMatchObject({ ok: false, failure: 'system-denied' })
    expect(inactive).toMatchObject({ ok: false, failure: 'activation-required' })
  })
})
