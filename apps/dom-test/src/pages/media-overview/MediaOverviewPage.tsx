import { PageShell, Panel } from '@app/components'
import { A } from '@solidjs/router'
import { For } from 'solid-js'

const MEDIA_PAGES = [
  { path: '/tests/recorder', title: 'Recorder', description: '麦克风录音、音频播放与实时频谱' },
  { path: '/tests/speaker', title: 'Speaker', description: '文字转语音、参数调节与播放控制' },
  { path: '/tests/speak-to-txt', title: 'SpeakToTxt', description: '语音识别、连续识别与临时结果' },
  { path: '/tests/camera', title: 'Camera', description: '摄像头预览与 MediaStream 释放' },
  { path: '/tests/screen-record', title: 'ScreenRecord', description: '屏幕共享、录制、回放与销毁' },
] as const

/** 媒体 API 测试入口，所有功能页面都由 Solid Router 独立渲染 */
export function MediaOverviewPage() {
  return (
    <PageShell title="媒体 Web API" description="选择一个独立的 Solid 页面测试真实浏览器媒体能力">
      <Panel title="测试页面" description="每个页面都直接使用 JSX 元素承载 API 资源，不通过 iframe 或旧 DOM 初始化脚本复用">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <For each={MEDIA_PAGES}>
            {page => (
              <A href={page.path} class="group rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/70">
                <h2 class="font-semibold text-slate-100 group-hover:text-emerald-300">{page.title}</h2>
                <p class="mt-2 text-sm leading-6 text-slate-400">{page.description}</p>
                <code class="mt-4 block text-xs text-emerald-300">{page.path}</code>
              </A>
            )}
          </For>
        </div>
      </Panel>
    </PageShell>
  )
}
