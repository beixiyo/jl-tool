import { ROUTE_META } from '@app/routeMeta'
import { A, useLocation } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'

export function PageShell(props: PageShellProps) {
  const location = useLocation()

  /** 返回链接指向当前页面的上级入口：meta 里声明了 parent 用它，否则回首页 */
  const backPath = createMemo(() => ROUTE_META.find((item) => item.path === location.pathname)?.parent ?? '/')
  const backLabel = createMemo(() => ROUTE_META.find((item) => item.path === backPath())?.title ?? 'DOM playground')

  return (
    <main class="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header class="space-y-3">
          <A
            href={ backPath() }
            class="inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition hover:-translate-x-1 hover:text-emerald-200"
          >
            ← { backLabel() }
          </A>
          <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{ props.title }</h1>
          <p class="max-w-3xl text-sm leading-6 text-slate-400">{ props.description }</p>
        </header>
        { props.children }
      </div>
    </main>
  )
}

export interface PageShellProps {
  title: string
  description: string
  children: JSX.Element
}
