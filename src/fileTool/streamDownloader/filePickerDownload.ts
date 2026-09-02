import type { NormalizedDownloadOpts, StreamDownloader } from './types'

/** 使用 File System Access API 将数据块直接写入用户选择的文件 */
export async function filePickerDownload(
  filename: string,
  opts: NormalizedDownloadOpts,
): Promise<StreamDownloader> {
  try {
    const fileHandle = await showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'File',
          accept: {
            [opts.mimeType]: [`.${filename.split('.').pop() || 'bin'}`],
          },
        },
      ],
    })
    const writableStream = await fileHandle.createWritable()
    console.warn('Using File System Access API for streaming download.')

    return {
      append: async (chunk) => {
        await writableStream.write(chunk)
      },
      complete: async () => {
        await writableStream.close()
        console.warn('File download completed via File System Access API.')
      },
      abort: async () => {
        await writableStream.abort()
        console.warn('File download aborted via File System Access API.')
      },
    }
  }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('User cancelled the save dialog. No file will be saved.')
    }

    console.warn(
      'File System Access API failed, falling back to in-memory accumulation.',
      error,
    )
    throw error
  }
}
