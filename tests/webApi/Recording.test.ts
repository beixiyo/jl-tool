import { afterEach, describe, expect, it, vi } from 'vitest'
/** 捕获配置未透传、暂停计时错误、stop 过早返回和资源所有权回归 */
import { AudioLaneRecorder } from '@/webApi/AudioLaneRecorder'
import { Recorder } from '@/webApi/Recorder'
import { finalizeRecording } from '@/webApi/recording'
import { chunkBytes, fakeContext, FakeRecorder, fakeStream, readBlob } from './mediaFakes'

afterEach(() => vi.unstubAllGlobals())

function captureSetup() {
  let time = 0
  const native = new FakeRecorder()
  const { stream, track } = fakeStream()
  const getUserMedia = vi.fn(async (_constraints?: MediaStreamConstraints) => stream)
  const createMediaRecorder = vi.fn(() => native.asNative())
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:recording'), revokeObjectURL: vi.fn() })
  return {
    native,
    stream,
    track,
    getUserMedia,
    createMediaRecorder,
    tick: (next: number) => {
      time = next
    },
    environment: {
      mediaDevices: { getUserMedia },
      createMediaRecorder,
      isTypeSupported: () => true,
      now: () => time,
    },
  }
}

describe('最终输出', () => {
  it('未注入处理器时原样返回同一个 Blob', async () => {
    const raw = new Blob([chunkBytes], { type: 'audio/webm;codecs=opus' })
    expect(await finalizeRecording({ blob: raw, durationMs: 2071.5 })).toBe(raw)
  })
})

describe('Recorder', () => {
  it('完整约束透传，原始分片不变；stop 等待外部处理并传入扣除暂停的时长', async () => {
    const env = captureSetup()
    const processed = new Blob(['application output'], { type: 'audio/webm;codecs=opus' })
    let finish!: (blob: Blob) => void
    const finalizeBlob = vi.fn(() =>
      new Promise<Blob>((resolve) => {
        finish = resolve
      })
    )
    const onFinish = vi.fn()
    const onDataAvailable = vi.fn()
    const onStateChange = vi.fn()
    const recorder = new Recorder({
      autoInit: false,
      deviceId: 'mic',
      audio: (defaults) => ({ ...defaults, channelCount: { exact: 2 }, sampleRate: 48000 }),
      recorderOptions: (defaults) => ({ ...defaults, mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 48000, audioBitrateMode: 'constant' }),
      timesliceMs: 50,
      finalizeBlob,
      environment: env.environment,
      onFinish,
      onDataAvailable,
      onStateChange,
    })
    await recorder.start()
    expect(env.getUserMedia).toHaveBeenCalledWith({
      audio: {
        deviceId: { exact: 'mic' },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: { exact: 2 },
        sampleRate: 48000,
      },
    })
    expect(env.createMediaRecorder).toHaveBeenCalledWith(env.stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 48000,
      audioBitrateMode: 'constant',
    })
    expect(env.native.start).toHaveBeenCalledWith(50)
    env.tick(1000)
    await recorder.pause()
    env.tick(9000)
    await recorder.resume()
    env.tick(10000)
    const stops = Promise.all([recorder.stop(), recorder.stop()])
    await vi.waitFor(() => expect(finalizeBlob).toHaveBeenCalledTimes(1))
    expect(onFinish).not.toHaveBeenCalled()
    expect(finalizeBlob.mock.calls[0]).toEqual([{ blob: expect.any(Blob), durationMs: 2000 }])
    finish(processed)
    await stops
    expect(recorder.result?.durationMs).toBe(2000)
    expect(recorder.result?.blob).toBe(processed)
    expect(onFinish).toHaveBeenCalledWith('blob:recording', recorder.chunks)
    expect(await readBlob(new Blob(recorder.chunks))).toEqual(await readBlob(onDataAvailable.mock.calls[0][0]))
    expect(onStateChange.mock.calls.flat()).toEqual(['recording', 'paused', 'recording', 'inactive'])
    await recorder.destroy()
    expect(env.track.stop).toHaveBeenCalledTimes(1)
  })

  it('updateConfig 在下一轮应用新约束，不中断当前录制；流式模式没有上轮输出残留', async () => {
    const env = captureSetup()
    const recorder = new Recorder({ autoInit: false, environment: env.environment })
    await recorder.start()
    recorder.updateConfig({ audio: { sampleRate: 16000 }, retainChunks: false })
    expect(env.getUserMedia).toHaveBeenCalledTimes(1)
    env.tick(1000)
    await recorder.stop()
    await recorder.start(123)
    expect(env.getUserMedia.mock.calls[1][0]).toMatchObject({ audio: { sampleRate: 16000 } })
    env.tick(2000)
    await recorder.stop()
    expect(recorder.result?.blob).toBeNull()
    expect(recorder.audioUrl).toBe('')
    expect(recorder.chunks).toEqual([])
    expect(env.native.start).toHaveBeenLastCalledWith(123)
    await recorder.destroy()
  })

  it('借用流不申请麦克风、不停止调用方音轨，原生错误可观察且 stop 拒绝', async () => {
    const env = captureSetup()
    const onError = vi.fn()
    const recorder = new Recorder({ autoInit: false, source: { kind: 'media-stream', stream: env.stream }, environment: env.environment, onError })
    await recorder.start()
    const error = new Error('encoder failed')
    env.native.onerror?.(Object.assign(new Event('error'), { error }))
    await expect(recorder.stop()).rejects.toBe(error)
    expect(onError).toHaveBeenCalledWith(error)
    await recorder.destroy()
    expect(env.getUserMedia).not.toHaveBeenCalled()
    expect(env.track.stop).not.toHaveBeenCalled()
  })

  it('销毁后晚到的麦克风流立即释放，不创建编码器', async () => {
    const env = captureSetup()
    let deliver!: (stream: MediaStream) => void
    const pending = new Promise<MediaStream>((resolve) => {
      deliver = resolve
    })
    env.getUserMedia.mockReturnValue(pending)
    const recorder = new Recorder({ autoInit: false, environment: env.environment })
    const init = recorder.start()
    await vi.waitFor(() => expect(env.getUserMedia).toHaveBeenCalled())
    await recorder.destroy()
    deliver(env.stream)
    await init
    expect(env.track.stop).toHaveBeenCalledTimes(1)
    expect(env.createMediaRecorder).not.toHaveBeenCalled()
    expect(env.getUserMedia).toHaveBeenCalledTimes(1)
    expect(recorder.mediaRecorder).toBeNull()
  })
})

