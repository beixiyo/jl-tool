const DEBUG_KEY = '__@@DEBUG@@__'

/**
 * 禁用调试
 *
 * @remarks 该工具只能提高普通用户打开调试工具的操作门槛，不能作为鉴权、源码保护或数据安全边界
 * @example
 * ```ts
 * disableDebug({
 *   secret: 'your secret'
 * })
 * ```
 * @returns 清理键盘、菜单监听器和调试检测定时器的函数
 */
export function disableDebug(debugOpts: DebugOpts) {
  const {
    secret,
    key = 'd',
    enable = true,
    disableF12 = true,
    disableMenu = true,
    detectDebugger = true,
    detectWindowSize = true,
    debuggerThreshold = 100,
    detectionInterval = 1000,
    windowSizeThreshold = 250,
    windowSizeMatchCount = 2,
    redirectOnDetected = true,
    unlockStorage = 'session',
    onDetected,

    labelText,
    wrapStyleText,
    btnText,
    btnStyleText,
    inputStyleText,
  } = debugOpts

  if (!enable)
    return () => {}

  const storage = unlockStorage === 'local'
    ? localStorage
    : unlockStorage === 'session'
      ? sessionStorage
      : null
  const isAdmin = storage?.getItem(DEBUG_KEY) === 'unlocked'
  if (isAdmin) {
    return () => {}
  }

  let promptElement: HTMLDivElement | null = null
  const removeUnlockListener = addEvent(key)
  const stopDebugCheck = preventDebug({
    detectDebugger,
    detectWindowSize,
    debuggerThreshold: Math.max(0, debuggerThreshold),
    detectionInterval: Math.max(16, detectionInterval),
    windowSizeThreshold: Math.max(0, windowSizeThreshold),
    windowSizeMatchCount: Math.max(1, Math.floor(windowSizeMatchCount)),
    redirectOnDetected,
    onDetected,
  })
  const removeDebugGuards = disableDebugAndContextMenu(disableF12, disableMenu)

  return () => {
    removeUnlockListener()
    stopDebugCheck()
    removeDebugGuards()
    promptElement?.remove()
    promptElement = null
  }

  /**
   * shift + d 输入密码打开调试
   */
  function addEvent(key: string) {
    const unlockKey = key.toLowerCase()
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === unlockKey) {
        createInput()
      }
    }
    window.addEventListener('keydown', handler)

    return () => {
      window.removeEventListener('keydown', handler)
    }
  }

  /**
   * 输入框解除调试限制
   */
  function createInput() {
    if (promptElement?.isConnected) {
      promptElement.querySelector('input')?.focus()
      return
    }

    const dialog = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    const inputId = `${DEBUG_KEY}-input`
    dialog.role = 'dialog'
    dialog.ariaModal = 'true'
    label.htmlFor = inputId
    label.textContent = labelText || 'Enter the debug password'
    input.id = inputId
    input.type = 'password'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = btnText || 'Unlock'
    btnStyleText && (btn.style.cssText = btnStyleText)

    dialog.appendChild(label)
    dialog.appendChild(input)
    dialog.appendChild(btn)

    input.style.cssText = inputStyleText || `
      border: 1px solid #000;
      border-radius: 5px;
    `
    dialog.style.cssText = wrapStyleText || `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      border: 1px solid #000;
      background: #fff;
      padding: 20px;
      border-radius: 10px;
    `

    const unlock = () => {
      const val = input.value
      if (val === secret) {
        storage?.setItem(DEBUG_KEY, 'unlocked')
        location.reload()
      }
      else {
        // eslint-disable-next-line no-alert
        alert('Invalid password')
      }
    }

    btn.addEventListener('click', unlock)
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        unlock()
      }
      else if (event.key === 'Escape') {
        dialog.remove()
        promptElement = null
      }
    })

    document.body.appendChild(dialog)
    promptElement = dialog
    input.focus()
  }
}

/**
 * 禁用开发者工具
 * @param disableF12 是否禁用 F12 按键
 * @param disableMenu 是否禁用右键菜单
 */
function disableDebugAndContextMenu(disableF12 = true, disableMenu = true) {
  const contextMenuHandler = (e: MouseEvent) => {
    e.preventDefault() // 阻止右键菜单出现
  }

  const keydownHandler = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    /** 检查是否是 F12 键 */
    if (e.key === 'F12' || e.code === 'F12') {
      e.preventDefault()
    }
    /** 检查是否是 Command + Option + I (MacOS 下 Chrome/Firefox 的开发者工具快捷键) */
    else if (e.metaKey && e.altKey && (key === 'i' || key === 'j')) {
      e.preventDefault()
    }
    /** 检查是否是 Command + Shift + C (MacOS 下 Chrome/Firefox 的元素检查快捷键) */
    else if (e.metaKey && e.shiftKey && key === 'c') {
      e.preventDefault()
    }
    /** 检查是否是 Command + Shift + J (MacOS 下 Chrome/Firefox 的控制台快捷键) */
    else if (e.metaKey && e.shiftKey && key === 'j') {
      e.preventDefault()
    }
    /** 检查是否是 Command + Alt + C (MacOS 下 Safari 的元素检查快捷键) */
    else if (e.metaKey && e.altKey && key === 'c') {
      e.preventDefault()
    }
    /** 检查 Ctrl + Shift + I/J/C（Windows/Linux 下 Chrome/Firefox） */
    else if (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
      e.preventDefault()
    }
  }

  if (disableMenu) {
    document.addEventListener('contextmenu', contextMenuHandler)
  }
  if (disableF12) {
    document.addEventListener('keydown', keydownHandler)
  }

  return () => {
    document.removeEventListener('contextmenu', contextMenuHandler)
    document.removeEventListener('keydown', keydownHandler)
  }
}

