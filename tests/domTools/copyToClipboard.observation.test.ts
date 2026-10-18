/** 真实复制API/降级副作用与成功观察契约；剪贴板替身不会访问OS。 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { copyToClipboard } from '@/domTools/domTool'

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
const originalExec = Object.getOwnPropertyDescriptor(document, 'execCommand')
const writeText = vi.fn()
const exec = vi.fn()

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined)
  exec.mockReset().mockReturnValue(false)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  Object.defineProperty(document, 'execCommand', { configurable: true, value: exec })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
  if (originalExec) Object.defineProperty(document, 'execCommand', originalExec)
  else Reflect.deleteProperty(document, 'execCommand')
})

it('writeText未完成0，fulfilled仅一次；原返回值和默认无观察路径保留', async () => {
  let finish!: () => void
  writeText.mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve }))
  const observed = vi.fn()
  const copying = copyToClipboard('private synthetic', { onWriteSucceeded: observed })
  expect(observed).not.toHaveBeenCalled()
  finish()
  expect(await copying).toBeUndefined()
  expect(observed).toHaveBeenCalledTimes(1)
  expect(exec).not.toHaveBeenCalled()
  expect(await copyToClipboard('legacy')).toBeUndefined()
  expect(writeText.mock.calls).toEqual([['private synthetic'], ['legacy']])
})

it('原writeText拒绝→execCommand仅严格true成功；false/throw不伪报且textarea照旧清理', async () => {
  writeText.mockRejectedValue(new Error('controlled API refusal'))
  const observed = vi.fn()
  const before = document.querySelectorAll('textarea').length
  exec.mockReturnValueOnce(true)
  await copyToClipboard('fallback true', { onWriteSucceeded: observed })
  expect(observed).toHaveBeenCalledTimes(1)
  expect(document.querySelectorAll('textarea').length).toBe(before)
  exec.mockReturnValueOnce(false)
  await copyToClipboard('fallback false', { onWriteSucceeded: observed })
  expect(observed).toHaveBeenCalledTimes(1)
  expect(console.error).toHaveBeenCalledWith('Copy failed')
  exec.mockImplementationOnce(() => { throw new Error('controlled exec refusal') })
  await copyToClipboard('fallback throw', { onWriteSucceeded: observed })
  expect(observed).toHaveBeenCalledTimes(1)
  expect(document.querySelectorAll('textarea').length).toBe(before)
  expect(exec.mock.calls).toEqual([['copy'], ['copy'], ['copy']])
})

it('观察getter/throw/reject/pending均不能触发额外fallback或改变原return', async () => {
  await copyToClipboard('getter', { get onWriteSucceeded(): () => void { throw new Error('controlled getter') } })
  for (const observer of [
    () => { throw new Error('controlled observer') },
    () => Promise.reject(new Error('controlled rejection')),
    () => new Promise<void>(() => {}),
  ]) {
    expect(await copyToClipboard('observer', { onWriteSucceeded: observer })).toBeUndefined()
  }
  expect(writeText).toHaveBeenCalledTimes(4)
  expect(exec).not.toHaveBeenCalled()
})
