/** 共享来源：整个屏幕 / 浏览器标签页 / 窗口 */
export type DisplayAudioSurface = 'monitor' | 'browser' | 'window' | 'unknown'

/**
 * 屏幕共享取声音失败的归类
 *
 * - `cancelled`：用户取消了选择窗口
 * - `system-denied`：操作系统未授予浏览器屏幕录制权限（macOS）
 * - `unsupported`：浏览器不支持
 * - `unknown`：其他错误
 */
export type DisplayAudioFailure = 'cancelled' | 'system-denied' | 'unsupported' | 'unknown'

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
  | { ok: false, failure: DisplayAudioFailure, error: unknown }

/** {@link requestDisplayAudio} 的选项 */
export interface RequestDisplayAudioOptions {
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
  audio?: MediaTrackConstraints
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
