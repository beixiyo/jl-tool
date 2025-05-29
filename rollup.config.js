import { fileURLToPath } from 'node:url'
import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import clear from 'rollup-plugin-clear'

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      outputFormat('dist/index.cjs', 'cjs'),
      outputFormat('dist/index.js', 'es'),
    ],
    plugins: [
      nodeResolve(), // 开启`node_modules`查找模块功能
      terser(),
      typescript({
        compilerOptions: {
          rootDir: './src',
        },
      }),
      clear({
        targets: ['dist'],
        watch: true,
      }),

      alias({
        entries: [
          {
            find: '@',
            replacement: fileURLToPath(
              new URL('src', import.meta.url),
            ),
          },
        ],
      }),
    ],
  },

  {
    input: 'src/sw/streamDownload.js',
    output: [
      outputFormat('dist/sw/streamDownload.js', 'es'),
      // use for test
      outputFormat('public/streamDownload.js', 'es'),
    ],
    plugins: [
      terser(),
    ],
  },
])

/**
 * @param {string} file 文件路径
 * @param {'amd' | 'cjs' | 'commonjs' | 'es' | 'esm' | 'iife' | 'module' | 'system' | 'systemjs' | 'umd'} format 打包格式
 * @param {string} name 全部暴露对象名称
 * @returns 格式化打包对象
 */
function outputFormat(file, format, name) {
  return {
    file,
    format,
    name,
  }
}
