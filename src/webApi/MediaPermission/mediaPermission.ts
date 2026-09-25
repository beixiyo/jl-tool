/** 浏览器媒体权限：读取站点授权状态、订阅变化、归类 getUserMedia 失败原因 */

import type {
  MediaAccessErrorContext,
  MediaAccessFailure,
  MediaDeviceInputKind,
  MediaPermissionEnvironment,
  MediaPermissionName,
  MediaPermissionState,
} from './types'

/**
 * 读取本站某项媒体权限的授权状态
 *
 * Permissions API 不支持该权限名时（旧版 Firefox / Safari）返回 `unknown`，
 * 调用方不能据此判断「未询问」，只能直接调 getUserMedia 看结果
 */
export async function queryMediaPermission(
  name: MediaPermissionName,
  environment: MediaPermissionEnvironment = {},
): Promise<MediaPermissionState> {
  const status = await getPermissionStatus(name, environment)
  return status?.state ?? 'unknown'
}

/**
 * 订阅本站某项媒体权限的变化（用户在地址栏或站点设置里改了权限）
 *
 * @returns 取消订阅；Permissions API 不可用时是空操作，可重复调用
 */
export function watchMediaPermission(
  name: MediaPermissionName,
  listener: (state: PermissionState) => void,
  environment: MediaPermissionEnvironment = {},
): () => void {
  let disposed = false
  let status: PermissionStatus | null = null
  const handleChange = () => {
    if (status) listener(status.state)
  }

  void getPermissionStatus(name, environment).then((next) => {
    if (disposed || !next) return

    status = next
    status.addEventListener('change', handleChange)
  })

  return () => {
    disposed = true
    status?.removeEventListener('change', handleChange)
  }
}

/**
 * 设备列表里是否有指定类型的输入设备
 *
 * 未授权时设备 label 为空，但条目仍在，因此可以在授权前调用
 */
export async function hasMediaInputDevice(
  kind: MediaDeviceInputKind,
  environment: MediaPermissionEnvironment = {},
): Promise<boolean> {
  const mediaDevices = environment.mediaDevices ?? globalThis.navigator?.mediaDevices
  if (!mediaDevices?.enumerateDevices) return false

  try {
    const devices = await mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === kind)
  }
  catch {
    return false
  }
}

/**
 * 把 getUserMedia 的失败归类
 *
 * 各家对「系统关闭了浏览器的设备权限」报法不同：
 * - Chromium（仅 macOS）：`NotAllowedError: Permission denied by system`
 * - Firefox（macOS）：`NotFoundError`，与真的没有设备同名，靠 `hasInputDevice` 区分
 * - Safari：与站点级拒绝同一个错，无法区分，归为 `blocked` / `denied`
 * - Chromium Windows：没有专门报错，归为 `device-busy` / `unknown`
 *
 * 站点级拒绝再按前后授权状态细分：调用前已拒绝（浏览器不会再弹窗）、这次刚被拒绝、弹窗被关掉
 */
export function classifyMediaAccessError(
  error: unknown,
  context: MediaAccessErrorContext,
): MediaAccessFailure {
  const { stateBefore, stateAfter, hasInputDevice } = context
  const name = getErrorName(error)
  const message = getErrorMessage(error)

  if (name === 'NotFoundError') {
    return hasInputDevice
      ? 'system-denied'
      : 'no-device'
  }
  if (name === 'OverconstrainedError') return 'no-device'
  if (name === 'NotReadableError' || name === 'AbortError') return 'device-busy'
  if (name !== 'NotAllowedError' && name !== 'SecurityError') return 'unknown'

  if (/system/i.test(message)) return 'system-denied'
  if (stateBefore === 'denied') return 'blocked'
  if (stateAfter === 'denied') return 'denied'
  if (stateAfter === 'prompt') return 'dismissed'

  /** 读不到授权状态时无法细分，按已拒绝处理：调用方至少能把用户引导到浏览器设置 */
  return 'blocked'
}

async function getPermissionStatus(
  name: MediaPermissionName,
  environment: MediaPermissionEnvironment,
): Promise<PermissionStatus | null> {
  const permissions = environment.permissions ?? globalThis.navigator?.permissions
  if (!permissions?.query) return null

  try {
    return await permissions.query({ name: name as PermissionName })
  }
  catch {
    return null
  }
}

function getErrorName(error: unknown): string {
  return isErrorLike(error)
    ? error.name
    : ''
}

function getErrorMessage(error: unknown): string {
  return isErrorLike(error)
    ? error.message
    : ''
}

function isErrorLike(error: unknown): error is { name: string, message: string } {
  return typeof error === 'object'
    && error !== null
    && typeof (error as { name?: unknown }).name === 'string'
    && typeof (error as { message?: unknown }).message === 'string'
}
