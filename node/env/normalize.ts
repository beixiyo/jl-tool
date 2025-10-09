import { isObj, isStr } from '@/shared'

/**
 * 参数归一化函数
 * @param input 输入参数，可以是字符串路径或配置对象
 * @returns 归一化后的配置
 */
export function normalizeConfig(input?: string | LoadEnvOptions): NormalizedConfig {
  // 默认配置
  const defaultConfig: NormalizedConfig = {
    envPath: null,
    envDir: process.cwd()
  }

  // 如果没有输入参数
  if (!input) {
    return defaultConfig
  }

  // 如果是字符串，作为 envPath
  if (isStr(input)) {
    return {
      ...defaultConfig,
      envPath: input
    }
  }

  // 如果是配置对象
  if (isObj(input)) {
    return {
      envPath: input.envPath || null,
      envDir: input.envDir || process.cwd()
    }
  }

  return defaultConfig
}

/**
 * loadEnv 函数的配置选项
 */
export type LoadEnvOptions = {
  /** 环境变量文件路径，优先级最高 */
  envPath?: string
  /** 环境变量文件目录，默认为项目根目录 */
  envDir?: string
}

/**
 * 归一化后的配置参数
 */
type NormalizedConfig = {
  envPath: string | null
  envDir: string
}
