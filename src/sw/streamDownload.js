// @ts-check

self.addEventListener('install', (event) => {
  console.log('StreamDownloader SW installed')
  // @ts-ignore
  event.waitUntil(self.skipWaiting()) // 强制立即激活
})

self.addEventListener('activate', (event) => {
  console.log('StreamDownloader SW activated')
  // @ts-ignore
  event.waitUntil(self.clients.claim()) // 立即控制所有页面
})

/**
 * @type {Map<string, { stream: ReadableStream, data: PostServiceWorkerData }>}
 */
const downloadMap = new Map()

/**
 * 接收消息并返回文件 URL
 */
self.addEventListener('message', (event) => {
  /** @type {PostServiceWorkerData} */
  const data = event.data
  const port = event.ports[0]

  // @ts-ignore
  const scope = self.registration.scope
  const downloadUrl = `${scope}jl-org-download/${data.downloadId}/${data.filename}`

  /** 创建流 */
  const stream = new ReadableStream({
    start(controller) {
      port.onmessage = (event) => {
        /**
         * @type {PostAction}
         */
        const data = event.data
        if (data === 'end') {
          controller.close()
        }
        else if (data === 'abort') {
          onError('Download aborted')
        }
        else {
          controller.enqueue(data)
        }
      }

      port.onmessageerror = () => {
        onError('Channel error')
      }

      /**
       * @param {string} msg
       */
      function onError(msg) {
        controller.error(msg)
        controller.close()
        downloadMap.delete(downloadUrl)
      }
    },
  })

  downloadMap.set(downloadUrl, { stream, data })
  port.postMessage({ downloadUrl })
})

/**
 * 拦截下载请求并实时下载
 */
self.addEventListener('fetch', (event) => {
  // @ts-ignore
  const url = event.request.url
  if (!downloadMap.has(url)) {
    return
  }

  const downloadData = downloadMap.get(url)
  if (downloadData) {
    downloadMap.delete(url)
    const { data } = downloadData

    const headerData = {
      'Content-Type': data.mimeType,
      'Content-Disposition': `attachment; filename="${data.filename}"`,
    }
    if (data.contentLength) {
      headerData['Content-Length'] = data.contentLength
    }
    const headers = new Headers(headerData)

    // @ts-ignore
    event.respondWith(new Response(downloadData.stream, { headers }))
  }
})

/**
 * @typedef {import('../fileTool/streamDownloader').PostAction} PostAction
 */

/**
 * @typedef {import('../fileTool/streamDownloader').PostServiceWorkerData} PostServiceWorkerData
 */
