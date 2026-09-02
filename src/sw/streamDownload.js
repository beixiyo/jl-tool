// @ts-check

self.addEventListener('install', (event) => {
  // @ts-ignore
  event.waitUntil(self.skipWaiting())
})

/**
 * 下载任务按最终请求 URL 隔离；SW 只拦截自己 scope 下的临时下载地址
 * @type {Map<string, { stream: ReadableStream, data: PostServiceWorkerData, port: MessagePort }>}
 */
const downloadMap = new Map()

self.addEventListener('message', (event) => {
  /** @type {PostServiceWorkerData} */
  const data = event.data
  if (data?.type !== 'jl-org-stream-download-init') return

  const port = event.ports[0]
  if (!port) return

  // @ts-ignore
  const scope = self.registration.scope
  const downloadUrl = `${scope}${data.downloadId}/${data.filename}`
  /** @type {{ sequence: number, chunk: ArrayBuffer } | null} */
  let pendingChunk = null
  let endRequested = false
  let settled = false

  const stream = new ReadableStream({
    start(controller) {
      port.onmessage = ({ data: request }) => {
        /** @type {ServiceWorkerDownloadRequest} */
        const message = request
        if (message.type === 'chunk') {
          if (pendingChunk) {
            fail(controller, 'Received a chunk before the previous chunk was consumed')
            return
          }
          pendingChunk = message
          drain(controller)
          return
        }
        if (message.type === 'end') {
          endRequested = true
          drain(controller)
          return
        }
        if (message.type === 'abort') abort(controller)
      }
      port.onmessageerror = () => fail(controller, 'Stream downloader channel failed')
    },
    pull(controller) {
      drain(controller)
    },
    cancel() {
      cleanup()
    },
  })

  downloadMap.set(downloadUrl, { stream, data, port })
  port.postMessage({ type: 'ready', downloadUrl })

  /** @param {ReadableStreamDefaultController} controller */
  function drain(controller) {
    if (settled) return
    if (pendingChunk && (controller.desiredSize ?? 0) > 0) {
      const { sequence, chunk } = pendingChunk
      pendingChunk = null
      controller.enqueue(new Uint8Array(chunk))
      port.postMessage({ type: 'chunk-accepted', sequence })
    }

    if (endRequested && !pendingChunk) {
      settled = true
      controller.close()
      port.postMessage({ type: 'complete' })
      cleanup()
    }
  }

  /** @param {ReadableStreamDefaultController} controller */
  function abort(controller) {
    if (settled) return
    settled = true
    controller.error(new Error('Stream download aborted'))
    cleanup()
  }

  /** @param {ReadableStreamDefaultController} controller @param {string} message */
  function fail(controller, message) {
    if (settled) return
    settled = true
    controller.error(new Error(message))
    port.postMessage({ type: 'error', message })
    cleanup()
  }

  function cleanup() {
    downloadMap.delete(downloadUrl)
    port.close()
  }
})

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  const url = event.request.url
  const download = downloadMap.get(url)
  if (!download) return

  downloadMap.delete(url)
  download.port.postMessage({ type: 'download-started' })
  const headers = new Headers({
    'Content-Type': download.data.mimeType,
    'Content-Disposition': `attachment; filename="${download.data.filename}"`,
    ...(download.data.contentLength
      ? { 'Content-Length': String(download.data.contentLength) }
      : {}),
  })

  // @ts-ignore
  event.respondWith(new Response(download.stream, { headers }))
})

/** @typedef {import('../fileTool/streamDownloader').ServiceWorkerDownloadRequest} ServiceWorkerDownloadRequest */
/** @typedef {import('../fileTool/streamDownloader').ServiceWorkerDownloadResponse} ServiceWorkerDownloadResponse */
/** @typedef {import('../fileTool/streamDownloader').PostServiceWorkerData} PostServiceWorkerData */
