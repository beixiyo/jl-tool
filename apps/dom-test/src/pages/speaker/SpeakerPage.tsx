import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { Speaker } from '@/webApi'

/** 使用真实 SpeechSynthesisUtterance 验证文字转语音参数与播放控制 */
export function SpeakerPage() {
  let speaker: Speaker | null = null
  let voicesChangedHandler: (() => void) | null = null

  const [text, setText] = createSignal('你好，这是一个文字转语音的测试。今天天气真不错！')
  const [rate, setRate] = createSignal(1)
  const [pitch, setPitch] = createSignal(1)
  const [volume, setVolume] = createSignal(1)
  const [voiceIndex, setVoiceIndex] = createSignal(-1)
  const [voices, setVoices] = createSignal<SpeechSynthesisVoice[]>([])
  const [status, setStatus] = createSignal('就绪')

  const loadVoices = () => {
    if (typeof speechSynthesis === 'undefined')
      return
    setVoices(speechSynthesis.getVoices())
  }

  loadVoices()
  if (typeof speechSynthesis !== 'undefined') {
    voicesChangedHandler = loadVoices
    speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler)
  }

  const getSpeaker = () => {
    if (!speaker) {
      speaker = new Speaker({
        txt: text(),
        rate: rate(),
        pitch: pitch(),
        volume: volume(),
      })
    }
    return speaker
  }

  const play = () => {
    if (typeof speechSynthesis === 'undefined') {
      setStatus('当前浏览器不支持语音合成')
      return
    }

    const instance = getSpeaker()
    instance.setText(text()).setRate(rate()).setPitch(pitch()).setVolume(volume())
    if (voiceIndex() >= 0)
      instance.setVoice(voiceIndex())
    instance.play(() => setStatus('播放完成'))
    setStatus('正在播放')
  }

  const stop = () => {
    speaker?.stop()
    setStatus('已停止')
  }

  const pause = () => {
    speaker?.pause()
    setStatus('已暂停')
  }

  const resume = () => {
    speaker?.resume()
    setStatus('正在播放')
  }

  const disposeSpeaker = () => {
    if (!speaker)
      return

    speaker.stop()
    /** Speaker 当前版本没有公开 dispose；移除它注册的 voiceschanged 监听器，避免路由切换后继续持有实例 */
    const internal = speaker as unknown as { initVoice?: () => void }
    if (typeof speechSynthesis !== 'undefined' && internal.initVoice)
      speechSynthesis.removeEventListener('voiceschanged', internal.initVoice)
    speaker = null
  }

  onCleanup(() => {
    disposeSpeaker()
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel()
      if (voicesChangedHandler)
        speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler)
    }
  })

  return (
    <PageShell title="Speaker" description="使用真实 SpeechSynthesis API 播放文本，并实时调整语速、音高和音量">
      <Panel title="语音参数" description="播放动作会创建 Speaker；页面卸载时停止当前语音">
        <textarea
          class="min-h-32 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
          value={text()}
          onInput={event => setText(event.currentTarget.value)}
          placeholder="请输入要转换为语音的文字…"
        />
        <div class="mt-5 grid gap-4 md:grid-cols-3">
          <RangeField label="语速" value={rate()} min="0.1" max="10" step="0.1" onInput={(value) => { const next = Number(value); setRate(next); speaker?.setRate(next) }} />
          <RangeField label="音高" value={pitch()} min="0" max="2" step="0.1" onInput={(value) => { const next = Number(value); setPitch(next); speaker?.setPitch(next) }} />
          <RangeField label="音量" value={volume()} min="0" max="1" step="0.1" onInput={(value) => { const next = Number(value); setVolume(next); speaker?.setVolume(next) }} />
        </div>
        <label class="mt-5 block text-sm text-slate-300">
          可用声音
          <select class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" value={voiceIndex()} onChange={event => setVoiceIndex(Number(event.currentTarget.value))}>
            <option value="-1">浏览器默认声音</option>
            {voices().map((voice, index) => (
              <option value={index}>
                {voice.name}
                {' '}
                ·
                {' '}
                {voice.lang}
              </option>
            ))}
          </select>
        </label>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={play}>播放</Button>
          <Button onClick={pause}>暂停</Button>
          <Button onClick={resume}>继续</Button>
          <Button variant="danger" onClick={stop}>停止</Button>
          <StatusBadge tone="neutral">{status()}</StatusBadge>
        </div>
      </Panel>
    </PageShell>
  )
}

function RangeField(props: { label: string, value: number, min: string, max: string, step: string, onInput: (value: string) => void }) {
  return (
    <label class="block text-sm text-slate-300">
      <span class="flex justify-between">
        <span>{props.label}</span>
        <output>{props.value.toFixed(1)}</output>
      </span>
      <input class="mt-2 w-full accent-emerald-400" type="range" min={props.min} max={props.max} step={props.step} value={props.value} onInput={event => props.onInput(event.currentTarget.value)} />
    </label>
  )
}
