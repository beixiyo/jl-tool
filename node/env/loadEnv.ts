import { checkIsBrowser } from '@/shared'
import { normalizeConfig, type LoadEnvOptions } from './normalize'
import { createRequire } from 'node:module'

/**
 * 加载环境变量文件
 *
 * ## 参数优先级（从高到低）
 * 1. **envPath** - 直接指定的文件路径，优先级最高
 * 2. **NODE_ENV** - 环境变量，用于构建 `.env.${NODE_ENV}` 文件路径
 * 3. **默认文件** - 回退到 `.env` 文件
 *
 * ## 使用方式
 *
 * ### 1. 自动判断（推荐）
 * ```ts
 * loadEnv() // 根据 NODE_ENV 自动选择文件
 * ```
 *
 * ### 2. 指定文件路径
 * ```ts
 * loadEnv('.env.local')           // 相对路径
 * loadEnv('/path/to/.env.prod')   // 绝对路径
 * ```
 *
 * ### 3. 配置对象
 * ```ts
 * loadEnv({ envPath: '.env.local' })                    // 指定文件
 * loadEnv({ envDir: './config' })                       // 指定目录
 * loadEnv({ envPath: '.env.local', envDir: './config' }) // 组合使用
 * ```
 *
 * ## 文件查找逻辑
 *
 * ### 当 envPath 为空时：
 * 1. 检查 `NODE_ENV` 环境变量
 * 2. 如果存在，尝试加载 `{envDir}/.env.${NODE_ENV}`
 * 3. 如果不存在，回退到 `{envDir}/.env`
 * 4. 如果都不存在，输出提示信息
 *
 * ### 当 envPath 有值时：
 * 1. 如果是相对路径，基于 `envDir` 解析
 * 2. 如果是绝对路径，直接使用
 * 3. 加载指定文件
 *
 * @param input 配置参数，可以是字符串路径或配置对象
 *
 * @example
 * ```ts
 * // 开发环境自动加载
 * process.env.NODE_ENV = 'develop'
 * loadEnv() // 加载 .env.develop 或 .env
 *
 * // 生产环境自动加载
 * process.env.NODE_ENV = 'production'
 * loadEnv() // 加载 .env.production 或 .env
 *
 * // 手动指定文件
 * loadEnv('.env.local')
 *
 * // 指定目录
 * loadEnv({ envDir: './config' })
 * ```
 */
export function loadEnv(input?: string | LoadEnvOptions) {
  if (checkIsBrowser()) {
    return
  }

  try {
    /** 使用 createRequire 以兼容 ESM 和 CJS 模式 */
    let fs: typeof import('node:fs')
    let path: typeof import('node:path')

    if (typeof require !== 'undefined') {
      // CJS 环境，直接使用 require
      fs = require('node:fs') as typeof import('node:fs')
      path = require('node:path') as typeof import('node:path')
    }
    else {
      // ESM 环境，使用 createRequire 创建 require 函数
      const require = createRequire(import.meta.url)
      fs = require('node:fs') as typeof import('node:fs')
      path = require('node:path') as typeof import('node:path')
    }

    // 归一化配置参数
    const config = normalizeConfig(input)
    let envPath: string | null = null

    // 优先级 1: envPath 直接指定文件路径
    if (config.envPath) {
      if (path.isAbsolute(config.envPath)) {
        // 绝对路径，直接使用
        envPath = config.envPath
      }
      else {
        // 相对路径，基于 envDir 解析
        envPath = path.resolve(config.envDir, config.envPath)
      }
    }
    else {
      // 优先级 2: 根据 NODE_ENV 自动判断
      const nodeEnv = process.env.NODE_ENV

      if (nodeEnv) {
        // 根据 NODE_ENV 构建环境文件路径
        const envFileName = `.env.${nodeEnv}`
        envPath = path.resolve(config.envDir, envFileName)

        // 如果环境特定文件不存在，尝试加载默认的 .env 文件
        if (!fs.existsSync(envPath)) {
          const defaultEnvPath = path.resolve(config.envDir, '.env')
          if (fs.existsSync(defaultEnvPath)) {
            envPath = defaultEnvPath
            console.log(`[loadEnv]: 环境文件 .env.${nodeEnv} 不存在，加载默认 .env 文件`)
          }
          else {
            console.log(`[loadEnv]: 未找到环境文件 (.env.${nodeEnv} 或 .env)`)
            return
          }
        }
      }
      else {
        // 优先级 3: 没有 NODE_ENV，尝试加载默认的 .env 文件
        envPath = path.resolve(config.envDir, '.env')
        if (!fs.existsSync(envPath)) {
          console.log(`[loadEnv]: 未设置 NODE_ENV 且未找到 .env 文件`)
          return
        }
      }
    }

    // 确保 envPath 不为空
    if (envPath && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      const envLines = envContent.split('\n')

      envLines.forEach((line) => {
        /** 忽略注释和空行 */
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=')
          let value = valueParts
            .join('=') // 合并等号
            .trim()
            .split('#')[0] // 忽略注释
            .trim() // 忽略空格

          if (value.startsWith(`'`) && value.endsWith(`'`)) {
            value = value.slice(1, -1)
          }
          else if (value.startsWith(`"`) && value.endsWith(`"`)) {
            value = value.slice(1, -1)
          }

          if (key && value) {
            process.env[key.trim()] = value
          }
        }
      })
      console.log(`[loadEnv]: 已加载 ${envPath}`)
    }
  }
  catch (err) {
    console.error('加载 .env 文件失败:', err)
  }
}
