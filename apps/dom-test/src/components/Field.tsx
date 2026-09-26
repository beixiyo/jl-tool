import { For } from 'solid-js'

/** 带标签的下拉选择 */
export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  return (
    <label class="block text-sm text-slate-300">
      <span class="text-xs text-slate-500">{props.label}</span>
      <select
        class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm disabled:opacity-40"
        value={props.value}
        disabled={props.disabled}
        onChange={event => props.onChange(event.currentTarget.value as T)}
      >
        <For each={props.options}>
          {option => <option value={option.value}>{option.label ?? option.value}</option>}
        </For>
      </select>
    </label>
  )
}

/** 带文字的复选框 */
export function Toggle(props: ToggleProps) {
  return (
    <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
      <input
        type="checkbox"
        class="h-4 w-4 accent-emerald-400"
        checked={props.checked}
        disabled={props.disabled}
        onChange={event => props.onChange(event.currentTarget.checked)}
      />
      {props.children}
    </label>
  )
}

export interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: readonly { value: T, label?: string }[]
  disabled?: boolean
  onChange: (value: T) => void
}

export interface ToggleProps {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  children: string
}