describe('外部处理失败与销毁边界', () => {
  it.each(['Recorder', 'AudioLaneRecorder'] as const)('%s 的处理失败使 stop 拒绝并通知 onError', async (kind) => {
    const env = captureSetup()
    const graph = fakeContext()
    const failure = new Error('external finalizer failed')
    const onError = vi.fn()
    const finalizeBlob = async () => {
      throw failure
    }
    const recorder = kind === 'Recorder'
      ? new Recorder({ autoInit: false, environment: env.environment, finalizeBlob, onError })
      : new AudioLaneRecorder({ context: graph.context, environment: env.environment, retainChunks: true, finalizeBlob, onError })
    await recorder.start()
    await expect(recorder.stop()).rejects.toBe(failure)
    expect(onError).toHaveBeenCalledWith(failure)
    if (recorder instanceof Recorder) await recorder.destroy()
    else expect(graph.track.stop).toHaveBeenCalledTimes(1)
  })

  it('Recorder 上一轮处理失败后，下一轮 start 不被旧错误阻塞', async () => {
    const env = captureSetup()
    const failure = new Error('external finalizer failed')
    let fail = true
    const recorder = new Recorder({
      autoInit: false,
      environment: env.environment,
      finalizeBlob: async ({ blob }) => {
        if (fail) throw failure
        return blob
      },
    })
    await recorder.start()
    await expect(recorder.stop()).rejects.toBe(failure)

    fail = false
    await recorder.start()
    expect(recorder.isRecording).toBe(true)
    await recorder.stop()
    expect(recorder.result?.blob?.size).toBeGreaterThan(0)
    await recorder.destroy()
  })

  it('Recorder 生成最终输出期间 updateConfig 不丢弃本轮结果，新配置在下一轮生效', async () => {
    const env = captureSetup()
    let finish!: (blob: Blob) => void
    const finalizeBlob = vi.fn(() =>
      new Promise<Blob>((resolve) => {
        finish = resolve
      })
    )
    const onStop = vi.fn()
    const recorder = new Recorder({ autoInit: false, environment: env.environment, finalizeBlob, onStop })
    await recorder.start()
    const stop = recorder.stop()
    await vi.waitFor(() => expect(finalizeBlob).toHaveBeenCalled())
    recorder.updateConfig({ audio: { sampleRate: 16000 } })
    const processed = new Blob(['processed'], { type: 'audio/webm' })
    finish(processed)
    await stop
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(recorder.result?.blob).toBe(processed)
    expect(env.getUserMedia).toHaveBeenCalledTimes(1)

    await recorder.start()
    expect(env.getUserMedia.mock.calls[1][0]).toMatchObject({ audio: { sampleRate: 16000 } })
    await recorder.destroy()
  })

  it('Recorder 转移所有权的外部流在配置重建时继续使用，只在销毁时停止', async () => {
    const env = captureSetup()
    const recorder = new Recorder({
      autoInit: false,
      source: { kind: 'media-stream', stream: env.stream, stopTracksOnDestroy: true },
      environment: env.environment,
    })
    await recorder.init()
    recorder.updateConfig({ timesliceMs: 100 })
    await recorder.init()
    expect(env.createMediaRecorder).toHaveBeenCalledTimes(2)
    expect(env.track.stop).not.toHaveBeenCalled()
    await recorder.destroy()
    expect(env.track.stop).toHaveBeenCalledTimes(1)
  })

  it('Recorder 销毁后忽略外部处理的迟到结果或拒绝', async () => {
    const env = captureSetup()
    let reject!: (error: Error) => void
    const finalizeBlob = vi.fn(() =>
      new Promise<Blob>((_resolve, fail) => {
        reject = fail
      })
    )
    const onFinish = vi.fn()
    const onError = vi.fn()
    const recorder = new Recorder({ autoInit: false, environment: env.environment, finalizeBlob, onFinish, onError })
    await recorder.start()
    const stop = recorder.stop()
    await vi.waitFor(() => expect(finalizeBlob).toHaveBeenCalled())
    await recorder.destroy()
    reject(new Error('late'))
    await stop
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onFinish).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(recorder.result).toBeNull()
  })
})

