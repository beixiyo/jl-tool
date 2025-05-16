import { isNode } from '@/shared'

/**
 * 获取当前主题
 */
export function getCurTheme(defaultTheme: Theme = 'light'): Theme {
  if (isNode || !window.matchMedia) { // SSR 保护
    return defaultTheme // SSR 或不支持的环境的默认值
  }

  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  return darkModeMediaQuery.matches
    ? 'dark'
    : 'light'
}

/**
 * 是否为深色模式
 */
export const isDarkMode = (): boolean => getCurTheme() === 'dark'

/**
 * 监听用户主题变化
 * @param onLight 用户切换到浅色模式时触发
 * @param onDark 用户切换到深色模式时触发
 * @returns 解绑事件函数
 */
export function onChangeTheme(onLight?: VoidFunction, onDark?: VoidFunction): VoidFunction {
  if (isNode || !window.matchMedia) { // SSR 保护
    return () => { } // 无操作的清理函数
  }

  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = (e: MediaQueryListEvent) => {
    e.matches
      ? onDark?.()
      : onLight?.()
  }

  darkModeMediaQuery.addEventListener('change', handleThemeChange)

  return () => {
    darkModeMediaQuery.removeEventListener('change', handleThemeChange)
  }
}


export type Theme = 'light' | 'dark'
