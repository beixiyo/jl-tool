import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Recorder } from '@/webApi/Recorder'

// Mock Web APIs
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
}

const mockMediaStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
}

const mockURL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
}

// Mock global objects
Object.defineProperty(globalThis, 'MediaRecorder', {
  value: vi.fn(() => mockMediaRecorder),
  writable: true,
})

Object.defineProperty(globalThis, 'URL', {
  value: mockURL,
  writable: true,
})

Object.defineProperty(globalThis, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream)),
    },
  },
  writable: true,
})

describe('recorder', () => {
  let recorder: Recorder

  beforeEach(() => {
    recorder = new Recorder()
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (recorder.audioUrl) {
      URL.revokeObjectURL(recorder.audioUrl)
    }
  })

  describe('init', () => {
    it('应该初始化录音器', async () => {
      const result = await recorder.init()
      expect(result).toBeUndefined()
      // @ts-expect-error 测试私有属性
      expect(recorder.mediaRecorder).toBeDefined()
      // @ts-expect-error 测试私有属性
      expect(recorder.stream).toBeDefined()
    })

    it('应该处理初始化失败', async () => {
      const mockGetUserMedia = vi.fn(() => Promise.reject(new Error('权限被拒绝')))
      Object.defineProperty(globalThis.navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
        writable: true,
      })

      const result = await recorder.init()
      expect(result).toBe('获取麦克风权限失败，请手动开启权限')
      // @ts-expect-error 测试私有属性
      expect(recorder.mediaRecorder).toBeNull()
    })
  })

  describe('start', () => {
    it('应该开始录音', async () => {
      await recorder.init()
      const result = recorder.start()
      expect(result).toBe(recorder)
    })

    it('应该在没有初始化时警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = recorder.start()
      expect(result).toBe(recorder)
      expect(consoleSpy).toHaveBeenCalledWith('请先调用`init`方法 等待初始化完成')
    })
  })

  describe('stop', () => {
    it('应该停止录音', async () => {
      await recorder.init()
      recorder.start()
      const result = recorder.stop()
      expect(result).toBe(recorder)
    })

    it('应该处理未在录音状态的情况', async () => {
      await recorder.init()
      const result = recorder.stop()
      expect(result).toBe(recorder)
    })
  })

  describe('play', () => {
    it('应该播放录音', async () => {
      await recorder.init()
      recorder.audioUrl = 'blob:test-url'
      const mockAudio = {
        play: vi.fn(() => Promise.resolve()),
      }
      Object.defineProperty(globalThis, 'Audio', {
        value: vi.fn(() => mockAudio),
        writable: true,
      })

      const result = recorder.play()
      expect(result).toBe(recorder)
      expect(mockAudio.play).toHaveBeenCalled()
    })

    it('应该播放指定的 URL', async () => {
      const mockAudio = {
        play: vi.fn(() => Promise.resolve()),
      }
      Object.defineProperty(globalThis, 'Audio', {
        value: vi.fn(() => mockAudio),
        writable: true,
      })

      const result = recorder.play('test-url')
      expect(result).toBe(recorder)
      expect(mockAudio.play).toHaveBeenCalled()
    })

    it('应该在没有录音时警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = recorder.play()
      expect(result).toBe(recorder)
      expect(consoleSpy).toHaveBeenCalledWith('录音尚未完成，请使用`onFinish`回调')
    })
  })

  describe('onFinish callback', () => {
    it('应该支持回调函数', () => {
      const mockCallback = vi.fn()
      const recorderWithCallback = new Recorder(mockCallback)
      expect(recorderWithCallback).toBeInstanceOf(Recorder)
    })
  })
})
