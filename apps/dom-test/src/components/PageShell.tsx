import type { JSX } from 'solid-js'
import { A } from '@solidjs/router'

export function PageShell(props: PageShellProps) {
  return (
    <main class="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header class="space-y-3">
          <A href="/" class="inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition hover:-translate-x-1 hover:text-emerald-200">
            ← DOM playground
          </A>
          <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{props.title}</h1>
          <p class="max-w-3xl text-sm leading-6 text-slate-400">{props.description}</p>
        </header>
        {props.children}
      </div>
    </main>
  )
}

export interface PageShellProps {
  title: string
  description: string
  children: JSX.Element
}
