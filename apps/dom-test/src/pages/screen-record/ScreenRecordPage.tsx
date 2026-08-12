import type { RecorderState } from '@/webApi/ScreenRecord/type'
import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { ScreenRecorder } from '@/webApi'

/** 使用真实 video、getDisplayMedia 和 ScreenRecorder 验证屏幕录制生命周期 */
export function ScreenRecordPage() {
  let videoElement!: HTMLVideoElement
  let recorder: ScreenRecorder | null = null
  let recordedUrl: string | null = null
  const [state, setState] = createSignal<RecorderState>('idle')
  const [status, setStatus] = createSignal(ScreenRecorder.isSupported()
    ? '就绪'
    : '当前环境不支持屏幕录制')
  const [recordInfo, setRecordInfo] = createSignal('')
  const [duration, setDuration] = createSignal<number | null>(null)

  const releaseVideo = () => {
    videoElement.srcObject = null
    videoElement.removeAttribute('src')
    videoElement.load()
  }

  const revokeRecordedUrl = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
      recordedUrl = null
    }
  }

  const createRecorder = () => {
    recorder = new ScreenRecorder({
      video: true,
      systemAudio: false,
      micAudio: false,
      onStart: () => {
        setState('recording')
        setStatus('正在录制')
        const stream = recorder?.getMediaStream()
        if (stream) {
          videoElement.src = ''
          videoElement.srcObject = stream
          void videoElement.play().catch(() => undefined)
        }
      },
      onPause: () => {
        setState('paused')
        setStatus('已暂停')
      },
      onResume: () => {
        setState('recording')
        setStatus('正在录制')
      },
      onStop: (blob) => {
        if (!blob) {
          setState('error')
          setStatus('录制未生成文件')
          return
        }
        revokeRecordedUrl()
        recordedUrl = URL.createObjectURL(blob)
        videoElement.srcObject = null
        videoElement.src = recordedUrl
        videoElement.muted = false
        setRecordInfo(`${(blob.size / 1024 / 1024).toFixed(2)} MB · ${recorder?.mimeType ?? 'unknown'}`)
        setState('stopped')
        setStatus('录制完成')
      },
      onStateChange: nextState => setState(nextState),
      onError: (error) => {
        setState('error')
        setStatus(error instanceof Error
          ? error.message
          : String(error))
      },
    })
    return recorder
  }

  const start = async () => {
    if (!ScreenRecorder.isSupported()) {
      setStatus('当前环境不支持屏幕录制')
      return
    }

    try {
      setStatus('正在请求屏幕共享权限…')
      await createRecorder().start()
    }
    catch (error) {
      recorder?.dispose()
      recorder = null
      setState('idle')
      setStatus(error instanceof Error
        ? error.message
        : '屏幕录制启动失败')
    }
  }

  const stop = async () => {
    if (!recorder)
      return
    try {
      setStatus('正在停止录制…')
      await recorder.stop()
    }
    catch (error) {
      setState('error')
      setStatus(error instanceof Error
        ? error.message
        : '屏幕录制停止失败')
    }
  }

  const dispose = () => {
    recorder?.dispose()
    recorder = null
    revokeRecordedUrl()
    releaseVideo()
    videoElement.muted = true
    setRecordInfo('')
    setDuration(null)
    setState('idle')
    setStatus('已释放录制资源')
  }

  onCleanup(() => {
    recorder?.dispose()
    recorder = null
    revokeRecordedUrl()
    if (videoElement) {
      videoElement.pause()
      releaseVideo()
    }
  })

  return (
    <PageShell title="ScreenRecord" description="使用真实 video 元素预览 getDisplayMedia，并验证 ScreenRecorder 的暂停、停止与资源销毁">
      <Panel title="屏幕录制" description="开始按钮会打开浏览器的屏幕选择器">
        <video
          ref={videoElement}
          class="mx-auto aspect-video w-full max-w-4xl rounded-2xl border border-slate-800 bg-black object-contain"
          controls
          playsinline
          muted
          onLoadedMetadata={() => {
            setDuration(Number.isFinite(videoElement.duration)
              ? videoElement.duration
              : null)
          }}
        />
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void start()} disabled={!ScreenRecorder.isSupported() || state() === 'recording' || state() === 'paused'}>开始录制</Button>
          <Button onClick={() => recorder?.pause()} disabled={state() !== 'recording'}>暂停</Button>
          <Button onClick={() => recorder?.resume()} disabled={state() !== 'paused'}>继续</Button>
          <Button onClick={() => void stop()} disabled={state() !== 'recording' && state() !== 'paused'}>停止录制</Button>
          <Button variant="danger" onClick={dispose} disabled={!recorder && !recordedUrl}>释放</Button>
          <StatusBadge tone={state() === 'error'
            ? 'danger'
            : state() === 'recording'
              ? 'warning'
              : state() === 'stopped'
                ? 'success'
                : 'neutral'}
          >
            {status()}
          </StatusBadge>
        </div>
        {recordInfo() && (
          <p class="mt-4 text-sm text-slate-300">
            录制信息：
            {recordInfo()}
            {duration() !== null && ` · ${duration()!.toFixed(2)} 秒`}
          </p>
        )}
      </Panel>
    </PageShell>
  )
}
