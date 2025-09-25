import { isBrowser, isNode } from '@/constants'

/**
 * 检查是否为浏览器环境，并且根据参数决定是否警告
 * @param needWarn 是否警告，默认 false
 * @returns 是否为浏览器环境
 *
 * @example
 * ```ts
 * // 基础用法
 * if (checkIsBrowser()) {
 *   console.log('当前在浏览器环境中')
 * } else {
 *   console.log('当前在 Node.js 环境中')
 * }
 * ```
 *
 * @example
 * ```ts
 * // 带警告的环境检查
 * if (checkIsBrowser(true)) {
 *   // 执行浏览器特定的代码
 *   document.getElementById('app')
 * } else {
 *   // 在 Node.js 环境中会显示警告
 * }
 * ```
 */
export function checkIsBrowser(needWarn = false) {
  if (isNode) {
    needWarn && console.warn('This function can only be used in Browser environment')
    return false
  }
  return true
}

/**
 * 检查是否为 Node 环境，并且根据参数决定是否警告
 * @param needWarn 是否警告，默认 false
 * @returns 是否为 Node.js 环境
 *
 * @example
 * ```ts
 * // 基础用法
 * if (checkIsNode()) {
 *   console.log('当前在 Node.js 环境中')
 *   // 可以使用 Node.js 特定的 API
 *   const fs = require('fs')
 * } else {
 *   console.log('当前在浏览器环境中')
 * }
 * ```
 *
 * @example
 * ```ts
 * // 带警告的环境检查
 * if (checkIsNode(true)) {
 *   // 执行 Node.js 特定的代码
 *   process.env.NODE_ENV
 * } else {
 *   // 在浏览器环境中会显示警告
 * }
 * ```
 */
export function checkIsNode(needWarn = false) {
  if (isBrowser) {
    needWarn && console.warn('This function can only be used in Node.js environment')
    return false
  }
  return true
}

/**
 * 警告值范围
 * @param name 参数名称
 * @param min 最小值，默认 0
 * @param max 最大值，默认 1
 *
 * @example
 * ```ts
 * // 基础用法
 * function setOpacity(value: number) {
 *   if (value < 0 || value > 1) {
 *     warnValueRange('opacity', 0, 1)
 *     return
 *   }
 *   element.style.opacity = value.toString()
 * }
 * ```
 *
 * @example
 * ```ts
 * // 自定义范围
 * function setProgress(value: number) {
 *   if (value < 0 || value > 100) {
 *     warnValueRange('progress', 0, 100)
 *     return
 *   }
 *   progressBar.style.width = `${value}%`
 * }
 * ```
 */
export function warnValueRange(name: string, min = 0, max = 1) {
  console.warn(
    `%c${name}:%c 值必须在 ${min} ~ ${max} 之间`,
    'background-color: #14c9fc; color: #fff; padding: 2px 4px; border-radius: 5px',
    'color: #e07f52',
  )
}
