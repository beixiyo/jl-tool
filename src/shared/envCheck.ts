import { isBrowser, isNode } from '@/constants'

/**
 * 检查是否为浏览器环境，并且根据参数决定是否警告
 * @param needWarn 是否警告
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
 * @param needWarn 是否警告
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
 * @param name 名称
 * @param min 最小值
 * @param max 最大值
 */
export function warnValueRange(name: string, min = 0, max = 1) {
  console.warn(
    `%c${name}:%c 值必须在 ${min} ~ ${max} 之间`,
    'background-color: #14c9fc; color: #fff; padding: 2px 4px; border-radius: 5px',
    'color: #e07f52',
  )
}
