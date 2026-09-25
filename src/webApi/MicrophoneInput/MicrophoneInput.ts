/** 麦克风输入：获取、失败归类，以及设备断开后自动接回系统默认麦克风 */

import type { MicrophoneAcquireResult, MicrophoneInputEnvironment, MicrophoneInputOptions } from './types'
import { classifyMediaAccessError, hasMediaInputDevice, queryMediaPermission } from '../MediaPermission'

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = { audio: true }

/**
 * 持有一条麦克风流并负责它的生命周期
 *
 * - `acquire()` 获取麦克风；失败时按 {@link classifyMediaAccessError} 归类，不抛错
 * - `startWatching()` 之后，音轨 ended（设备拔掉、被系统收回、权限被撤销）会先交出 `null`
 *   让下游接静音，再重新获取系统默认麦克风；没有设备时等 devicechange 再试
 * - 流换了通过 `onStreamChange` 通知，设备与权限事件通过 `onEvent` 通知，本类不做任何 UI
 *
 * 约束里不要写死 deviceId：接回时要跟随系统当前默认设备
 */
export class MicrophoneInput {
  constructor(private readonly options: MicrophoneInputOptions = {}) {}

  private current: MediaStream | null = null
  private watching = false
  private waitingForDevice = false
  private recovering: Promise<void> | null = null

  /** 当前麦克风流；未获取或已断开时为 null */
  get stream(): MediaStream | null {
    return this.current
  }

  /** 获取麦克风；已有可用流时直接复用，不会重复触发授权 */
  async acquire(): Promise<MicrophoneAcquireResult> {
    if (this.current && isLive(this.current)) return { ok: true, stream: this.current }

    const mediaDevices = this.environment.mediaDevices ?? globalThis.navigator?.mediaDevices
    if (!mediaDevices?.getUserMedia) {
      return {
        ok: false,
        failure: 'unknown',
        permissionState: 'unknown',
        error: new Error('Current environment does not support getUserMedia'),
      }
    }

    const stateBefore = await queryMediaPermission('microphone', this.environment)
    try {
      const next = await mediaDevices.getUserMedia(this.options.constraints ?? DEFAULT_CONSTRAINTS)
      this.replaceStream(next)
      return { ok: true, stream: next }
    }
    catch (error) {
      const [stateAfter, hasInputDevice] = await Promise.all([
        queryMediaPermission('microphone', this.environment),
        hasMediaInputDevice('audioinput', this.environment),
      ])
      return {
        ok: false,
        failure: classifyMediaAccessError(error, { stateBefore, stateAfter, hasInputDevice }),
        permissionState: stateAfter,
        error,
      }
    }
  }

  /** 开始监听断开并自动接回；可重复调用 */
  startWatching(): void {
    if (this.watching) return

    this.watching = true
    this.deviceEvents?.addEventListener('devicechange', this.handleDeviceChange)
    if (this.current && !isLive(this.current)) void this.recover()
  }

  /** 停止监听，保留当前流；可重复调用 */
  stopWatching(): void {
    this.watching = false
    this.waitingForDevice = false
    this.deviceEvents?.removeEventListener('devicechange', this.handleDeviceChange)
  }

  /**
   * 立即尝试接回（如用户重新开启了权限）
   *
   * 只在确实断开或正在等设备时生效；Chromium 撤销权限不一定中断已在采集的音轨
   */
  retry(): void {
    if (this.waitingForDevice || !this.current || !isLive(this.current)) void this.recover()
  }

  /** 停止监听并释放麦克风；可重复调用 */
  release(): void {
    this.stopWatching()
    this.replaceStream(null)
  }

  private get environment(): MicrophoneInputEnvironment {
    return this.options.environment ?? {}
  }

  private get deviceEvents(): Pick<MediaDevices, 'addEventListener' | 'removeEventListener'> | undefined {
    return this.environment.mediaDevices ?? globalThis.navigator?.mediaDevices
  }

  private replaceStream(next: MediaStream | null): void {
    const prev = this.current
    if (prev === next) return

    prev?.getAudioTracks().forEach(track => track.removeEventListener('ended', this.handleTrackEnded))
    this.current = next
    next?.getAudioTracks().forEach(track => track.addEventListener('ended', this.handleTrackEnded))
    prev?.getTracks().forEach(track => track.stop())

    this.options.onStreamChange?.(next)
  }

  private recover(): Promise<void> {
    if (!this.watching) return Promise.resolve()
    if (this.recovering) return this.recovering

    this.recovering = this.runRecover().finally(() => {
      this.recovering = null
    })
    return this.recovering
  }

  private async runRecover(): Promise<void> {
    const wasWaiting = this.waitingForDevice
    this.replaceStream(null)
    const result = await this.acquire()

    /** 等待 getUserMedia 期间已被 release / stopWatching：不接新流，也不再发事件 */
    if (!this.watching) {
      if (result.ok) this.replaceStream(null)
      return
    }

    if (result.ok) {
      this.waitingForDevice = false
      this.options.onEvent?.({
        type: 'recovered',
        stream: result.stream,
        deviceLabel: result.stream.getAudioTracks()[0]?.label ?? '',
      })
      return
    }

    this.waitingForDevice = true
    if (result.failure === 'system-denied' || result.failure === 'blocked' || result.failure === 'denied') {
      this.options.onEvent?.({ type: 'permission-denied', failure: result.failure })
      return
    }

    /** 等待期间每次 devicechange 都会重试，只在第一次失败时通知，避免调用方反复提示 */
    if (!wasWaiting) this.options.onEvent?.({ type: 'unavailable', failure: result.failure })
  }

  private readonly handleTrackEnded = () => {
    void this.recover()
  }

  private readonly handleDeviceChange = () => {
    if (this.waitingForDevice) void this.recover()
  }
}

function isLive(stream: MediaStream): boolean {
  return stream.getAudioTracks().some(track => track.readyState === 'live')
}
