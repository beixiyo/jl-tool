/** 可查询的媒体权限名 */
export type MediaPermissionName = 'microphone' | 'camera'

/** 媒体输入设备类型 */
export type MediaDeviceInputKind = 'audioinput' | 'videoinput'

/** 站点授权状态；`unknown` 表示当前浏览器读不到 */
export type MediaPermissionState = PermissionState | 'unknown'

/**
 * getUserMedia 失败的归类
 *
 * - `system-denied`：操作系统关闭了浏览器的设备权限
 * - `blocked`：调用前本站已被拒绝，浏览器不会再弹授权窗口
 * - `denied`：用户这次在浏览器授权窗口里点了拒绝
 * - `dismissed`：用户关掉了授权窗口，没有做选择
 * - `no-device`：没有可用设备
 * - `device-busy`：设备被占用或硬件异常
 * - `unknown`：其他错误
 */
export type MediaAccessFailure =
  | 'system-denied'
  | 'blocked'
  | 'denied'
  | 'dismissed'
  | 'no-device'
  | 'device-busy'
  | 'unknown'

/** {@link classifyMediaAccessError} 需要的上下文 */
export interface MediaAccessErrorContext {
  /** 调用 getUserMedia 之前读到的授权状态 */
  stateBefore: MediaPermissionState
  /** 失败后重新读到的授权状态，用来区分「刚被拒绝」与「关掉窗口」 */
  stateAfter: MediaPermissionState
  /** 设备列表里是否有对应类型的输入设备 */
  hasInputDevice: boolean
}

/** 可替换的浏览器环境依赖，供测试或宿主注入 */
export interface MediaPermissionEnvironment {
  permissions?: Pick<Permissions, 'query'>
  mediaDevices?: Pick<MediaDevices, 'enumerateDevices'>
}
