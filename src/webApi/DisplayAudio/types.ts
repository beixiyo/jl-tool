/** 屏幕音频采集的选项、浏览器扩展与结果类型 */
import type { MediaOptions } from '../recording'

/** 音频轨约束，包含 Chromium 扩展；未知新字段仍原样透传 */
export type DisplayAudioConstraints = MediaTrackConstraints & {
  suppressLocalAudioPlayback?: boolean
}

/** 完整 getDisplayMedia 配置，允许当前 DOM 类型尚未收录的字段 */
export type NativeDisplayMediaOptions = Omit<DisplayMediaStreamOptions, 'audio'> & {
  audio?: boolean | DisplayAudioConstraints
  monitorTypeSurfaces?: 'include' | 'exclude'
  systemAudio?: 'include' | 'exclude'
  windowAudio?: 'window' | 'system' | 'exclude'
  selfBrowserSurface?: 'include' | 'exclude'
  surfaceSwitching?: 'include' | 'exclude'
  preferCurrentTab?: boolean
  [key: string]: unknown
}

/** 共享来源：整个屏幕 / 浏览器标签页 / 窗口 */
export type DisplayAudioSurface = 'monitor' | 'browser' | 'window' | 'unknown'

/**
 * 屏幕共享取声音失败的归类
 *
 * - `cancelled`：用户取消了选择窗口
 * - `system-denied`：操作系统未授予浏览器屏幕录制权限（macOS）
 * - `activation-required`：不是在用户点击等操作中发起，或页面在后台 / 没有焦点；提示用户回到页面再点一次即可
 * - `unsupported`：浏览器不支持
 * - `unknown`：其他错误
 */
export type DisplayAudioFailure = 'cancelled' | 'system-denied' | 'activation-required' | 'unsupported' | 'unknown'

/** {@link requestDisplayAudio} 的结果；失败不抛错 */
export type DisplayAudioResult =
  | {
    ok: true
    /** 只含音轨的流（视频轨已停掉并移除）；`hasAudio` 为 false 时为空流 */
    stream: MediaStream
    /** 用户是否分享了声音 */
    hasAudio: boolean
    /** 用户选择的来源 */
    surface: DisplayAudioSurface
  }
  | { ok: false; failure: DisplayAudioFailure; error: unknown }

/** {@link requestDisplayAudio} 的选项 */
export interface RequestDisplayAudioOptions {
  /** 完整原生配置，覆盖快捷字段；函数返回值完整替换。@default 由快捷字段生成 */
  displayMediaOptions?: MediaOptions<NativeDisplayMediaOptions>
  /** 是否允许选择整屏；exclude 不应与 preferSurface: monitor 同用。@default 'include' */
  monitorTypeSurfaces?: 'include' | 'exclude'
  /** 捕获标签页时是否抑制被捕获页本地播放，audio 中同名字段优先。@default false */
  suppressLocalAudioPlayback?: boolean
  /**
   * 选择窗口默认定位的页签
   * @default 'monitor'
   */
  preferSurface?: 'monitor' | 'browser' | 'window'
  /**
   * 分享整个屏幕时是否提供「分享系统音频」选项
   * @default 'include'
   */
  systemAudio?: 'include' | 'exclude'
  /**
   * 分享窗口时优先提供的音频选项：
   * `window` 只采选中窗口所属应用的声音（Windows/macOS 需浏览器开启应用级采集实验开关，
   * 不支持时自动回退为系统音频）；`system` 整个系统混音；`exclude` 不提供音频选项
   * @default 'window'
   */
  windowAudio?: 'window' | 'system' | 'exclude'
  /**
   * 是否允许选择当前标签页
   * @default 'exclude'
   */
  selfBrowserSurface?: 'include' | 'exclude'
  /**
   * 共享中是否允许切换来源
   * @default 'exclude'
   */
  surfaceSwitching?: 'include' | 'exclude'
  /**
   * 音频约束
   * @default { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
   */
  audio?: DisplayAudioConstraints
  /**
   * 共享标签页 / 窗口后是否把焦点切到被共享的那一页（Chromium 默认会切）
   * @default false
   */
  focusCapturedSurface?: boolean
  /** 可替换的浏览器环境依赖 */
  environment?: DisplayAudioEnvironment
}

/** 可替换的浏览器环境依赖，供测试或宿主注入 */
export interface DisplayAudioEnvironment {
  mediaDevices?: Pick<MediaDevices, 'getDisplayMedia' | 'getSupportedConstraints'>
}
