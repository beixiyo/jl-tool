import { concurrentTask } from '@/net'

/**
 * 图片资源预加载
 */
export function preloadImgs(
  srcs: string[],
  opts: PreloadOpts = {},
) {
  const {
    timeout = 10000,
    preloadType = 'preload',
    concurrentCount = 3,
  } = opts

  return concurrentTask(
    srcs.map(src => () => loadLink(src)),
    concurrentCount,
  )

  function loadLink(src: string) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = preloadType
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)

      link.onload = resolve
      link.onerror = reject

      setTimeout(reject, timeout)
    })
  }
}

export type PreloadType = 'preload' | 'prefetch'
export type PreloadOpts = {
  /**
   * 超时时间，毫秒
   * @default 10000
   */
  timeout?: number
  /**
   * 预加载类型
   * @default preload
   */
  preloadType?: PreloadType

  /**
   * 并发数量
   * @default 3
   */
  concurrentCount?: number
}
