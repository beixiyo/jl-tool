import { afterEach, describe, expect, it, vi } from 'vitest'
import { openCamera } from '@/webApi/openCamera'

describe('openCamera', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('应该把媒体流交给回调，并停止所有轨道', async () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }]
    const stream = {
      getTracks: () => tracks,
    } as unknown as MediaStream
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const callback = vi.fn()

    const stopCamera = await openCamera(callback)

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: true })
    expect(callback).toHaveBeenCalledWith(stream)
    stopCamera()
    tracks.forEach(track => expect(track.stop).toHaveBeenCalledTimes(1))
  })
})
