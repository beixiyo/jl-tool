import { isBrowser } from '@/constants/tool'

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
  return isBrowser
    ? window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth
    : 0
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
  return isBrowser
    ? window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight
    : 0
}
