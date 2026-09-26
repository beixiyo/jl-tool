/** 录制配置合并、有效录制时钟与 MediaRecorder 最终输出处理 */

/** 原生配置或基于默认值生成完整配置的函数；对象形式浅合并，函数返回值完整替换 */
export type MediaOptions<T> = T | (T & Record<string, unknown>) | ((defaults: Readonly<T>) => T)

/** 原生 MediaRecorder 选项，允许透传当前 TS DOM 尚未声明的浏览器扩展 */
export type NativeRecorderOptions = MediaRecorderOptions & {
  audioBitrateMode?: 'constant' | 'variable'
  videoKeyFrameIntervalDuration?: number
  videoKeyFrameIntervalCount?: number
}

/** 合并原生配置；回调只处理配置值，不接管资源 */
export function resolveMediaOptions<T extends object>(defaults: T, options?: MediaOptions<T>): T {
  return typeof options === 'function'
    ? options(defaults)
    : { ...defaults, ...options }
}

/** 一轮录制完成后的输出；流式关闭缓存时 blob 为 null */
export interface RecordingResult {
  blob: Blob | null
  /** 有效录制时长（毫秒），不含暂停时间 */
  durationMs: number
  mimeType: string
}

/** 最终文件处理上下文；只提供数据，不转移采集资源的生命周期 */
export interface RecordingFinalizeContext {
  /** 全部原始分片汇总后的完整文件 */
  blob: Blob
  /** 有效录制时长，单位毫秒，不含暂停 */
  durationMs: number
}

/**
 * 可选的最终文件处理器；返回保持原 MIME 的 Blob，支持异步
 * 库不内置容器解析或时长修复。需要 WebM Duration 时，由应用自行安装
 * `@fix-webm-duration/fix` 并注入适配器；非 WebM 应直接返回原 Blob
 * 抛错/拒绝会使 stop() 拒绝并通知 onError；retainChunks=false 或无分片时不调用
 * @example
 * ```ts
 * // 应用自行安装，jl-tool 不依赖此包：
 * import { fixWebmDuration } from '@fix-webm-duration/fix'
 * const finalizeBlob: RecordingFinalizer = ({ blob, durationMs }) => {
 *   if (!/^(audio|video)\/webm(?:;|$)/i.test(blob.type) || durationMs <= 0)
 *     return blob
 *   return fixWebmDuration(blob, durationMs, { logger: false })
 * }
 * // new Recorder({ finalizeBlob })；AudioLaneRecorder / ScreenRecorder 同样适用
 * ```
 */
export type RecordingFinalizer = (context: Readonly<RecordingFinalizeContext>) => Blob | Promise<Blob>

/** 最终文件处理选项 */
export interface FinalizeRecordingOptions extends RecordingFinalizeContext {
  /** 可选处理器，参见 {@link RecordingFinalizer} 的外部 WebM 修复示例。@default undefined（原样输出） */
  finalizeBlob?: RecordingFinalizer
}

/** 调用外部最终文件处理器；默认原样返回。错误直接向调用方传播 */
export async function finalizeRecording(options: FinalizeRecordingOptions): Promise<Blob> {
  const { blob, durationMs, finalizeBlob } = options
  return finalizeBlob
    ? finalizeBlob({ blob, durationMs })
    : blob
}

/** 内部单调时钟；调用原生 start/pause/resume/stop 成功后同步更新，避免事件队列延迟 */
export class RecordingClock {
  private elapsed = 0
  private startedAt: number | null = null
  constructor(private readonly now: () => number = () => performance.now()) {}

  start(): void {
    this.elapsed = 0
    this.startedAt = this.now()
  }

  pause(): void {
    if (this.startedAt === null) return
    this.elapsed += Math.max(0, this.now() - this.startedAt)
    this.startedAt = null
  }

  resume(): void {
    if (this.startedAt === null) this.startedAt = this.now()
  }

  get durationMs(): number {
    return this.elapsed + (this.startedAt === null
      ? 0
      : Math.max(0, this.now() - this.startedAt))
  }
}
