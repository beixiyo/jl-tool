import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { convertToWav } from '@/convert/audioToWav'

const globalRef = globalThis as unknown as Window & typeof globalThis

class TestBlob {
  private readonly parts: BlobPart[]
  readonly type: string
  readonly size: number

  constructor(parts: BlobPart[], options?: BlobPropertyBag) {
    this.parts = parts
    this.type = options?.type ?? ''
    this.size = parts.reduce((total, part) => total + this.resolveLength(part), 0)
  }

  async arrayBuffer() {
    const segments: Uint8Array[] = []
    for (const part of this.parts) {
      if (part instanceof ArrayBuffer) {
        segments.push(new Uint8Array(part))
      }
      else if (ArrayBuffer.isView(part)) {
        segments.push(new Uint8Array(part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength)))
      }
      else if (typeof part === 'string') {
        segments.push(new TextEncoder().encode(part))
      }
      else if (part instanceof TestBlob) {
        segments.push(new Uint8Array(await part.arrayBuffer()))
      }
      else {
        throw new Error('Unsupported blob part')
      }
    }

    const totalLength = segments.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of segments) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return merged.buffer
  }

  private resolveLength(part: BlobPart) {
    if (part instanceof ArrayBuffer) {
      return part.byteLength
    }
    if (ArrayBuffer.isView(part)) {
      return part.byteLength
    }
    if (typeof part === 'string') {
      return part.length
    }
    if (part instanceof TestBlob) {
      return part.size
    }
    throw new Error('Unsupported blob part')
  }
}

class MockAudioBuffer {
  public readonly channelData: Float32Array[]

  constructor(
    public readonly numberOfChannels: number,
    public readonly length: number,
    public readonly sampleRate: number,
    channelPayload?: Float32Array[],
  ) {
    this.channelData = channelPayload
      ? channelPayload.map(data => new Float32Array(data))
      : Array.from({ length: numberOfChannels }, () => new Float32Array(length))
  }

  get duration() {
    return this.length / this.sampleRate
  }

  getChannelData(channel: number) {
    return this.channelData[channel]
  }
}

class MockAudioContext {
  static decodeBuffer: MockAudioBuffer | null = null

  constructor(public readonly options?: AudioContextOptions) {}

  async decodeAudioData(_arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!MockAudioContext.decodeBuffer) {
      throw new Error('mock decode buffer not configured')
    }
    return MockAudioContext.decodeBuffer as unknown as AudioBuffer
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return new MockAudioBuffer(numberOfChannels, length, sampleRate) as unknown as AudioBuffer
  }

  async close() {}

  static setDecodeBuffer(buffer: MockAudioBuffer) {
    MockAudioContext.decodeBuffer = buffer
  }
}

function readString(view: DataView, start: number, length: number) {
  return Array.from({ length }, (_, idx) => String.fromCharCode(view.getUint8(start + idx))).join('')
}

describe('convertToWav', () => {
  const fakeBlob = {
    async arrayBuffer() {
      return new ArrayBuffer(8)
    },
  } as Blob
  let originalBlob: typeof Blob | undefined

  beforeEach(() => {
    if (!(globalRef as any).window) {
      (globalRef as any).window = globalRef
    }
    originalBlob = (globalRef as any).Blob
    ;(globalRef as any).Blob = TestBlob as unknown as typeof Blob
    (globalRef as any).window.AudioContext = MockAudioContext as unknown as typeof AudioContext
    ;(globalRef as any).window.webkitAudioContext = undefined
    MockAudioContext.decodeBuffer = null
  })

  afterEach(() => {
    delete (globalRef as any).window.AudioContext
    delete (globalRef as any).window.webkitAudioContext
    if (originalBlob) {
      (globalRef as any).Blob = originalBlob
    }
    else {
      delete (globalRef as any).Blob
    }
  })

  it('生成标准 WAV 头并保留单声道数据', async () => {
    const monoSamples = Float32Array.from([0, 0.5, -0.5, 1])
    MockAudioContext.setDecodeBuffer(new MockAudioBuffer(1, monoSamples.length, 16000, [monoSamples]))

    const wavBlob = await convertToWav(fakeBlob, { sampleRate: 16000, channels: 1 })
    expect(wavBlob.type).toBe('audio/wav')

    const dataView = new DataView(await wavBlob.arrayBuffer())
    expect(readString(dataView, 0, 4)).toBe('RIFF')
    expect(readString(dataView, 8, 4)).toBe('WAVE')
    expect(dataView.getUint32(40, true)).toBe(monoSamples.length * 2)
    expect(dataView.getInt16(44, true)).toBe(0)
    expect(dataView.getInt16(46, true)).toBe(Math.trunc(0.5 * 0x7FFF))
    expect(dataView.getInt16(48, true)).toBe(Math.trunc(-0.5 * 0x8000))
  })

  it('重采样并将多声道混合为单声道', async () => {
    const ch1 = Float32Array.from([0.4, 0.3, 0.2, -0.4, -0.3, -0.2])
    const ch2 = Float32Array.from([0.2, 0.1, 0, -0.2, -0.1, 0])
    MockAudioContext.setDecodeBuffer(new MockAudioBuffer(2, ch1.length, 48000, [ch1, ch2]))

    const wavBlob = await convertToWav(fakeBlob, { sampleRate: 16000, channels: 1 })
    const view = new DataView(await wavBlob.arrayBuffer())
    // floor(6 * 16000 / 48000) = 2 samples at 2 bytes each
    expect(view.getUint32(40, true)).toBe(4)

    const firstSample = view.getInt16(44, true)
    const expectedFirst = Math.trunc(((ch1[0] + ch2[0]) / 2) * 0x7FFF)
    expect(firstSample).toBe(expectedFirst)

    const secondSample = view.getInt16(46, true)
    const mixed = Math.trunc(((ch1[3] + ch2[3]) / 2) * 0x8000)
    expect(secondSample).toBe(mixed)
  })

  it('在缺少 AudioContext 时抛出错误', async () => {
    delete (globalRef as any).window.AudioContext
    await expect(convertToWav(fakeBlob)).rejects.toThrow('当前环境不支持 AudioContext')
  })
})

