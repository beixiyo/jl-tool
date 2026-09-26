import type { MediaAccessFailure, MediaPermissionState } from '../MediaPermission'
import type { MicrophoneConstraints } from './echoCancellation'

/** {@link MicrophoneInput} 的构造参数 */
export interface MicrophoneInputOptions {
  /**
   * getUserMedia 约束，echoCancellation 可用 `'all'` / `'remote-only'`
   *
   * 不要用 `deviceId: { exact }` 写死设备：设备拔掉后接回会一直失败；
   * 手动选择设备请用 `deviceId: { ideal }`，并通过 {@link MicrophoneInput.setConstraints} 在运行中切换
   * @default { audio: true }
   */
  constraints?: MicrophoneConstraints
  /** 当前麦克风流变化：首次获取、接回新设备、断开（null） */
  onStreamChange?: (stream: MediaStream | null) => void
  /** 监听期间的设备 / 权限 / 静音事件 */
  onEvent?: (event: MicrophoneInputEvent) => void
  /** 可替换的浏览器环境依赖 */
  environment?: MicrophoneInputEnvironment
}

/**
 * 监听期间的麦克风事件
 *
 * - `recovered`：断开后已接回系统默认麦克风
 * - `unavailable`：接不回来（没有设备 / 被占用），之后每次 devicechange 会静默重试
 * - `permission-denied`：接回时发现系统或站点的麦克风权限已被关闭
 * - `muted` / `unmuted`：音轨暂时收不到数据 / 恢复，音轨本身没有结束。
 *   例如 Safari 中麦克风被其他标签页占用时音轨被静音而不是 ended，此时不会自动接回
 */
export type MicrophoneInputEvent =
  | { type: 'recovered', stream: MediaStream, deviceLabel: string }
  | { type: 'muted', track: MediaStreamTrack }
  | { type: 'unmuted', track: MediaStreamTrack }
  | { type: 'unavailable', failure: MediaAccessFailure }
  | { type: 'permission-denied', failure: Extract<MediaAccessFailure, 'system-denied' | 'blocked' | 'denied'> }

/** {@link MicrophoneInput.acquire} 的结果；失败不抛错 */
export type MicrophoneAcquireResult =
  | { ok: true, stream: MediaStream }
  | {
    ok: false
    failure: MediaAccessFailure
    /** 失败后读到的站点授权状态 */
    permissionState: MediaPermissionState
    error: unknown
  }

/** 可替换的浏览器环境依赖，供测试或宿主注入 */
export interface MicrophoneInputEnvironment {
  mediaDevices?: Pick<MediaDevices, 'getUserMedia' | 'enumerateDevices' | 'addEventListener' | 'removeEventListener'>
  permissions?: Pick<Permissions, 'query'>
}
