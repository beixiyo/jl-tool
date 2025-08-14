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
      { file: 'dist/index.cjs', format: 'cjs' },
      { file: 'dist/index.js', format: 'es' },
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
      { file: 'dist/sw/streamDownload.js', format: 'es' },
      // use for test
      { file: 'public/streamDownload.js', format: 'es' },
    ],
    plugins: [
      terser(),
    ],
  },
])
