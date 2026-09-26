/** 仅模拟原生事件时序与资源边界；库不解析容器，分片内容只需可比较的字节 */
import { vi } from 'vitest'

export const chunkBytes = new Uint8Array([0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x02, 0x03, 0x04])

export class FakeRecorder {
  state: RecordingState = 'inactive'
  mimeType = 'audio/webm;codecs=opus'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstart: (() => void) | null = null
  onpause: (() => void) | null = null
  onresume: (() => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null
  start = vi.fn((_timeslice?: number) => {
    this.state = 'recording'
    this.onstart?.()
  })

  pause = vi.fn(() => {
    this.state = 'paused'
    this.onpause?.()
  })

  resume = vi.fn(() => {
    this.state = 'recording'
    this.onresume?.()
  })

  requestData = vi.fn()
  stop = vi.fn(() => {
    this.state = 'inactive'
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob([chunkBytes], { type: this.mimeType }) } as BlobEvent)
      this.onstop?.()
    })
  })

  asNative() {
    return this as unknown as MediaRecorder
  }
}

export function fakeStream() {
  const track = { stop: vi.fn() }
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
  return { stream, track }
}

export function fakeContext() {
  const { stream, track } = fakeStream()
  const node = () => {
    const value = { gain: { value: 1 }, start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), connect: vi.fn() }
    value.connect.mockImplementation((target) => target)
    return value
  }
  const source = node()
  const destination = { ...node(), stream }
  const context = {
    createMediaStreamDestination: () => destination,
    createConstantSource: () => node(),
    createGain: () => node(),
    createMediaStreamSource: () => source,
  } as unknown as AudioContext
  return { context, source, track }
}

export function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}
