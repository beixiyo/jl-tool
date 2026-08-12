import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RetryError, retryTask } from '@/net'
import { createEventuallySuccessfulTask, createFailingTask, createSuccessfulTask } from './tool'

describe('retryTask', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should succeed on the first attempt if task is successful', async () => {
    const task = createSuccessfulTask('success')
    const result = await retryTask(task, 3)
    expect(result).toBe('success')
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('should retry and succeed if task fails initially', async () => {
    const task = createEventuallySuccessfulTask('success after retry', 2) // Fails 2 times, succeeds on 3rd
    const result = await retryTask(task, 3)
    expect(result).toBe('success after retry')
    expect(task).toHaveBeenCalledTimes(3)
  })

  it('should reject with RetryError if all attempts fail', async () => {
    const task = createFailingTask('always fails')
    let caughtError: RetryError | null = null
    try {
      await retryTask(task, 3)
    }
    catch (e) {
      caughtError = e as RetryError
    }
    expect(caughtError).toBeInstanceOf(RetryError)
    expect(caughtError?.message).toContain('Task failed after 3 attempts.')
    expect(caughtError?.lastError?.message).toBe('always fails')
    expect(caughtError?.attempts).toBe(3)
    expect(task).toHaveBeenCalledTimes(3)
  })

  it('should handle maxAttempts = 1 (no retries on failure)', async () => {
    const task = createFailingTask('fail once')
    await expect(retryTask(task, 1)).rejects.toThrowError(RetryError)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('should apply delay between retries', async () => {
    const task = createEventuallySuccessfulTask('delayed success', 1) // Fails once
    const delayMs = 100
    const promise = retryTask(task, 2, { delayMs })

    /** 第一次调用 (立即) */
    // expect(task).toHaveBeenCalledTimes(1); // 难以精确断言时间点，因为是异步的

    /** 快进时间，但不超过第一次失败到第二次尝试之间的时间 */
    await vi.advanceTimersByTimeAsync(delayMs - 10)
    expect(task).toHaveBeenCalledTimes(1) // 应该还只调用了一次 (第一次失败)

    /** 快进时间以覆盖延迟 */
    await vi.advanceTimersByTimeAsync(delayMs + 10)
    /** 等待 retryTask promise 完成 */
    const result = await promise

    expect(result).toBe('delayed success')
    expect(task).toHaveBeenCalledTimes(2) // 第二次调用（成功）
  })

  it('should reject immediately if maxAttempts is 0 or less (after first try)', async () => {
    const task = createFailingTask('fail')
    await expect(retryTask(task, 0)).rejects.toThrowError(RetryError)
    expect(task).toHaveBeenCalledTimes(1) // task 应该只执行一次

    const task2 = createFailingTask('fail again')
    await expect(retryTask(task2, -1)).rejects.toThrowError(RetryError)
    expect(task2).toHaveBeenCalledTimes(1)
  })
})
