import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { openCamera } from '@/webApi'

/** 使用真实 video 元素验证摄像头流的开启、预览和关闭 */
export function CameraPage() {
  let videoElement!: HTMLVideoElement
  let stopCamera: (() => void) | null = null
  const [status, setStatus] = createSignal('未开启')
  const [isOpen, setIsOpen] = createSignal(false)

  const open = async () => {
    if (isOpen())
      return

    try {
      setStatus('正在请求摄像头权限…')
      stopCamera = await openCamera(videoElement)
      setIsOpen(true)
      setStatus('摄像头已开启')
    }
    catch (error) {
      setStatus(error instanceof Error
        ? error.message
        : '摄像头开启失败')
    }
  }

  const close = () => {
    stopCamera?.()
    stopCamera = null
    videoElement.srcObject = null
    setIsOpen(false)
    setStatus('摄像头已关闭')
  }

  onCleanup(() => {
    stopCamera?.()
    stopCamera = null
    if (videoElement)
      videoElement.srcObject = null
  })

  return (
    <PageShell title="Camera" description="使用真实 video 元素承载 getUserMedia 流，验证权限、预览和轨道释放">
      <Panel title="摄像头预览" description="浏览器权限只会在点击开启按钮后请求">
        <video ref={videoElement} class="mx-auto aspect-video w-full max-w-3xl rounded-2xl border border-slate-800 bg-black object-contain" autoplay playsinline muted />
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void open()} disabled={isOpen()}>开启摄像头</Button>
          <Button variant="danger" onClick={close} disabled={!isOpen()}>关闭摄像头</Button>
          <StatusBadge tone={isOpen()
            ? 'success'
            : 'neutral'}
          >
            {status()}
          </StatusBadge>
        </div>
      </Panel>
    </PageShell>
  )
}
