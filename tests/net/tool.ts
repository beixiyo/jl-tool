import { vi } from 'vitest'

/** 辅助函数：创建一个在指定次数后成功的Promise任务 */
export function createEventuallySuccessfulTask<T>(value: T, failCount: number): (() => Promise<T>) {
  let attempts = 0
  return vi.fn(async () => {
    attempts++
    if (attempts <= failCount) {
      // console.log(`Task attempt ${attempts} (failing)`);
      throw new Error(`Simulated failure ${attempts}`)
    }
    // console.log(`Task attempt ${attempts} (succeeding with ${value})`);
    return value
  })
}

/** 辅助函数：创建一个总是失败的Promise任务 */
export function createFailingTask<T>(errorMessage: string): (() => Promise<T>) {
  return vi.fn(async () => {
    throw new Error(errorMessage)
  })
}

/** 辅助函数：创建一个成功的Promise任务 */
export function createSuccessfulTask<T>(value: T, delay = 0): (() => Promise<T>) {
  return vi.fn(async () => {
    if (delay > 0)
      await new Promise(r => setTimeout(r, delay))
    return value
  })
}
