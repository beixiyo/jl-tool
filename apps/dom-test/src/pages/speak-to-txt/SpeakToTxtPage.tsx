import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { SpeakToTxt } from '@/webApi'

/** 使用真实 SpeechRecognition 验证连续识别、临时结果和生命周期 */
export function SpeakToTxtPage() {
  let recognition: SpeakToTxt | null = null
  let mounted = true
  const [continuous, setContinuous] = createSignal(false)
  const [interimResults, setInterimResults] = createSignal(true)
  const [isRecognizing, setIsRecognizing] = createSignal(false)
  const [status, setStatus] = createSignal('就绪')
  const [result, setResult] = createSignal('等待识别…')

  const supported = () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  const start = () => {
    if (isRecognizing())
      return
    if (!supported()) {
      setStatus('当前浏览器不支持语音识别，请使用 Chrome 或 Edge')
      return
    }

    try {
      recognition?.stop()
      recognition = new SpeakToTxt({
        continuous: continuous(),
        interimResults: interimResults(),
        lang: 'zh-CN',
        onstart: () => {
          if (!mounted)
            return
          setIsRecognizing(true)
          setStatus('正在识别')
        },
        onEnd: () => {
          if (!mounted)
            return
          setIsRecognizing(false)
          setStatus('识别结束')
        },
        onResult: (_data, event) => {
          if (!mounted)
            return
          const lines: string[] = []
          for (let index = 0; index < event.results.length; index += 1) {
            const item = event.results[index]
            lines.push(`${item.isFinal
              ? '✓'
              : '…'} ${item[0].transcript}`)
          }
          setResult(lines.join('\n') || '等待识别…')
        },
      })
      recognition.start()
    }
    catch (error) {
      setIsRecognizing(false)
      setStatus(error instanceof Error
        ? error.message
        : '语音识别启动失败')
    }
  }

  const stop = () => {
    try {
      recognition?.stop()
    }
    catch {
      /** 识别器已经结束时，浏览器可能抛出 InvalidStateError */
    }
    setIsRecognizing(false)
    setStatus('已停止')
  }

  onCleanup(() => {
    mounted = false
    try {
      recognition?.stop()
    }
    catch {
      /** 忽略已经结束的识别器 */
    }
    recognition = null
  })

  return (
    <PageShell title="SpeakToTxt" description="使用真实 SpeechRecognition 将麦克风语音转换为文本，识别仅由按钮触发">
      <div class="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <Panel title="识别设置" description="连续识别与临时结果会在下一次启动时生效">
          <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={continuous()} onChange={event => setContinuous(event.currentTarget.checked)} />
            连续识别
          </label>
          <label class="mt-3 flex cursor-pointer items-center gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={interimResults()} onChange={event => setInterimResults(event.currentTarget.checked)} />
            返回临时结果
          </label>
          <div class="mt-5 flex flex-wrap gap-3">
            <Button onClick={start} disabled={isRecognizing()}>开始识别</Button>
            <Button variant="danger" onClick={stop} disabled={!isRecognizing()}>停止识别</Button>
          </div>
          <div class="mt-5">
            <StatusBadge tone={isRecognizing()
              ? 'warning'
              : supported()
                ? 'success'
                : 'danger'}
            >
              {status()}
            </StatusBadge>
          </div>
        </Panel>
        <Panel title="识别结果" description="最终结果和临时结果会按照浏览器返回的序列显示">
          <pre class="min-h-48 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-200">{result()}</pre>
        </Panel>
      </div>
    </PageShell>
  )
}
