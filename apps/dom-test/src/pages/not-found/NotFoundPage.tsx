import { A } from '@solidjs/router'

export function NotFoundPage() {
  return (
    <main class="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-100">
      <div>
        <p class="text-sm font-medium text-rose-300">404</p>
        <h1 class="mt-3 text-3xl font-semibold">测试页面不存在</h1>
        <A href="/" class="mt-6 inline-flex rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
          返回测试首页
        </A>
      </div>
    </main>
  )
}
