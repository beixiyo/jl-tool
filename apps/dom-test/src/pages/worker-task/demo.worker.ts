/** Worker 端分阶段计算与业务事件发送。 */
import { defineWorkerTask } from '@/tools/workerTask'
import type { DemoEvent, DemoInput, DemoResult } from './demo.types'

defineWorkerTask<DemoInput, DemoResult, DemoEvent>(async (input, { index, emit }) => {
  let checksum = index + 1
  for (let stage = 1; stage <= 3; stage++) {
    await new Promise<void>((resolve) => setTimeout(resolve, input.delay / 3))
    for (let i = 0; i < 5000; i++) checksum = (checksum * 31 + i) % 1000003
    emit({ stage, totalStages: 3 })
    if (input.fail && stage === 2) throw new Error(`任务 ${index} 的模拟失败`)
  }
  return { index, checksum, delay: input.delay }
})
