import type { JSX } from 'solid-js'

const variants = {
  primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
  secondary: 'border border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-500',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
}

export function Button(props: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      class={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[props.variant ?? 'secondary']} ${props.class ?? ''}`}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export interface ButtonProps {
  variant?: keyof typeof variants
  type?: 'button' | 'submit' | 'reset'
  class?: string
  disabled?: boolean
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  children: JSX.Element
}
