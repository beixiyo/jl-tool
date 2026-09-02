import type { NormalizedDownloadOpts, StreamDownloader } from './types'
import { downloadByData } from '../tools'

/** 在内存中累积数据块，完成后通过 Blob 下载 */
export async function blobDownload(
  filename: string,
  opts: NormalizedDownloadOpts,
): Promise<StreamDownloader> {
  console.warn('Using fallback: in-memory accumulation and Blob download.')
  const accumulatedChunks: Uint8Array[] = []
  let aborted = false

  return {
    append: async (chunk) => {
      if (aborted) return
      accumulatedChunks.push(chunk)
    },
    complete: async () => {
      if (aborted || accumulatedChunks.length === 0) {
        if (!aborted) console.warn('No data to download or download was aborted.')
        accumulatedChunks.splice(0)
        return
      }

      const blob = new Blob(accumulatedChunks, { type: opts.mimeType })
      downloadByData(blob, filename, { mimeType: opts.mimeType })
      accumulatedChunks.splice(0)
      console.warn('File download completed via Blob.')
    },
    abort: async () => {
      aborted = true
      accumulatedChunks.splice(0)
      console.warn('File download aborted (fallback method).')
    },
  }
}