/**
 * 阻止调试
 */
function preventDebug(options: DebugDetectionOptions) {
  let detected = false
  let windowSizeMatches = 0

  const notifyDetected = (event: DebugDetectionEvent) => {
    if (detected)
      return

    detected = true
    clearInterval(id)
    try {
      options.onDetected?.(event)
    }
    finally {
      if (options.redirectOnDetected)
        location.href = 'about:blank'
    }
  }

  const id = setInterval(() => {
    if (options.detectDebugger) {
      const start = performance.now()
      // eslint-disable-next-line no-debugger
      debugger

      const elapsed = performance.now() - start
      if (elapsed > options.debuggerThreshold) {
        notifyDetected({
          reason: 'debugger-pause',
          detectedAt: Date.now(),
          elapsed,
        })
        return
      }
    }

    if (options.detectWindowSize) {
      const widthGap = outerWidth - innerWidth
      const heightGap = outerHeight - innerHeight
      const matched = widthGap > options.windowSizeThreshold
        || heightGap > options.windowSizeThreshold
      windowSizeMatches = matched
        ? windowSizeMatches + 1
        : 0

      if (windowSizeMatches >= options.windowSizeMatchCount) {
        notifyDetected({
          reason: 'window-size',
          detectedAt: Date.now(),
          widthGap,
          heightGap,
          matches: windowSizeMatches,
        })
      }
    }
  }, options.detectionInterval)

  return () => {
    clearInterval(id)
  }
}

export type DebugOpts = {
  /**
   * 是否开启禁用调试，你可根据环境变量设置
   * @default true
   */
  enable?: boolean
  secret: string
  /**
   * 开发按键，例如传入 'd'，则按住 shift + d 键，可以输入密码打开调试
   * @default 'd'
   */
  key?: string

  /**
   * 是否禁用 F12 按键
   * @default true
   */
  disableF12?: boolean
  /**
   * 是否禁用右键菜单
   * @default true
   */
  disableMenu?: boolean

  /**
   * 是否通过 debugger 暂停时长尝试检测调试器
   * @default true
   */
  detectDebugger?: boolean
  /**
   * 是否通过浏览器窗口内外尺寸差尝试检测停靠的开发者工具
   * @default true
   */
  detectWindowSize?: boolean
  /**
   * debugger 语句暂停超过该时长时视为检测命中，单位毫秒
   * @default 100
   */
  debuggerThreshold?: number
  /**
   * 调试检测的执行间隔，单位毫秒，最小值为 16
   * @default 1000
   */
  detectionInterval?: number
  /**
   * 浏览器窗口外部尺寸与页面内部尺寸的差值阈值，单位像素
   * @default 250
   */
  windowSizeThreshold?: number
  /**
   * 窗口尺寸异常需要连续命中的次数
   * @default 2
   */
  windowSizeMatchCount?: number
  /**
   * 检测到调试行为后是否跳转到 about:blank
   * @default true
   */
  redirectOnDetected?: boolean
  /**
   * 解锁标记的保存位置。none 表示刷新后需要重新解锁
   * @default 'session'
   */
  unlockStorage?: DebugUnlockStorage
  /** 检测到疑似调试行为时调用。回调先于可选跳转执行 */
  onDetected?: (event: DebugDetectionEvent) => void

  /**
   * 输入框 label 文本
   * @default 'Enter the debug password'
   */
  labelText?: string
  /**
   * 输入框按钮文本
   * @default 'Unlock'
   */
  btnText?: string
  /**
   * 输入框按钮样式的 style.cssText
   */
  btnStyleText?: string
  /**
   * 外层样式的 style.cssText
   */
  wrapStyleText?: string
  /**
   * input 样式的 style.cssText
   */
  inputStyleText?: string
}

export type DebugUnlockStorage = 'local' | 'session' | 'none'

/** 调试检测事件，包含检测原因和对应的原始测量值 */
export type DebugDetectionEvent = DebuggerPauseDetectionEvent | WindowSizeDetectionEvent

/** debugger 语句产生异常暂停时的检测事件 */
export interface DebuggerPauseDetectionEvent {
  reason: 'debugger-pause'
  detectedAt: number
  elapsed: number
}

/** 浏览器窗口尺寸连续异常时的检测事件 */
export interface WindowSizeDetectionEvent {
  reason: 'window-size'
  detectedAt: number
  widthGap: number
  heightGap: number
  matches: number
}

type DebugDetectionOptions = Required<Pick<DebugOpts, | 'detectDebugger'
  | 'detectWindowSize'
  | 'debuggerThreshold'
  | 'detectionInterval'
  | 'windowSizeThreshold'
  | 'windowSizeMatchCount'
  | 'redirectOnDetected'>> & Pick<DebugOpts, 'onDetected'>
