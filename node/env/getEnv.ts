import { checkIsBrowser } from '@/shared'

/**
 * 读取环境变量，如果不存在则使用默认值或显示错误信息
 * @param name 环境变量名称
 * @param defaultValue 默认值
 * @param required 是否必需
 * @returns 环境变量的值
 *
 * @example
 * ```ts
 * // 先加载环境变量文件（可选）
 * loadEnv() // 根据 NODE_ENV 自动选择文件
 *
 * // 基础用法
 * const apiUrl = getEnv('API_URL', 'http://localhost:3000')
 * const dbHost = getEnv('DB_HOST', 'localhost')
 * console.log(apiUrl) // 环境变量值或默认值
 * ```
 *
 * @example
 * ```ts
 * // 必需的环境变量
 * const secretKey = getEnv('SECRET_KEY', '', true)
 * // 如果 SECRET_KEY 未设置，程序会退出并显示错误信息
 * ```
 *
 * @example
 * ```ts
 * // 在浏览器环境中
 * const clientId = getEnv('CLIENT_ID', 'default-client-id')
 * // 在浏览器中会返回默认值
 * ```
 */
export function getEnv(name: string, defaultValue?: string, required = false) {
  if (checkIsBrowser()) {
    return defaultValue || ''
  }

  const value = process.env[name]
  if (required && !value) {
    console.error(`[getEnv]: 环境变量 ${name} 未设置，这是必需的变量`)
    process.exit(1)
  }
  return value || defaultValue || ''
}
