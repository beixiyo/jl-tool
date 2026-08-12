import { ROUTE_META } from '@app/routeMeta'
import { A } from '@solidjs/router'
import { For } from 'solid-js'

export function HomePage() {
  return (
    <main class="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:px-8">
      <div class="mx-auto max-w-6xl">
        <header class="max-w-3xl space-y-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">@jl-org/tool</p>
          <h1 class="text-4xl font-semibold tracking-tight text-white sm:text-6xl">真实 DOM 测试场</h1>
        </header>

        <section class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <For each={ROUTE_META}>
            {item => (
              <A
                href={item.path}
                class="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-slate-900"
              >
                <div class="flex items-center justify-between gap-4">
                  <span class="text-xs font-medium uppercase tracking-wider text-slate-500">{item.group}</span>
                  <span class="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-300">→</span>
                </div>
                <h2 class="mt-5 text-lg font-semibold text-slate-100">{item.title}</h2>
                <p class="mt-2 min-h-10 text-sm leading-5 text-slate-400">{item.description}</p>
                <code class="mt-5 block text-xs text-emerald-300/80">{item.path}</code>
              </A>
            )}
          </For>
        </section>
      </div>
    </main>
  )
}
