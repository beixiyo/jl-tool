import { createRequire } from 'node:module'
import { checkIsBrowser } from '@/shared'

export function loadEnv(envPath: string) {
  if (checkIsBrowser()) {
    return
  }

  try {
    /** 使用 createRequire 以兼容 ESM 和 CJS 模式 */
    let fs: typeof import('node:fs')

    if (typeof require !== 'undefined') {
      // CJS 环境，直接使用 require
      fs = require('node:fs') as typeof import('node:fs')
    }
    else {
      // ESM 环境，使用 createRequire 创建 require 函数
      const require = createRequire(import.meta.url)
      fs = require('node:fs') as typeof import('node:fs')
    }
    if (fs.existsSync(envPath)) {
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
