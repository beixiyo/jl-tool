import { isNode } from '@/constants'

/**
 * 读取环境变量，如果不存在则使用默认值或显示错误信息
 * @param name 环境变量名称
 * @param defaultValue 默认值
 * @param required 是否必需
 * @returns 环境变量的值
 */
export function getEnv(name: string, defaultValue?: string, required = false) {
  if (!isNode) {
    console.warn('[getEnv]: 非 Node 环境，跳过读取环境变量')
    return defaultValue || ''
  }

  const value = process.env[name] || defaultValue
  if (required && !value) {
    console.error(`[getEnv]: 环境变量 ${name} 未设置，这是必需的变量`)
    process.exit(1)
  }
  return value || ''
}
