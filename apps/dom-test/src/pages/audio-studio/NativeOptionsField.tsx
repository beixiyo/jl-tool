/** 原生配置 JSON 编辑器；不执行用户脚本，提交时由调用方解析 */
import type { MediaOptions } from '@/webApi/recording'

export function NativeOptionsField(props: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label class="block text-sm text-slate-300">
      <span>{ props.label }</span>
      <textarea
        aria-label={ props.label }
        class="mt-2 min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs disabled:opacity-40"
        value={ props.value }
        disabled={ props.disabled }
        onInput={ (event) => props.onChange(event.currentTarget.value) }
        spellcheck={ false }
      />
    </label>
  )
}

/** 非对象输入直接拒绝，避免无效配置被默默忽略 */
export function parseOptions<T extends object>(text: string): T {
  const value: unknown = JSON.parse(text)
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('配置必须是 JSON 对象')
  return value as T
}

/** 函数模式演示默认值加工；不把资源实例交给配置函数 */
export function nativeOptions<T extends object>(text: string, functional: boolean): MediaOptions<T> {
  const options = parseOptions<T>(text)
  return functional
    ? (defaults) => ({ ...defaults, ...options })
    : options
}
