/**
 * 浏览器运行时单独加载的脚本资源 URL
 *
 * 此文件必须位于 src 根目录，使源码与扁平化后的 dist/index 产物使用相同相对路径
 */

export const STREAM_DOWNLOAD_SERVICE_WORKER_URL = new URL('./sw/streamDownload.js?no-inline', import.meta.url)

export const PCM_CAPTURE_AUDIO_WORKLET_URL = new URL('./worklet/pcmCapture.js?no-inline', import.meta.url)
