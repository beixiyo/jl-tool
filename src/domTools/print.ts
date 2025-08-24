import { judgeImgLoad } from './eventTools'

/**
 * 打印 必须启动一个服务器才能用; **建议使用事件交互，如按钮点击，否则可能打开多个窗口**
 * @param el 要打印的元素
 * @param styleStr 样式 建议使用`getAllStyle`函数，可不传
 * @param href 打开的链接 默认使用`location.href`
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
