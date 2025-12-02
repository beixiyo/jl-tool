import { downloadByData } from '@/fileTool/tools'
import { extFromMime } from './mime'

/**
 * 播放工具
 */
export async function play(url: string) {
  const audio = new Audio(url)
  await audio.play()
}

/**
 * 下载工具：按 MIME 自动追加扩展名
 */
export async function download(blob: Blob, baseName: string, mimeType: string) {
  let name = baseName || new Date().toISOString().replace(/[:.]/g, '-')
  const ext = extFromMime(mimeType)
  if (ext && !name.toLowerCase().endsWith(`.${ext}`)) {
    name = `${name}.${ext}`
  }
  await downloadByData(blob, name, { mimeType })
}
