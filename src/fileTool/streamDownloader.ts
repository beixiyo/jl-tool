/**
 * 创建流式下载器
 *
 * @example
 * ```ts
 * const downloader = await createStreamDownloader('data.zip', 'application/zip')
 * downloader.append(new Uint8Array(...))
 * downloader.complete()
 * ```
 *
 * @param fileName 建议的文件名 (包含后缀, e.g., "data.zip")
 * @param mimeType 文件的MIME类型 (e.g., "application/zip")
 * @returns Promise，解析为一个包含 append, complete, abort 方法的对象。
 *          如果用户取消文件选择或API不支持且无回退，可能会reject。
 */
export async function createStreamDownloader(
  fileName: string,
  mimeType: MIMEType = 'application/octet-stream',
): Promise<StreamDownloader> {
  /** 尝试使用 File System Access API */
  if (showSaveFilePicker) {
    try {
      const fileHandle = await showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'File', // 用户在文件对话框中看到的描述
            accept: {
              [mimeType]: [`.${fileName.split('.').pop() || 'bin'}`],
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
    catch (error) {
      /** 用户可能取消了文件选择器，或者API有其他问题 */
      // AbortError 是用户取消的标准错误名
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('User cancelled the save dialog. No file will be saved.')
        return Promise.reject(error) // 或者可以返回一个空的实现
      }

      console.warn(
        'File System Access API failed, falling back to in-memory accumulation.',
        error,
      )
    }
  }

  /** 回退机制：累积 Uint8Array，完成后创建 Blob 下载 */
  console.log('Using fallback: in-memory accumulation and Blob download.')
  let accumulatedChunks: Uint8Array[] = []
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

        accumulatedChunks = []
        return
      }

      const blob = new Blob(accumulatedChunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 500)

      accumulatedChunks = []
      console.log('File download completed via Blob.')
    },
    abort: async (): Promise<void> => {
      aborted = true
      accumulatedChunks = []
      console.log('File download aborted (fallback method).')
    },
  }
}

export interface StreamDownloader {
  append: (chunk: Uint8Array) => Promise<void>
  complete: () => Promise<void>
  abort: () => Promise<void>
}
