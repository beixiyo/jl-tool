/** 通过屏幕共享只拿声音：标签页声音 / 系统声音，拿到后立即丢弃视频 */

import type {
  DisplayAudioEnvironment,
  DisplayAudioFailure,
  DisplayAudioResult,
  DisplayAudioSurface,
  RequestDisplayAudioOptions,
} from './types'

const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  /** 共享来的是对方的声音，不能被当成近端语音做处理 */
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
}

/**
 * 当前浏览器是否可能从屏幕共享里拿到声音
 *
 * Firefox / Safari 的 getDisplayMedia 从不返回音轨；这里用只有 Chromium 暴露的
 * `suppressLocalAudioPlayback` 约束做能力检测，不嗅探 UA
 * 返回 true 只代表「可能」：用户可以不勾选音频，macOS 上还受浏览器与系统版本限制，
 * 最终以 {@link requestDisplayAudio} 结果里的 `hasAudio` 为准
 */
export function isDisplayAudioSupported(environment: DisplayAudioEnvironment = {}): boolean {
  const mediaDevices = environment.mediaDevices ?? globalThis.navigator?.mediaDevices
  if (typeof mediaDevices?.getDisplayMedia !== 'function') return false

  const supported = mediaDevices.getSupportedConstraints?.() as (MediaTrackSupportedConstraints & {
    suppressLocalAudioPlayback?: boolean
  }) | undefined
  return supported?.suppressLocalAudioPlayback === true
}

/**
 * 拉起浏览器的屏幕共享选择窗口，只保留声音
 *
 * - 规范要求必须请求视频，只要音频会直接被拒；拿到后立刻停掉视频轨，只留音轨
 *   浏览器的「正在共享」提示条会保留到音轨也停止为止
 * - 用户选了来源但没勾选分享音频时，返回 `hasAudio: false`，此时视频轨已停、共享已结束
 * - 失败不抛错：取消选择、系统拒绝屏幕录制、浏览器不支持分别归类
 *
 * 返回的音轨由调用方持有并负责 stop；用户在提示条上停止共享时音轨会 ended
 */
export async function requestDisplayAudio(options: RequestDisplayAudioOptions = {}): Promise<DisplayAudioResult> {
  const {
    preferSurface = 'monitor',
    systemAudio = 'include',
    selfBrowserSurface = 'exclude',
    surfaceSwitching = 'exclude',
    audio = DEFAULT_AUDIO_CONSTRAINTS,
    focusCapturedSurface = false,
    environment = {},
  } = options

  const mediaDevices = environment.mediaDevices ?? globalThis.navigator?.mediaDevices
  if (typeof mediaDevices?.getDisplayMedia !== 'function') {
    return { ok: false, failure: 'unsupported', error: new Error('Current environment does not support getDisplayMedia') }
  }

  let stream: MediaStream
  try {
    stream = await mediaDevices.getDisplayMedia({
      /** 只为满足规范，帧率压到最低；拿到后立即停掉 */
      video: { displaySurface: preferSurface, frameRate: { ideal: 1, max: 1 } },
      audio,
      systemAudio,
      selfBrowserSurface,
      surfaceSwitching,
      controller: createFocusController(focusCapturedSurface),
    } as DisplayMediaStreamOptions)
  }
  catch (error) {
    return { ok: false, failure: classifyDisplayMediaError(error), error }
  }

  const videoTrack = stream.getVideoTracks()[0]
  /** 必须在停掉视频轨之前读，停了之后 settings 可能为空 */
  const surface = readSurface(videoTrack)
  stream.getVideoTracks().forEach((track) => {
    track.stop()
    stream.removeTrack(track)
  })

  return {
    ok: true,
    stream,
    hasAudio: stream.getAudioTracks().length > 0,
    surface,
  }
}

/**
 * 归类 getDisplayMedia 的失败
 *
 * Chromium：取消选择报 `NotAllowedError: Permission denied by user`，
 * macOS 未授予屏幕录制权限报 `NotAllowedError: Permission denied by system`
 */
export function classifyDisplayMediaError(error: unknown): DisplayAudioFailure {
  const name = (error as { name?: unknown } | null)?.name
  const message = (error as { message?: unknown } | null)?.message
  if (name === 'NotAllowedError') {
    return typeof message === 'string' && /system/i.test(message)
      ? 'system-denied'
      : 'cancelled'
  }
  if (name === 'NotSupportedError' || name === 'TypeError') return 'unsupported'
  return 'unknown'
}

/**
 * Chromium 共享标签页或窗口后默认把焦点切到被共享的那一页；只要声音时没有理由把用户带走
 *
 * `setFocusBehavior` 可以在调用 getDisplayMedia 之前设置；不支持 CaptureController 的浏览器返回 undefined
 */
function createFocusController(focusCapturedSurface: boolean): unknown {
  const Controller = (globalThis as { CaptureController?: new () => { setFocusBehavior?: (behavior: string) => void } }).CaptureController
  if (!Controller) return undefined

  const controller = new Controller()
  try {
    controller.setFocusBehavior?.(focusCapturedSurface
      ? 'focus-captured-surface'
      : 'no-focus-change')
  }
  catch {
    /** 旧版 Chromium 不允许在 getDisplayMedia 之前设置：保持浏览器默认行为 */
  }
  return controller
}

function readSurface(track: MediaStreamTrack | undefined): DisplayAudioSurface {
  const surface = (track?.getSettings() as (MediaTrackSettings & { displaySurface?: string }) | undefined)?.displaySurface
  return surface === 'monitor' || surface === 'browser' || surface === 'window'
    ? surface
    : 'unknown'
}
