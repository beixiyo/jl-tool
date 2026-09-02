import type { MIMEType } from '@/types'

/** 分块写入的流式下载器。 */
export interface StreamDownloader {
  /**
   * 写入一个数据块；Service Worker 模式会在下游允许继续写入后才完成
   * 传入的 Uint8Array 可能被 transferable 转移，调用后不应继续复用
   */
  append: (chunk: Uint8Array) => Promise<void>
  /** 完成下载并释放相关资源。 */
  complete: () => Promise<void>
  /** 中止下载并释放相关资源。 */
  abort: () => Promise<void>
}

/** 流式下载选项。 */
export type StreamDownloadOpts = {
  /**
   * 下载内容的 MIME 类型
   * @default 'application/octet-stream'
   */
  mimeType?: MIMEType
  /**
   * Service Worker 流式下载配置；默认使用包内置 Worker，配置对象可以覆盖注册行为
   * `false` 时改用 File System Access API，并在不支持时回退到 Blob 下载
   * @default true
   */
  serviceWorker?: false | StreamDownloadServiceWorkerOptions
  /** 文件大小，单位字节。 */
  contentLength?: number
}

/** Service Worker 流式下载配置。 */
export type StreamDownloadServiceWorkerOptions = {
  /** 自定义同源 Service Worker URL；默认使用包内置 Worker */
  scriptUrl?: string | URL
  /** 复用或注入确定的 registration，避免与宿主页面的 controller 耦合 */
  registration?: ServiceWorkerRegistration
  /** 注册选项；默认不扩大 scope，使用脚本所在目录 */
  registrationOptions?: RegistrationOptions
  /**
   * 等待激活和首次握手的超时
   * @default 10000
   */
  readyTimeoutMs?: number
  /**
   * 等待单块背压确认或完成确认的超时
   * @default 30000
   */
  chunkTimeoutMs?: number
}

/** 页面发送给下载 Service Worker 的请求 */
export type ServiceWorkerDownloadRequest =
  | { type: 'chunk', sequence: number, chunk: ArrayBuffer }
  | { type: 'end' }
  | { type: 'abort' }

/** 下载 Service Worker 返回给页面的响应 */
export type ServiceWorkerDownloadResponse =
  | { type: 'ready', downloadUrl: string }
  | { type: 'download-started' }
  | { type: 'chunk-accepted', sequence: number }
  | { type: 'complete' }
  | { type: 'error', message: string }

/** 初始化 Service Worker 下载任务的数据 */
export type PostServiceWorkerData = {
  type: 'jl-org-stream-download-init'
  filename: string
  downloadId: string
  contentLength?: number
  mimeType: MIMEType
}

export type NormalizedDownloadOpts = Required<Pick<StreamDownloadOpts, 'mimeType'>> & StreamDownloadOpts
