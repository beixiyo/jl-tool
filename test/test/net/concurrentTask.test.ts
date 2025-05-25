import { describe, expect, it, vi } from 'vitest'
import { concurrentTask } from '@/net'
import { createFailingTask, createSuccessfulTask } from './tool'

describe('concurrentTask', () => {
  it('should run all tasks successfully with enough concurrency', async () => {
    const tasks = [
      createSuccessfulTask('task1', 50),
      createSuccessfulTask('task2', 20),
      createSuccessfulTask('task3', 30),
    ]
    const results = await concurrentTask(tasks, 3)
    expect(results).toHaveLength(3)
    expect(results[0]).toEqual({ status: 'fulfilled', value: 'task1' })
    expect(results[1]).toEqual({ status: 'fulfilled', value: 'task2' })
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'task3' })
    tasks.forEach(task => expect(task).toHaveBeenCalledTimes(1))
  })

  it('should limit concurrency', async () => {
    let concurrentExecutions = 0
    let maxConcurrent = 0
    const tasks = new Array(5).fill(0).map((_, i) =>
      vi.fn(async () => {
        concurrentExecutions++
        maxConcurrent = Math.max(maxConcurrent, concurrentExecutions)

        await new Promise(r => setTimeout(r, 50 + i * 10)) // Varying delays
        concurrentExecutions--
        return `task${i}`
      }),
    )

    await concurrentTask(tasks, 2) // Max concurrency 2
    expect(maxConcurrent).toBe(2)
    tasks.forEach(task => expect(task).toHaveBeenCalledTimes(1))
  })

  it('should handle an empty task list', async () => {
    const results = await concurrentTask([])
    expect(results).toEqual([])
  })

  it('should return results in the original order', async () => {
    // Tasks complete in a different order than they are started
    const tasks = [
      createSuccessfulTask('task1 (slow)', 100), // finishes last
      createSuccessfulTask('task2 (fast)', 10), // finishes first
      createSuccessfulTask('task3 (medium)', 50), // finishes second
    ]
    const results = await concurrentTask(tasks, 3)
    expect(results.map(r => (r as { value: string }).value)).toEqual([
      'task1 (slow)',
      'task2 (fast)',
      'task3 (medium)',
    ])
  })

  it('should handle tasks that reject', async () => {
    const tasks = [
      createSuccessfulTask('success1'),
      createFailingTask('failure1'),
      createSuccessfulTask('success2'),
      createFailingTask('failure2'),
    ]
    const results = await concurrentTask(tasks, 2)
    expect(results).toHaveLength(4)

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'success1' })
    expect(results[1].status).toBe('rejected')

    expect((results[1] as { reason: Error }).reason.message).toBe('failure1')
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'success2' })

    expect(results[3].status).toBe('rejected')
    expect((results[3])).toEqual({ status: 'rejected', reason: new Error('failure2') })
  })

  it('should handle more tasks than concurrency limit', async () => {
    const taskCount = 10
    const tasks = new Array(taskCount).fill(0).map((_, i) => createSuccessfulTask(`val${i}`, 10))
    const results = await concurrentTask(tasks, 3)
    expect(results).toHaveLength(taskCount)
    results.forEach((result, i) => {
      expect(result.status).toBe('fulfilled')
      expect((result as { value: string }).value).toBe(`val${i}`)
    })
  })

  it('should work correctly when maxConcurrency is 1', async () => {
    const executionOrder: string[] = []
    const tasks = [
      vi.fn(async () => { executionOrder.push('task1 start'); await new Promise(r => setTimeout(r, 30)); executionOrder.push('task1 end'); return 'task1' }),
      vi.fn(async () => { executionOrder.push('task2 start'); await new Promise(r => setTimeout(r, 10)); executionOrder.push('task2 end'); return 'task2' }),
    ]
    await concurrentTask(tasks, 1)
    expect(executionOrder).toEqual(['task1 start', 'task1 end', 'task2 start', 'task2 end'])
  })

  it('should handle tasks that resolve with undefined', async () => {
    const tasks = [createSuccessfulTask<undefined>(undefined)]
    const results = await concurrentTask(tasks, 1)
    expect(results[0]).toEqual({ status: 'fulfilled', value: undefined })
  })
})
