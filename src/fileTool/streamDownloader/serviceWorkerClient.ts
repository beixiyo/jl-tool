import type { ServiceWorkerDownloadRequest, ServiceWorkerDownloadResponse } from './types'

/** 创建带逐块确认和超时清理的 Service Worker 消息客户端 */
export function createServiceWorkerDownloadClient(
  port: MessagePort,
  readyTimeoutMs: number,
  chunkTimeoutMs: number,
): ServiceWorkerDownloadClient {
  let closed = false
  let terminalError: Error | null = null
  let sequence = 0
  let writeChain = Promise.resolve()
  const acknowledgements = new Map<number, PendingAcknowledgement>()
  const ready = createPendingSignal<string>(readyTimeoutMs, 'ready', true, fail)
  const downloadStarted = createPendingSignal<void>(readyTimeoutMs, 'download start', true, fail)
  const completed = createPendingSignal<void>(chunkTimeoutMs, 'complete', false, fail)

  port.onmessage = ({ data }: MessageEvent<ServiceWorkerDownloadResponse>) => {
    if (data.type === 'ready') {
      ready.resolve(data.downloadUrl)
      return
    }
    if (data.type === 'download-started') {
      downloadStarted.resolve()
      return
    }
    if (data.type === 'chunk-accepted') {
      const pending = acknowledgements.get(data.sequence)
      if (!pending) return

      acknowledgements.delete(data.sequence)
      clearTimeout(pending.timeout)
      pending.resolve()
      return
    }
    if (data.type === 'complete') {
      completed.resolve()
      return
    }
    if (data.type === 'error') fail(new Error(data.message))
  }
  port.onmessageerror = () => fail(new Error('Stream downloader Service Worker channel failed'))
  port.start?.()

  const append = (chunk: Uint8Array): Promise<void> => {
    if (closed) return Promise.reject(terminalError ?? new Error('Stream downloader is closed'))

    const operation = writeChain.then(async () => {
      if (terminalError) throw terminalError

      const chunkSequence = sequence++
      const buffer = toTransferableBuffer(chunk)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          fail(new Error(`Stream downloader chunk ${chunkSequence} timed out after ${chunkTimeoutMs}ms`))
        }, chunkTimeoutMs)
        acknowledgements.set(chunkSequence, { resolve, reject, timeout })
        port.postMessage({ type: 'chunk', sequence: chunkSequence, chunk: buffer }, [buffer])
      })
    })
    writeChain = operation.catch(() => {})
    return operation
  }

  const complete = async (): Promise<void> => {
    if (closed) throw terminalError ?? new Error('Stream downloader is closed')

    await writeChain
    if (terminalError) throw terminalError
    closed = true
    completed.arm()
    port.postMessage({ type: 'end' } satisfies ServiceWorkerDownloadRequest)
    try {
      await completed.promise
    }
    finally {
      port.close()
    }
  }

  const abort = () => {
    if (closed) return
    closed = true
    port.postMessage({ type: 'abort' } satisfies ServiceWorkerDownloadRequest)
    fail(new Error('Stream download aborted'))
  }

  function fail(error: Error) {
    if (terminalError) return

    terminalError = error
    closed = true
    ready.reject(error)
    downloadStarted.reject(error)
    completed.reject(error)
    for (const pending of acknowledgements.values()) {
      clearTimeout(pending.timeout)
      pending.reject(error)
    }
    acknowledgements.clear()
    port.close()
  }

  return {
    ready: ready.promise,
    downloadStarted: downloadStarted.promise,
    append,
    complete,
    abort,
  }
}

function createPendingSignal<T>(
  timeoutMs: number,
  name: string,
  armed = true,
  onTimeout?: (error: Error) => void,
) {
  let resolvePromise!: (value: T) => void
  let rejectPromise!: (error: Error) => void
  let timeout: ReturnType<typeof setTimeout> | undefined
  let settled = false
  let isArmed = armed

  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  const arm = () => {
    if (timeout || settled) return
    isArmed = true
    timeout = setTimeout(() => {
      const error = new Error(`Stream downloader ${name} timed out after ${timeoutMs}ms`)
      reject(error)
      onTimeout?.(error)
    }, timeoutMs)
  }

  const resolve = (value: T) => {
    if (settled) return
    settled = true
    if (timeout) clearTimeout(timeout)
    resolvePromise(value)
  }

  const reject = (error: Error) => {
    if (settled) return
    settled = true
    if (!isArmed) return
    if (timeout) clearTimeout(timeout)
    rejectPromise(error)
  }
  if (armed) arm()

  return { promise, resolve, reject, arm }
}

function toTransferableBuffer(chunk: Uint8Array): ArrayBuffer {
  if (chunk.buffer instanceof ArrayBuffer && chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength) {
    return chunk.buffer
  }
  return chunk.slice().buffer
}

type ServiceWorkerDownloadClient = {
  ready: Promise<string>
  downloadStarted: Promise<void>
  append: (chunk: Uint8Array) => Promise<void>
  complete: () => Promise<void>
  abort: () => void
}

type PendingAcknowledgement = {
  resolve: () => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}
