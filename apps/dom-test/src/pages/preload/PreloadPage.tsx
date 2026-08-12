import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal } from 'solid-js'
import { preloadImgs } from '@/tools/preload'

const colors = ['0ea5e9', '38bdf8', 'a78bfa']
const createSvgDataUrl = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#${color}"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function PreloadPage() {
  const [status, setStatus] = createSignal<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = createSignal('等待开始')
  const start = async () => {
    setStatus('loading')
    setMessage('正在并发预加载 3 个内联 SVG…')
    try {
      await preloadImgs(colors.map(createSvgDataUrl), { timeout: 3000, concurrentCount: 3 })
      setStatus('success')
      setMessage('3 个资源全部加载完成')
    }
    catch {
      setStatus('error')
      setMessage('预加载失败，请查看 Network 面板')
    }
  }

  return (
    <PageShell title="图片预加载" description="直接调用 preloadImgs，使用内联 SVG 验证并发加载和 Promise 收敛，不依赖外部服务。">
      <Panel title="Resource preloader">
        <div class="grid grid-cols-3 gap-3">{colors.map(color => <div class="aspect-square rounded-2xl" style={{ 'background-color': `#${color}` }} />)}</div>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={start} disabled={status() === 'loading'}>
            {status() === 'loading'
              ? '加载中…'
              : '开始预加载'}
          </Button>
          <StatusBadge tone={status() === 'success'
            ? 'success'
            : status() === 'error'
              ? 'danger'
              : status() === 'loading'
                ? 'warning'
                : 'neutral'}
          >
            {status()}
          </StatusBadge>
        </div>
        <p class="mt-4 text-sm text-slate-400">{message()}</p>
      </Panel>
    </PageShell>
  )
}
