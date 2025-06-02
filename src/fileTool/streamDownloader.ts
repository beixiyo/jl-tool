import type { PartRequired } from '@jl-org/ts-tool'
import { randomStr, uniqueId } from '@/tools/tools'
import { downloadByData } from './tools'

const iframeIds: string[] = []

/**
 * 创建流式下载器，使用 Service Worker 或 File System Access API 进行流式下载。
 * 如果没有传递 `swPath`，则使用 File System Access API 进行下载。
 * 如果不支持 File System Access API，则用原始的 a 标签下载。
 *
 * @example
 * ```ts
 * const downloader = await createStreamDownloader('data.zip', { swPath: '/sw.js' })
 * downloader.append(...)
 * downloader.complete()
 * ```
 */
export async function createStreamDownloader(
  fileName: string,
  opts: StreamDownloadOpts = {},
): Promise<StreamDownloader> {
  const formatOpts: ServiceWorkerDownloadOpts = {
    mimeType: 'application/octet-stream',
    ...opts,
  }

  if (opts.swPath) {
    try {
      const data = await serviceWorkerDownload(fileName, {
        ...formatOpts,
        ...opts,
      } as any)

      if (data === false) {
        throw new Error('Service Worker failed to download.')
      }

      return data
    }
    catch (error) {
      console.warn(error)
      return otherDownload()
    }
  }

  return otherDownload()

  function otherDownload() {
    // @ts-ignore
    if (typeof showSaveFilePicker !== 'undefined') {
      return filePickerDownload(fileName, formatOpts)
    }

    console.warn('File System Access API not supported, falling back to in-memory accumulation and Blob download.')
    return blobDonwload(fileName, formatOpts)
  }
}

/** 尝试使用 File System Access API */
async function filePickerDownload(
  filename: string,
  opts: Required<DownloaderOpts>,
): Promise<StreamDownloader> {
  try {
    const fileHandle = await showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'File', // 用户在文件对话框中看到的描述
          accept: {
            [opts.mimeType]: [`.${filename.split('.').pop() || 'bin'}`],
          },
        },
      ],
    })

    const writableStream = await fileHandle.createWritable()
    console.log('Using File System Access API for streaming download.')

    return {
      append: async (chunk: Uint8Array): Promise<void> => {
        await writableStream.write(chunk)
      },
      complete: async (): Promise<void> => {
        await writableStream.close()
        console.log('File download completed via File System Access API.')
      },
      abort: async (): Promise<void> => {
        await writableStream.abort()
        console.log('File download aborted via File System Access API.')
      },
    }
  }
  /** 用户可能取消了文件选择器，或者API有其他问题 */
  catch (error) {
    // AbortError 是用户取消的标准错误名
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('User cancelled the save dialog. No file will be saved.')
    }

    console.warn(
      'File System Access API failed, falling back to in-memory accumulation.',
      error,
    )

    return Promise.reject(error)
  }
}

/** 回退机制：累积 Uint8Array，完成后创建 Blob 下载 */
async function blobDonwload(
  filename: string,
  opts: Required<DownloaderOpts>,
): Promise<StreamDownloader> {
  console.log('Using fallback: in-memory accumulation and Blob download.')
  const accumulatedChunks: Uint8Array[] = []
  let aborted = false

  return {
    append: async (chunk: Uint8Array): Promise<void> => {
      if (aborted)
        return
      accumulatedChunks.push(chunk)
    },
    complete: async (): Promise<void> => {
      if (aborted || accumulatedChunks.length === 0) {
        if (!aborted)
          console.log('No data to download or download was aborted.')

        accumulatedChunks.splice(0)
        return
      }

      const blob = new Blob(accumulatedChunks, { type: opts.mimeType })
      downloadByData(blob, filename, { mimeType: opts.mimeType })

      accumulatedChunks.splice(0)
      console.log('File download completed via Blob.')
    },
    abort: async (): Promise<void> => {
      aborted = true
      accumulatedChunks.splice(0)
      console.log('File download aborted (fallback method).')
    },
  }
}

