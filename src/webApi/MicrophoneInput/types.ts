import type { MediaAccessFailure, MediaPermissionState } from '../MediaPermission'

/** {@link MicrophoneInput} 的构造参数 */
export interface MicrophoneInputOptions {
  /**
   * getUserMedia 约束；不要写死 deviceId，接回时要跟随系统默认设备
   * @default { audio: true }
   */
  constraints?: MediaStreamConstraints
  /** 当前麦克风流变化：首次获取、接回新设备、断开（null） */
  onStreamChange?: (stream: MediaStream | null) => void
  /** 监听期间的设备 / 权限事件 */
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
 */
export type MicrophoneInputEvent =
  | { type: 'recovered', stream: MediaStream, deviceLabel: string }
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
