import { describe, expect, it } from 'vitest'
import { concurrentTask } from '@/net/concurrentTask'

describe('concurrentTask', () => {
  it('应该正确执行并发任务', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
      () => Promise.resolve(4),
      () => Promise.resolve(5),
    ]

    const result = await concurrentTask(tasks, 2)
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 2 },
      { status: 'fulfilled', value: 3 },
      { status: 'fulfilled', value: 4 },
      { status: 'fulfilled', value: 5 },
    ])
  })

  it('应该处理任务失败', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('Task failed')),
      () => Promise.resolve(3),
    ]

    const result = await concurrentTask(tasks, 2)
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: new Error('Task failed') },
      { status: 'fulfilled', value: 3 },
    ])
  })

  it('应该处理空任务数组', async () => {
    const result = await concurrentTask([], 2)
    expect(result).toEqual([])
  })

  it('应该处理单个任务', async () => {
    const tasks = [() => Promise.resolve(42)]
    const result = await concurrentTask(tasks, 2)
    expect(result).toEqual([{ status: 'fulfilled', value: 42 }])
  })

  it('应该处理并发数大于任务数的情况', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
    ]

    const result = await concurrentTask(tasks, 5)
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 2 },
    ])
  })

  it('应该保持任务执行顺序', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
    ]

    const result = await concurrentTask(tasks, 2)
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 2 },
      { status: 'fulfilled', value: 3 },
    ])
  })
})
