/** 麦克风输入：获取、失败归类，以及设备断开后自动接回系统默认麦克风 */

import type { MicrophoneConstraints } from './echoCancellation'
import type { MicrophoneAcquireResult, MicrophoneInputEnvironment, MicrophoneInputOptions } from './types'
import { classifyMediaAccessError, hasMediaInputDevice, queryMediaPermission } from '../MediaPermission'

const DEFAULT_CONSTRAINTS: MicrophoneConstraints = { audio: true }

/**
 * 持有一条麦克风流并负责它的生命周期
 *
 * - `acquire()` 获取麦克风；失败时按 {@link classifyMediaAccessError} 归类，不抛错
 * - `startWatching()` 之后，音轨 ended（设备拔掉、被系统收回、权限被撤销）会先交出 `null`
 *   让下游接静音，再重新获取系统默认麦克风；没有设备时等 devicechange 再试
 * - 流换了通过 `onStreamChange` 通知，设备、权限与静音事件通过 `onEvent` 通知，本类不做任何 UI
 *
 * 约束里不要用 exact 写死 deviceId：接回时要跟随系统当前默认设备
 */
export class MicrophoneInput {
  constructor(private readonly options: MicrophoneInputOptions = {}) {
    this.constraints = options.constraints ?? DEFAULT_CONSTRAINTS
  }

  private current: MediaStream | null = null
  private constraints: MicrophoneConstraints
  private watching = false
  private waitingForDevice = false
  private recovering: Promise<void> | null = null
  /** 进行中的 getUserMedia；并发的 acquire 共用同一次请求 */
  private acquiring: Promise<MicrophoneAcquireResult> | null = null
  /** setConstraints 按调用顺序串行执行 */
  private switching: Promise<unknown> = Promise.resolve()
  /** release 时递增，丢弃释放前发出、之后才返回的流 */
  private generation = 0

  /** 当前麦克风流；未获取或已断开时为 null */
  get stream(): MediaStream | null {
    return this.current
  }

  /** 当前音轨是否被静音（如 Safari 中麦克风被其他标签页占用）；没有流时为 false */
  get muted(): boolean {
    return this.current?.getAudioTracks().some((track) => track.muted) ?? false
  }

  /**
   * 获取麦克风；已有可用流时直接复用，不会重复触发授权
   *
   * 同时进行的调用合并为一次 getUserMedia，返回同一结果；
   * 请求期间调用了 release 时，晚到的流会被立即停止，结果为 `unknown` 失败（error 为 AbortError）
   */
  acquire(): Promise<MicrophoneAcquireResult> {
    if (this.current && isLive(this.current)) return Promise.resolve({ ok: true, stream: this.current })
    return this.acquiring ?? this.trackAcquiring(this.request())
  }

  /**
   * 运行中更换约束，例如用户手动选择设备（用 `deviceId: { ideal }`）
   *
   * - 持有流时立即按新约束重新获取：成功则替换并触发 `onStreamChange`；失败保留原来的流，返回失败结果
   * - 未持有流时只保存约束，在下次 acquire 或自动接回时生效，返回 null
   * - 连续调用按顺序执行、以最后一次为准，被后续调用取代的那次返回 null
   */
  setConstraints(constraints: MicrophoneConstraints): Promise<MicrophoneAcquireResult | null> {
    this.constraints = constraints
    const run = this.switching.then(async () => {
      if (this.acquiring) await this.acquiring
      if (constraints !== this.constraints || !this.current) return null
      return this.trackAcquiring(this.request())
    })
    this.switching = run.then(noop, noop)
    return run
  }

  private trackAcquiring(pending: Promise<MicrophoneAcquireResult>): Promise<MicrophoneAcquireResult> {
    this.acquiring = pending
    const clear = () => {
      if (this.acquiring === pending) this.acquiring = null
    }
    pending.then(clear, clear)
    return pending
  }

  private async request(): Promise<MicrophoneAcquireResult> {
    const generation = this.generation
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
      /** 规范已允许 echoCancellation 取模式字符串，DOM 类型尚未跟进 */
      const next = await mediaDevices.getUserMedia(this.constraints as MediaStreamConstraints)
      if (generation !== this.generation) {
        next.getTracks().forEach((track) => track.stop())
        return {
          ok: false,
          failure: 'unknown',
          permissionState: stateBefore,
          error: new DOMException('MicrophoneInput was released while acquiring', 'AbortError'),
        }
      }

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
    this.generation++
    this.acquiring = null
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

    prev?.getAudioTracks().forEach((track) => {
      track.removeEventListener('ended', this.handleTrackEnded)
      track.removeEventListener('mute', this.handleTrackMute)
      track.removeEventListener('unmute', this.handleTrackMute)
    })
    this.current = next
    next?.getAudioTracks().forEach((track) => {
      track.addEventListener('ended', this.handleTrackEnded)
      track.addEventListener('mute', this.handleTrackMute)
      track.addEventListener('unmute', this.handleTrackMute)
    })
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

  /** 静音不结束音轨，不触发接回，只转发给调用方 */
  private readonly handleTrackMute = (event: Event) => {
    if (!this.watching) return
    this.options.onEvent?.({
      type: event.type === 'mute'
        ? 'muted'
        : 'unmuted',
      track: event.target as MediaStreamTrack,
    })
  }

  private readonly handleDeviceChange = () => {
    if (this.waitingForDevice) void this.recover()
  }
}

function noop(): void {}

function isLive(stream: MediaStream): boolean {
  return stream.getAudioTracks().some(track => track.readyState === 'live')
}