/** Service Worker 下载 */
async function serviceWorkerDownload(
  filename: string,
  opts: PartRequired<ServiceWorkerDownloadOpts, 'swPath'>,
): Promise<StreamDownloader | false> {
  if (!navigator.serviceWorker) {
    throw new Error('Service Worker is not supported.')
  }
  if (typeof ReadableStream === 'undefined') {
    throw new TypeError('Stream API not supported')
  }

  let isRegistered = false

  if (navigator.serviceWorker.controller) {
    isRegistered = true
    console.log('Service Worker already controlling the page')
  }
  else {
    await navigator.serviceWorker.register(opts.swPath, {
      scope: '/',
    })
  }

  /**
   * 等待 Service Worker 准备好 (active 且 controlling)
   * 会等到 SW 激活并且控制当前页面
   * 如果 SW 中使用了 clients.claim()，这个过程会更快
   */
  const controllerPromise = isRegistered
    ? Promise.resolve()
    : new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
    })
  await Promise.all([
    navigator.serviceWorker.ready,
    controllerPromise,
  ])

  if (!navigator.serviceWorker.controller) {
    return false
  }

  const downloadId = randomStr() + Date.now().toString()
  const channel = new MessageChannel()
  filename = encodeURIComponent(filename.replace(/\//g, ':'))
    .replace(/\*/g, '%2A')

  const {
    contentLength,
    mimeType,
  } = opts
  const postData: PostServiceWorkerData = {
    filename,
    downloadId,
    contentLength,
    mimeType,
  }

  /** 发送端口给 Service Worker */
  navigator.serviceWorker.controller.postMessage(
    postData,
    [channel.port2],
  )

  let downloadUrl = ''
  let iframeId = ''

  return new Promise((resolve) => {
    channel.port1.onmessage = (event) => {
      downloadUrl = event.data.downloadUrl
      iframeId = `${downloadUrl}-${uniqueId()}`
      downloadByIframe(downloadUrl, iframeId)
    }

    resolve({
      append: async (chunk: Uint8Array): Promise<void> => {
        return channel.port1.postMessage(chunk, {
          transfer: [chunk.buffer],
        })
      },
      complete: async (): Promise<void> => {
        const action: PostAction = 'end'
        rmIframeById(iframeId)
        return channel.port1.postMessage(action)
      },
      abort: async (): Promise<void> => {
        const action: PostAction = 'abort'
        return channel.port1.postMessage(action)
      },
    })
  })
}

function downloadByIframe(src: string, id: string) {
  const iframe = document.createElement('iframe')

  iframe.hidden = true
  Object.assign(iframe.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
  })

  iframe.id = id
  iframeIds.push(id)

  iframe.src = src
  document.body.appendChild(iframe)

  return iframe
}

function rmIframeById(id: string) {
  if (!iframeIds.includes(id)) {
    return
  }

  const iframe = document.getElementById(id)
  iframe?.remove()
  iframeIds.splice(iframeIds.indexOf(id), 1)
}

export interface StreamDownloader {
  append: (chunk: Uint8Array) => Promise<void>
  complete: () => Promise<void>
  abort: () => Promise<void>
}

type DownloaderOpts = {
  /**
   * @default 'application/octet-stream'
   */
  mimeType?: MIMEType
}

export type StreamDownloadOpts = DownloaderOpts & {
  /**
   * Service Worker 文件路径，如果传入，则使用 Service Worker 下载
   */
  swPath?: string
  /**
   * 文件大小，单位字节
   */
  contentLength?: number
}

type ServiceWorkerDownloadOpts = PartRequired<StreamDownloadOpts, 'mimeType'>

export type PostAction = 'abort' | 'end' | Uint8Array

export type PostServiceWorkerData = {
  filename: string
  downloadId: string
  contentLength?: number
  mimeType: MIMEType
}

export type MIMEType = `${string}/${string}`
