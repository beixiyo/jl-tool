import { isNode } from '@/constants/tool'

/**
 * 视口内容宽度（`SSR` / 非浏览器环境下为 `0`）
 * @returns 像素宽度
 *
 * @example
 * ```ts
 * const w = getWinWidth()
 * ```
 */
export function getWinWidth() {
  return isNode
    ? 0
    : window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth
}
/**
 * 视口内容高度（`SSR` / 非浏览器环境下为 `0`）
 * @returns 像素高度
 *
 * @example
 * ```ts
 * const h = getWinHeight()
 * ```
 */
export function getWinHeight() {
  return isNode
    ? 0
    : window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight
}
