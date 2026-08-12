import type { JSX } from 'solid-js'

const tones = {
  neutral: 'border-slate-700 bg-slate-800 text-slate-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
}

export function StatusBadge(props: StatusBadgeProps) {
  return (
    <span class={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[props.tone ?? 'neutral']}`}>
      {props.children}
    </span>
  )
}

export interface StatusBadgeProps {
  tone?: keyof typeof tones
  children: JSX.Element
}
