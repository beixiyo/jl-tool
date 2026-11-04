# Worker 任务控制器

`createWorkerTask` 负责调度和生命周期，`defineWorkerTask` 在 Worker 中把普通函数接入协议

## item 与 event 的区别

| 订阅 | 谁触发 | 代表什么 |
| --- | --- | --- |
| `on('item', ...)` | 库自动触发 | 某项成功返回，结果已写入最终数组；每项一次 |
| `on('event', ...)` | Worker 函数调用 `emit` | 自定义进度、日志、中间产物；每项可以零次或多次，不代表完成 |
| `on('progress', ...)` | 库自动触发 | 已完成项数 / 总项数，不是单项内部进度 |


## 示例

示例中的导入均来自包公共入口。Worker 必须为独立模块，由 Vite 等构建工具处理其 URL；不要将处理函数从主线程序列化后发送

共享类型 `hash.types.ts`：

```ts
export interface HashInput {
  file: File
}

export interface HashResult {
  hash: string
}

export type HashEvent = { type: 'progress', loaded: number }
```

Worker 入口 `hash.worker.ts`：

```ts
import type { HashEvent, HashInput, HashResult } from './hash.types'
import { defineWorkerTask } from '@jl-org/tool'
import { calculateHash } from './calculateHash'

defineWorkerTask<HashInput, HashResult, HashEvent>(async ({ file }, { emit }) => {
  const hash = await calculateHash(file, {
    onProgress: (loaded: number) => emit({ type: 'progress', loaded }),
  })

  return { hash }
})
```

主线程：

```ts
import type { HashEvent, HashInput, HashResult } from './hash.types'
import { createWorkerTask } from '@jl-org/tool'

const task = createWorkerTask<HashInput, HashResult, HashEvent>({
  totalItems: files.length,
  concurrency: 4,

  createWorker: () => new Worker(new URL('./hash.worker.ts', import.meta.url), {
    type: 'module',
  }),

  createTask: ({ index }) => ({ data: { file: files[index] } }),
})

const unsubscribe = task.on('item', ({ index, value }) => {
  console.log('该项完成', index, value.hash)
})

task.on('event', ({ index, event }) => {
  console.log('业务进度', index, event.loaded)
})

task.on('progress', ({ completed, total, progress }) => {
  console.log('整体完成比例', completed, total, progress)
})

try {
  const results = await task.start()
  console.log('输入顺序的结果', results)
}
catch (error) {
  console.error('失败或取消', error)
}
finally {
  unsubscribe()
}

// 例如在取消按钮的处理函数中调用 task.cancel()
```
