import { timer } from '@/tools/timer'

/**
 * 检查页面更新
 */
export function autoUpdate(opts: AutoUpdateOpts = {}) {
  const CONFIRM_GAP = 1000 * 60 * 5,
    REFRESH_GAP = 1000 * 10

  const {
    needUpate = () => true,
    confirmGap = CONFIRM_GAP,
    refreshGap = REFRESH_GAP,
    confirmText = '页面有更新，是否刷新？'
  } = opts

  if (!needUpate()) return

  let stop: Function,
    scriptArr: string[] = [],
    styleArr: string[] = []

  stop = timer(async () => {
    const flag = await hasChange()
    if (flag) {
      const userConfirm = window.confirm(confirmText)
      if (userConfirm) {
        stop()
        window.location.reload()
      }
      // 若用户点击不更新 则一定时间后 再重新轮询
      else {
        stop()
        setTimeout(() => autoUpdate(opts), confirmGap)
      }
    }
  }, refreshGap)

  /***************************************************
   *                    Function
   ***************************************************/

  function getSrcArr(str: string) {
    const styleReg = /<link\s+(?=[^>]*rel=["']stylesheet["'])(?=[^>]*href=["'](?<src>[^"']+)["'])[^>]*?>/mig
    const scriptReg = /<script.*src=["'](?<src>.*?)["']>.*<\/script>/mig
    const linkScriptReg = /<link\s+(?=[^>]*rel=["']modulepreload["'])(?=[^>]*href=["'](?<src>[^"']+)["'])[^>]*?>/mig

    const scriptList: string[] = [],
      styleList: string[] = []
    let match: RegExpExecArray | null

    while ((match = scriptReg.exec(str))) {
      match?.groups && scriptList.push(match.groups.src)
    }

    while ((match = linkScriptReg.exec(str))) {
      match?.groups && scriptList.push(match.groups.src)
    }

    while ((match = styleReg.exec(str))) {
      match?.groups && styleList.push(match.groups.src)
    }

    return { scriptList, styleList }
  }

  /**
   * 检查页面是否更新
   */
  async function hasChange() {
    const html = await fetch(`/?timestamp=${Date.now()}`).then(res => res.text())

    const { scriptList, styleList } = getSrcArr(html)
    /**
     * 初始化
     */
    if (scriptArr.length === 0) {
      scriptArr = scriptList
      styleArr = styleList
      return false
    }

    if (scriptArr.length !== scriptList.length || styleArr.length !== styleList.length)
      return true

    for (let i = 0; i < scriptArr.length; i++) {
      if (scriptArr[i] !== scriptList[i]) return true
    }

    for (let i = 0; i < styleArr.length; i++) {
      const item = styleArr[i]
      if (item !== styleList[i]) return true
    }

    return false
  }
}


export type AutoUpdateOpts = {
  /**
   * 你可以根据环境变量决定是否自动检查更新
   * @example process.env.NODE_ENV !== 'production'
   */
  needUpate?: () => boolean
  /**
   * 再次询问是否更新的间隔毫秒，默认 5 分钟
   * @default 1000 * 60 * 5
   */
  confirmGap?: number
  /**
   * 检查更新间隔毫秒，默认 10 秒
   * @default 1000 * 10
   */
  refreshGap?: number
  /**
   * 确认刷新文案
   * @default
   * 页面有更新，是否刷新？
   */
  confirmText?: string
}