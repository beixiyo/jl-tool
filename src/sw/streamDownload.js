self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const downloadMap = new Map()

/**
 * 接收消息并返回文件 URL
 */
self.addEventListener('message', (event) => {
  const { filename, downloadId } = event.data
  const port = event.ports[0]

  /** 生成下载URL */
  const downloadUrl = `${self.registration.scope}download/${downloadId}/${filename}`

  /** 创建流 */
  const stream = new ReadableStream({
    start(controller) {
      port.onmessage = ({ data }) => {
        if (data === 'end') {
          return controller.close()
        }
        if (data === 'abort') {
          controller.error('Download aborted')
          return
        }
        controller.enqueue(data)
      }
    },
  })

  downloadMap.set(downloadUrl, { stream, filename })
  port.postMessage({ downloadUrl })
})

/**
 * 拦截下载请求并实时下载
 */
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  if (downloadMap.has(url)) {
    const downloadData = downloadMap.get(url)
    if (downloadData) {
      downloadMap.delete(url)

      const headers = new Headers({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${downloadData.filename}"`,
      })

      event.respondWith(new Response(downloadData.stream, { headers }))
    }
  }
})
