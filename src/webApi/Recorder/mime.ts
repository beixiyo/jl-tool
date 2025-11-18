/**
 * MIME 与扩展名映射
 */

const map: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/webm;codecs=opus': 'webm',
  'audio/ogg': 'ogg',
  'audio/ogg;codecs=opus': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mp4;codecs=mp4a.40.2': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
}

/**
 * 根据 MIME 获取扩展名
 */
export function extFromMime(mime: string) {
  const key = mime.toLowerCase()
  return map[key] || ''
}