describe('AudioLaneRecorder', () => {
  it('热切换不停止外部流；并发 stop 只清理一次，最终文件和时长完整交付', async () => {
    let time = 0
    const env = fakeContext()
    const external = fakeStream()
    const native = new FakeRecorder()
    const onStop = vi.fn()
    const onError = vi.fn()
    const processed = new Blob(['external result'], { type: native.mimeType })
    const finalizeBlob = vi.fn(async () => processed)
    const lane = new AudioLaneRecorder({
      context: env.context,
      timesliceMs: 10,
      retainChunks: true,
      finalizeBlob,
      onStop,
      onError,
      environment: { createMediaRecorder: () => native.asNative(), now: () => time },
    })
    lane.setSource(external.stream)
    lane.start()
    time = 1000
    lane.pause()
    lane.setSource(null)
    time = 5000
    lane.resume()
    time = 6000
    native.onerror?.(Object.assign(new Event('error'), { error: new Error('failure') }))
    expect(onError).toHaveBeenCalledTimes(1)
    await Promise.all([lane.stop(), lane.stop()])
    expect(lane.getResult()?.durationMs).toBe(2000)
    expect(lane.getResult()?.blob).toBe(processed)
    expect(finalizeBlob.mock.calls[0]).toEqual([{ blob: expect.any(Blob), durationMs: 2000 }])
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(external.track.stop).not.toHaveBeenCalled()
    expect(env.track.stop).toHaveBeenCalledTimes(1)
    expect(lane.state).toBe('stopped')
  })

  it('原生自行停止同样完成清理；默认不缓存，仅交付分片和时长', async () => {
    const env = fakeContext()
    const native = new FakeRecorder()
    const onDataAvailable = vi.fn()
    const finalizeBlob = vi.fn()
    const lane = new AudioLaneRecorder({
      context: env.context,
      finalizeBlob,
      onDataAvailable,
      environment: { createMediaRecorder: () => native.asNative() },
    })
    lane.start()
    native.stop()
    await lane.stop()
    expect(onDataAvailable).toHaveBeenCalledTimes(1)
    expect(lane.getResult()?.blob).toBeNull()
    expect(finalizeBlob).not.toHaveBeenCalled()
    expect(env.track.stop).toHaveBeenCalledTimes(1)
  })
})
