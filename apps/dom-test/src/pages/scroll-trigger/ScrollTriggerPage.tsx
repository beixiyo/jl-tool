import { PageShell, StatusBadge } from '@app/components'
import { onCleanup, onMount } from 'solid-js'
import { ScrollTrigger } from '@/animation'

const scenes = [
  {
    title: '山间雾气',
    text: '滚动页面，让背景在视口中产生缓慢的纵向视差',
    image: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  },
  {
    title: '静谧湖面',
    text: '每一段 section 都有独立的 trigger 和动画生命周期',
    image: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  },
  {
    title: '森林深处',
    text: '离开页面时自动 destroy，避免路由切换后残留监听器',
    image: 'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  },
] as const

/** ScrollTrigger 纵向滚动的真实 DOM 页面 */
export function ScrollTriggerPage() {
  const sections: HTMLElement[] = []
  const triggers: ScrollTrigger[] = []

  onMount(() => {
    const viewportHeight = document.documentElement.clientHeight
    sections.forEach((section) => {
      triggers.push(new ScrollTrigger({
        trigger: section,
        targets: section,
        scrub: true,
        smoothScroll: true,
        start: ['top', 'bottom'],
        end: ['bottom', 'top'],
        props: [
          { backgroundPositionY: `-${viewportHeight / 2}px` },
          { backgroundPositionY: `${viewportHeight / 2}px` },
        ],
      }))
    })
  })

  onCleanup(() => {
    triggers.forEach(trigger => trigger.destroy())
    sections.length = 0
  })

  return (
    <PageShell title="ScrollTrigger" description="纵向滚动视差示例：每个 section 都由 Solid JSX 声明，并把真实元素传给 ScrollTrigger">
      <div class="mb-4 flex items-center gap-3">
        <StatusBadge tone="success">
          {scenes.length}
          {' '}
          个真实 section
        </StatusBadge>
        <span class="text-sm text-slate-400">向下滚动查看背景位移</span>
      </div>
      <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        {scenes.map((scene, index) => (
          <section
            ref={element => sections[index] = element}
            class="relative flex h-[78vh] min-h-[520px] items-center justify-center bg-cover bg-center"
            style={{ 'background-image': `linear-gradient(180deg, rgba(2, 6, 23, 0.2), rgba(2, 6, 23, 0.86)), url('${scene.image}')` }}
          >
            <div class="relative z-10 max-w-xl px-6 text-center text-white">
              <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Scene
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 class="text-4xl font-semibold tracking-tight sm:text-6xl">{scene.title}</h2>
              <p class="mt-4 text-base leading-7 text-slate-200">{scene.text}</p>
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  )
}
