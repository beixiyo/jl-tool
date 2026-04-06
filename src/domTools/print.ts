import type { getAllStyle } from './cssTool';
import { judgeImgLoad } from './eventTools'

/**
 * 在新窗口中写入待打印 DOM 与样式后调用 `print()`。**需在 http(s) 下使用**，`file://` 会直接警告并返回
 *
 * 建议仅在用户手势（如点击）中调用，避免连续弹出多窗口。
 *
 * @param el 要打印的 `HTMLElement` 或其 `outerHTML` 字符串
 * @param styleStr 注入到新文档 `<head>` 的样式 HTML，可用 {@link getAllStyle} 收集当前页样式
 * @param href `window.open` 的 URL，默认 `location.href`（用于同源与引用解析）
 * @returns 无
 *
 * @example
 * ```ts
 * btn.onclick = async () => {
 *   const styles = await getAllStyle()
 *   print(document.getElementById('invoice')!, styles)
 * }
 * ```
 */
export const print: Print = (
  el: string | HTMLElement,
  styleStr: string | undefined,
  href = location.href,
) => {
  if (window.location.protocol === 'file:')
    return console.warn('请启动服务运行; please start server')

  const win = window.open(href, '_blank')
  const doc = win?.document
  if (!doc)
    return

  const _elStr = typeof el === 'string'
    ? el
    : el.outerHTML

  doc.head.innerHTML = styleStr ?? ''
  doc.body.innerHTML = _elStr
  doc.body.style.padding = '10px'

  /** 定时器可以解决`window`因为开启深色模式打印的bug */
  setTimeout(async () => {
    const loadDone = await judgeImgLoad(doc)

    if (!loadDone) {
      win.confirm('图片加载失败，是否继续打印') && win.print()
      return
    }

    win.print()
  })
}

interface Print {
  /**
   * 打印 必须启动一个服务器才能用; ***建议使用事件交互，如按钮点击，否则可能打开多个窗口***
   * @param el 要打印的元素
   * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
   * @param href 打开的链接 默认使用`location.href`
   */
  (el: HTMLElement, styleStr: string | undefined, href?: string): void
  /**
   * 打印 必须启动一个服务器才能用; ***建议使用事件交互，如按钮点击，否则可能打开多个窗口***
   * @param elStr 要打印的元素字符串
   * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
   * @param href 打开的链接 默认使用`location.href`
   */
  (elStr: string, styleStr: string | undefined, href?: string): void
}

