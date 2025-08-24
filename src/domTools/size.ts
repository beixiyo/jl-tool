import { isNode } from '@/constants/tool'

/** 获取浏览器内容宽度 */
export function getWinWidth() {
  return isNode
    ? 0
    : window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth
}
/** 获取浏览器内容高度 */
export function getWinHeight() {
  return isNode
    ? 0
    : window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight
}
