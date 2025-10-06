import { fileURLToPath } from 'node:url'
import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import clear from 'rollup-plugin-clear'

export default defineConfig([
  // 通用版本 (浏览器兼容)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs', format: 'cjs' },
      { file: 'dist/index.js', format: 'es' },
    ],
    plugins: [
      ...getCommonPlugins(),
      typescript({
        compilerOptions: {
          rootDir: './src',
        },
      }),
      clear({
        targets: ['dist'],
        watch: true,
      }),
    ],
  },

  // Node.js 版本
  {
    input: 'node/index.ts',
    output: [
      { file: 'dist/node/index.cjs', format: 'cjs' },
      { file: 'dist/node/index.js', format: 'es' },
    ],
    plugins: [
      ...getCommonPlugins(),
      typescript({
        compilerOptions: {
          rootDir: './',
        },
      }),
    ],
  },

  {
    input: 'src/sw/streamDownload.js',
    output: [
      { file: 'dist/sw/streamDownload.js', format: 'es' },
      // use for test
      { file: 'public/streamDownload.js', format: 'es' },
    ],
    plugins: [
      terser(),
    ],
  },
])

function getCommonPlugins() {
  return [
    nodeResolve(), // 开启 node_modules 查找模块功能
    terser(),
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
  ]
}