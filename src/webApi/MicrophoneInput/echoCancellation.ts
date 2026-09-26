/** 回声消除模式的类型补充与能力检测；TS DOM 类型仍把 echoCancellation 声明为 boolean */

/**
 * 规范新增的回声消除模式
 * - `all`：消除系统播放的所有声音（通知、读屏等），隐私最好
 * - `remote-only`：只消除来自 RTCPeerConnection 的远端声音，保留本地播放
 */
export type EchoCancellationMode = 'all' | 'remote-only'

/** echoCancellation 可取的值；`true` 由浏览器决定消除范围 */
export type EchoCancellationValue = boolean | EchoCancellationMode

/** echoCancellation 约束，支持裸值或 exact / ideal */
export type EchoCancellationConstraint =
  | EchoCancellationValue
  | { exact?: EchoCancellationValue; ideal?: EchoCancellationValue }

/** 允许 echoCancellation 使用模式字符串的音频约束 */
export type AudioTrackConstraints = Omit<MediaTrackConstraints, 'echoCancellation' | 'advanced'> & {
  echoCancellation?: EchoCancellationConstraint
  advanced?: Array<Omit<MediaTrackConstraintSet, 'echoCancellation'> & { echoCancellation?: EchoCancellationConstraint }>
}

/** 允许 audio 使用 {@link AudioTrackConstraints} 的 getUserMedia 约束 */
export type MicrophoneConstraints = Omit<MediaStreamConstraints, 'audio'> & {
  audio?: boolean | AudioTrackConstraints
}

/** 可读取能力的来源：麦克风音轨，或 enumerateDevices 返回的 InputDeviceInfo（Chromium） */
export type EchoCancellationCapabilitySource = Pick<MediaStreamTrack, 'getCapabilities'> | Pick<InputDeviceInfo, 'getCapabilities'>

/**
 * 读取来源支持的回声消除取值
 *
 * 按规范，能力列表里出现 `all` / `remote-only` 才表示可以选择消除范围；
 * 浏览器不支持读取能力（如 Safari 的 InputDeviceInfo、未授权时的设备）时返回空数组
 * @example
 * ```ts
 * // 在 getUserMedia 时带上模式；已开启的音轨用 applyConstraints 切换回声消除未必生效，
 * // setConstraints 会按新约束重新获取流
 * const track = mic.stream?.getAudioTracks()[0]
 * if (getEchoCancellationValues(track).includes('all')) {
 *   await mic.setConstraints({ audio: { echoCancellation: 'all' } })
 * }
 * ```
 */
export function getEchoCancellationValues(source: EchoCancellationCapabilitySource | null | undefined): EchoCancellationValue[] {
  let values: unknown
  try {
    values = (source?.getCapabilities?.() as { echoCancellation?: unknown } | undefined)?.echoCancellation
  }
  catch {
    return []
  }
  if (!Array.isArray(values)) return []

  return values.filter((value): value is EchoCancellationValue => typeof value === 'boolean' || value === 'all' || value === 'remote-only')
}

/** 来源是否支持指定的回声消除模式；见 {@link getEchoCancellationValues} */
export function isEchoCancellationModeSupported(
  source: EchoCancellationCapabilitySource | null | undefined,
  mode: EchoCancellationMode,
): boolean {
  return getEchoCancellationValues(source).includes(mode)
}
