import type { JSX } from 'solid-js'

export function Panel(props: PanelProps) {
  return (
    <section class={`rounded-2xl border border-slate-800 bg-slate-900/80 p-5 ${props.class ?? ''}`}>
      {(props.title || props.description) && (
        <header class="mb-4 space-y-1">
          {props.title && <h2 class="font-semibold text-slate-100">{props.title}</h2>}
          {props.description && <p class="text-sm leading-6 text-slate-400">{props.description}</p>}
        </header>
      )}
      {props.children}
    </section>
  )
}

export interface PanelProps {
  title?: string
  description?: string
  class?: string
  children: JSX.Element
}
