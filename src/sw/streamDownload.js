self.addEventListener('install', (event) => {
  console.log('StreamDownloader SW installed')
  event.waitUntil(self.skipWaiting()) // 强制立即激活
})

self.addEventListener('activate', (event) => {
  console.log('StreamDownloader SW activated')
  event.waitUntil(self.clients.claim()) // 立即控制所有页面
})

const downloadMap = new Map()

/**
 * 接收消息并返回文件 URL
 */
self.addEventListener('message', (event) => {
  const { filename, downloadId } = event.data
  const port = event.ports[0]

  /** 生成下载URL */
  const downloadUrl = `${self.registration.scope}jl-org-download/${downloadId}/${filename}`

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

      function onError(msg) {
        controller.error(msg)
        controller.close()
        downloadMap.delete(url)
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

  if (!downloadMap.has(url)) {
    return
  }

  const downloadData = downloadMap.get(url)
  if (downloadData) {
    downloadMap.delete(url)

    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${downloadData.filename}"`,
    })

    event.respondWith(new Response(downloadData.stream, { headers }))
  }
})

/**
 * @typedef {import('../fileTool/streamDownloader').PostAction} PostAction
 */
