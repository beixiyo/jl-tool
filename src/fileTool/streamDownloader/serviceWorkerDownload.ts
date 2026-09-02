import type {
  NormalizedDownloadOpts,
  PostServiceWorkerData,
  StreamDownloader,
  StreamDownloadServiceWorkerOptions,
} from './types'
import { STREAM_DOWNLOAD_SERVICE_WORKER_URL } from '@/browserAssetUrls'
import { randomStr } from '@/tools/tools'
import { createDownloadIframe, removeDownloadIframe } from './downloadIframe'
import { createServiceWorkerDownloadClient } from './serviceWorkerClient'

const DEFAULT_READY_TIMEOUT_MS = 10_000
const DEFAULT_CHUNK_TIMEOUT_MS = 30_000

/** 使用独立 Service Worker scope 创建带背压的流式下载。 */
export async function serviceWorkerDownload(
  filename: string,
  opts: NormalizedDownloadOpts,
): Promise<StreamDownloader> {
  if (!navigator.serviceWorker) throw new Error('Service Worker is not supported.')
  if (typeof ReadableStream === 'undefined') throw new TypeError('Stream API not supported')

  const serviceWorkerOptions = normalizeServiceWorkerOptions(opts)
  const registration = serviceWorkerOptions.registration
    ?? await navigator.serviceWorker.register(
      String(serviceWorkerOptions.scriptUrl),
      serviceWorkerOptions.registrationOptions,
    )

  const worker = await waitForActivatedServiceWorker(
    registration,
    serviceWorkerOptions.readyTimeoutMs,
  )

  const channel = new MessageChannel()
  const client = createServiceWorkerDownloadClient(
    channel.port1,
    serviceWorkerOptions.readyTimeoutMs,
    serviceWorkerOptions.chunkTimeoutMs,
  )

  const postData: PostServiceWorkerData = {
    type: 'jl-org-stream-download-init',
    filename: encodeFilename(filename),
    downloadId: randomStr() + Date.now().toString(),
    contentLength: opts.contentLength,
    mimeType: opts.mimeType,
  }
  worker.postMessage(postData, [channel.port2])

  const downloadUrl = await client.ready
  const iframe = createDownloadIframe(downloadUrl)
  try {
    await client.downloadStarted
  }
  catch (error) {
    client.abort()
    removeDownloadIframe(iframe)
    throw error
  }

  return {
    append: client.append,
    complete: async () => {
      await client.complete()
      setTimeout(() => removeDownloadIframe(iframe), 1000)
    },
    abort: async () => {
      client.abort()
      removeDownloadIframe(iframe)
    },
  }
}

function normalizeServiceWorkerOptions(
  opts: NormalizedDownloadOpts,
): NormalizedServiceWorkerOptions {
  const configured = opts.serviceWorker && typeof opts.serviceWorker === 'object'
    ? opts.serviceWorker
    : {}
  const scriptUrl = configured.scriptUrl ?? STREAM_DOWNLOAD_SERVICE_WORKER_URL

  return {
    ...configured,
    scriptUrl,
    readyTimeoutMs: configured.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS,
    chunkTimeoutMs: configured.chunkTimeoutMs ?? DEFAULT_CHUNK_TIMEOUT_MS,
  }
}

async function waitForActivatedServiceWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs: number,
): Promise<ServiceWorker> {
  /** 同一 scope 更新时 active 可能仍是旧协议，优先等待新 worker。 */
  const candidate = registration.installing ?? registration.waiting ?? registration.active
  if (!candidate) throw new Error('Stream downloader Service Worker is unavailable')
  if (candidate.state === 'activated') return candidate

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Stream downloader Service Worker activation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    const onStateChange = () => {
      if (candidate.state === 'activated') {
        cleanup()
        resolve(candidate)
      }
      else if (candidate.state === 'redundant') {
        cleanup()
        reject(new Error('Stream downloader Service Worker became redundant'))
      }
    }

    const cleanup = () => {
      clearTimeout(timeout)
      candidate.removeEventListener('statechange', onStateChange)
    }

    candidate.addEventListener('statechange', onStateChange)
    onStateChange()
  })
}

function encodeFilename(filename: string): string {
  return encodeURIComponent(filename.replace(/\//g, ':'))
    .replace(/\*/g, '%2A')
}

type NormalizedServiceWorkerOptions = StreamDownloadServiceWorkerOptions & Required<Pick<
  StreamDownloadServiceWorkerOptions,
  'readyTimeoutMs' | 'chunkTimeoutMs'
>>
