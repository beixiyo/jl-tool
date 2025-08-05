import fs from 'node:fs'
import { isNode } from '@/constants'

export function loadEnv(envPath: string) {
  if (!isNode) {
    console.warn('[loadEnv]: 非 Node 环境，跳过加载 .env 文件')
    return
  }

  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      const envLines = envContent.split('\n')

      envLines.forEach((line) => {
        /** 忽略注释和空行 */
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=')
          const value = valueParts.join('=').trim()
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
