import type { StreamDownloader } from '@/fileTool/streamDownloader'
import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { createStreamDownloader } from '@/fileTool/streamDownloader'

export function StreamDownloaderPage() {
  const [running, setRunning] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const [message, setMessage] = createSignal('选择一种下载策略')
  let active: StreamDownloader | undefined
  let cancelled = false

  const write = async (downloader: StreamDownloader, text: string) => {
    await downloader.append(new TextEncoder().encode(text))
  }
  const run = async (useServiceWorker: boolean) => {
    if (running())
      return
    cancelled = false
    setRunning(true)
    setProgress(0)
    setMessage(useServiceWorker
      ? '尝试 Service Worker，失败时自动回退…'
      : '准备 Blob / File System Access 下载…')
    try {
      active = await createStreamDownloader('jl-tool-stream-demo.txt', useServiceWorker
        ? { swPath: '/streamDownload.js', mimeType: 'text/plain' }
        : { mimeType: 'text/plain' })
      for (let index = 0; index < 20 && !cancelled; index++) {
        await write(active, `Line ${index}\n`)
        setProgress(index + 1)
        await new Promise(resolve => setTimeout(resolve, 80))
      }
      if (cancelled) {
        await active.abort()
        setMessage('下载已取消')
      }
      else {
        await active.complete()
        setMessage('下载已完成，浏览器可能已打开保存对话框')
      }
    }
    catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : '下载失败')
    }
    finally {
      active = undefined
      setRunning(false)
    }
  }
  const abort = async () => {
    cancelled = true
    if (active)
      await active.abort()
  }
  onCleanup(() => { cancelled = true; void active?.abort() })

  return (
    <PageShell title="Stream Downloader" description="通过生产流式下载器分块写入文本，展示 Service Worker 和浏览器回退路径。">
      <Panel title="下载测试" description="默认生成 20 行文本，每一块写入后更新 Solid 进度状态。">
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge tone={running()
            ? 'warning'
            : progress() === 20
              ? 'success'
              : 'neutral'}
          >
            {running()
              ? 'writing'
              : progress() === 20
                ? 'completed'
                : 'idle'}
          </StatusBadge>
          <span class="text-sm text-slate-400">{message()}</span>
        </div>
        <div class="mt-6 h-3 overflow-hidden rounded-full bg-slate-800"><div class="h-full rounded-full bg-sky-400 transition-[width]" style={{ width: `${progress() / 20 * 100}%` }} /></div>
        <div class="mt-3 text-sm text-slate-400">
          {progress()}
          {' '}
          / 20 chunks
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={running()}>文件下载</Button>
          <Button onClick={() => run(true)} disabled={running()}>Service Worker 下载</Button>
          <Button variant="danger" onClick={abort} disabled={!running()}>取消</Button>
        </div>
      </Panel>
    </PageShell>
  )
}
