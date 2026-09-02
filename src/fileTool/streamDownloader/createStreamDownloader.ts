import type { NormalizedDownloadOpts, StreamDownloader, StreamDownloadOpts } from './types'
import { blobDownload } from './blobDownload'
import { filePickerDownload } from './filePickerDownload'
import { serviceWorkerDownload } from './serviceWorkerDownload'

/**
 * 创建流式下载器，使用 Service Worker 或 File System Access API 进行流式下载
 * 默认使用包内置 Service Worker；传入 `serviceWorker: false` 时使用 File System Access API
 * 如果不支持 File System Access API，则回退到 Blob 下载
 *
 * @example
 * ```ts
 * const downloader = await createStreamDownloader('data.zip')
 * await downloader.append(chunk)
 * await downloader.complete()
 * ```
 */
export async function createStreamDownloader(
  fileName: string,
  opts: StreamDownloadOpts = {},
): Promise<StreamDownloader> {
  const normalizedOpts: NormalizedDownloadOpts = {
    mimeType: 'application/octet-stream',
    ...opts,
  }

  if (opts.serviceWorker !== false) {
    try {
      return await serviceWorkerDownload(fileName, normalizedOpts)
    }
    catch (error) {
      console.warn(error)
    }
  }

  return otherDownload(fileName, normalizedOpts)
}

function otherDownload(
  fileName: string,
  opts: NormalizedDownloadOpts,
): Promise<StreamDownloader> {
  if (typeof showSaveFilePicker !== 'undefined') {
    return filePickerDownload(fileName, opts)
  }

  console.warn('File System Access API not supported, falling back to in-memory accumulation and Blob download.')
  return blobDownload(fileName, opts)
}
