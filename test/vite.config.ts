import { defineConfig } from 'vite'
import { resolve } from 'node:path'


export default defineConfig(() => {
    return {
        resolve: {
            alias: {
                // 方便调试用的
                '@': resolve(__dirname, '../src'),
            }
        }
    }
})
