/**
 * 监听用户主题变化
 * @param onLight 用户切换到浅色模式时触发
 * @param onDark 用户切换到深色模式时触发
 * @returns 解绑事件函数
 */
export function onChangeTheme(onLight: VoidFunction, onDark: VoidFunction) {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = (e: MediaQueryListEvent) => {
    e.matches
      ? onDark()
      : onLight()
  }

  darkModeMediaQuery.addEventListener('change', handleThemeChange)

  return () => {
    darkModeMediaQuery.removeEventListener('change', handleThemeChange)
  }
}

/**
 * 获取当前主题
 */
export function getCurTheme() {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  return darkModeMediaQuery.matches
    ? 'dark'
    : 'light'
}

/**
 * 绑定 window 事件，返回解绑事件
 * @param eventName window.addEventListener 事件名称
 * @param listener window.addEventListener 事件回调
 * @param options window.addEventListener 配置项
 * @returns 解绑事件函数
 */
export function bindWinEvent<K extends keyof WindowEventMap>(
  eventName: K,
  listener: WinListenerParams<K>[1],
  options?: WinListenerParams<K>[2]
) {
  window.addEventListener(eventName, listener, options)
  const unBind = () => {
    window.removeEventListener(eventName, listener, options)
  }

  return unBind
}

/**
 * 判断页面所有图片是否加载完成
 * @param el 要判断的元素 默认 document
 * @returns 是否加载完成
 */
export const judgeImgLoad = (el = document): Promise<boolean> => {
  const imgArr = el.querySelectorAll('img')

  const promArr = Array.from(imgArr).map(
    img => new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
  )

  return new Promise((resolve) => {
    Promise.all(promArr)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}

/**
 * 返回一个双击键盘事件
 * @param key 键盘码（KeyboardEvent.key）
 * @param fn 双击后执行函数
 * @param gap 间隔时间，默认 150
 */
export function doubleKeyDown<T, R>(
  key: string,
  fn: (this: T, e: KeyboardEvent, ...args: any[]) => R,
  gap = 150,
  {
    triggerKey = 'key'
  }: DoubleKeyDownOpts = {}
) {
  /**
   * 调用函数记录初始时间，你不可能立即点击
   * 所以下面的判断进不去
   */
  let st = Date.now()

  return (e: KeyboardEvent) => {
    if (e[triggerKey] !== key) return

    const now = Date.now()
    /**
     * 第一次点击肯定超过了间隔时间，所以重新赋值 st
     * 下次按下按键，只要在间隔时间内就算双击
     */
    if (now - st <= gap) {
      return fn.call(this, e) as R
    }
    st = now
  }
}

/** 
 * 适配主流浏览器的全屏。若已全屏，则退出全屏
 * @param dom 要全屏的元素
 */
export const fullScreen = (dom?: HTMLElement) => {
  const
    doc = document as any,
    root = document.documentElement as any,
    rfs =
      root.requestFullscreen ||
      root.webkitRequestFullscreen ||
      root.mozRequestFullScreen ||
      root.msRequestFullscreen,
    efs =
      doc.exitFullscreen ||
      doc.webkitCancelFullScreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen

  if (!rfs) return

  const isFull =
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement

  if (dom) {
    isFull
      ? efs.call(dom)
      : rfs.call(dom)
  }
  else {
    isFull
      ? efs.call(root)
      : rfs.call(root)
  }
}


export type WinListenerParams<K extends keyof WindowEventMap> = Parameters<typeof window.addEventListener<K>>

export type DoubleKeyDownOpts = {
  /**
   * 触发的按键（KeyboardEvent.key）
   * @default key
   */
  triggerKey?: keyof KeyboardEvent
}