import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduleTask } from '@/tools/scheduleTask'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('scheduleTask', () => {
  it('每个任务只启动一次，并按输入顺序返回结果', async () => {
    const tasks = [
      vi.fn(async () => 'first'),
      vi.fn(async () => 'second'),
      vi.fn(async () => 'third'),
    ]

    await expect(scheduleTask(tasks)).resolves.toEqual([
      { status: 'fulfilled', value: 'first' },
      { status: 'fulfilled', value: 'second' },
      { status: 'fulfilled', value: 'third' },
    ])
    tasks.forEach(task => expect(task).toHaveBeenCalledTimes(1))
  })

  it('跨越多个时间片时仍然只启动每个任务一次', async () => {
    let nowCalls = 0
    vi.spyOn(performance, 'now').mockImplementation(() => {
      const values = [0, 0, 20]
      return values[nowCalls++ % values.length]
    })
    const tasks = Array.from({ length: 3 }, (_, index) => vi.fn(async () => index))

    await expect(scheduleTask(tasks)).resolves.toEqual([
      { status: 'fulfilled', value: 0 },
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 2 },
    ])
    tasks.forEach(task => expect(task).toHaveBeenCalledTimes(1))
  })

  it('同步抛错和异步 reject 都应该收敛为 rejected 结果', async () => {
    const syncError = new Error('sync')
    const asyncError = new Error('async')
    const tasks = [
      (() => { throw syncError }) as () => Promise<string>,
      async () => Promise.reject(asyncError),
    ]

    await expect(scheduleTask(tasks)).resolves.toEqual([
      { status: 'rejected', reason: syncError },
      { status: 'rejected', reason: asyncError },
    ])
  })

  it('needStop 应该停止启动后续任务，但等待已启动任务结束', async () => {
    let started = 0
    const tasks = Array.from({ length: 3 }, (_, index) => async () => {
      started++
      return index
    })

    await expect(scheduleTask(tasks, () => started >= 1)).resolves.toEqual([
      { status: 'fulfilled', value: 0 },
    ])
    expect(started).toBe(1)
  })

  it('needStop 抛错时应该拒绝主 Promise', async () => {
    const error = new Error('stop failed')

    await expect(scheduleTask(
      [async () => 1],
      () => { throw error },
    )).rejects.toBe(error)
  })
})
