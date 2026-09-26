import { describe, expect, it, vi } from 'vitest'
/** 验证异步 voices、回调共存、原生识别配置与销毁清理，不依赖真实语音服务 */
import { Speaker } from '@/webApi/Speaker'
import { SpeakToTxt } from '@/webApi/SpeakToTxt'

describe('Speaker', () => {
  it('立即加载现有 voices、异步按名称选中，新回调和旧 play 回调共存，destroy 后不再监听', () => {
    const synthesis = new EventTarget() as EventTarget & {
      getVoices: ReturnType<typeof vi.fn>
      cancel: ReturnType<typeof vi.fn>
      speak: ReturnType<typeof vi.fn>
    }
    synthesis.getVoices = vi.fn(() => [] as SpeechSynthesisVoice[])
    synthesis.cancel = vi.fn()
    synthesis.speak = vi.fn()
    const utterance = new EventTarget() as SpeechSynthesisUtterance
    const onVoicesChanged = vi.fn()
    const onEnd = vi.fn()
    const speaker = new Speaker({
      voiceName: 'chosen',
      onVoicesChanged,
      onEnd,
      utteranceOptions: (defaults) => ({ ...defaults, lang: 'en-US', rate: 1.5 }),
      environment: { speechSynthesis: synthesis as unknown as SpeechSynthesis, createUtterance: () => utterance },
    })
    expect(onVoicesChanged).toHaveBeenCalledWith([])
    const voice = { name: 'chosen' } as SpeechSynthesisVoice
    synthesis.getVoices.mockReturnValue([voice])
    synthesis.dispatchEvent(new Event('voiceschanged'))
    expect(utterance.voice).toBe(voice)
    expect(utterance.lang).toBe('en-US')
    const once = vi.fn()
    speaker.play(once)
    utterance.dispatchEvent(new Event('end'))
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(once).toHaveBeenCalledTimes(1)
    speaker.play()
    utterance.dispatchEvent(new Event('end'))
    expect(once).toHaveBeenCalledTimes(2)
    speaker.destroy()
    speaker.destroy()
    synthesis.dispatchEvent(new Event('voiceschanged'))
    utterance.dispatchEvent(new Event('end'))
    expect(onVoicesChanged).toHaveBeenCalledTimes(2)
    expect(onEnd).toHaveBeenCalledTimes(2)
  })
})

describe('SpeakToTxt', () => {
  it('完整原生配置不依赖全局构造器，错误原样交付，destroy 清空事件并 abort 一次', () => {
    const native = { start: vi.fn(), stop: vi.fn(), abort: vi.fn() } as unknown as SpeechRecognition
    const onError = vi.fn()
    const recognition = new SpeakToTxt({
      maxAlternatives: 3,
      onResult: vi.fn(),
      onError,
      recognitionOptions: (defaults) => ({ ...defaults, lang: 'en-US', processLocally: true, phrases: [{ phrase: 'jl-tool', boost: 2 }] }),
      environment: { createRecognition: () => native },
    })
    recognition.start()
    expect(native).toMatchObject({ maxAlternatives: 3, lang: 'en-US', processLocally: true, continuous: false, interimResults: false })
    const error = Object.assign(new Event('error'), { error: 'not-allowed', message: 'denied' })
    native.onerror(error)
    expect(onError).toHaveBeenCalledWith(error)
    recognition.destroy()
    recognition.destroy()
    expect(native.onerror).toBeNull()
    expect(native.onresult).toBeNull()
    expect(native.abort).toHaveBeenCalledTimes(1)
    recognition.start()
    expect(native.start).toHaveBeenCalledTimes(1)
  })
})
