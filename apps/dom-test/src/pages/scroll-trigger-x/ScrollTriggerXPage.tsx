import { PageShell, StatusBadge } from '@app/components'
import { onCleanup, onMount } from 'solid-js'
import { ScrollTrigger } from '@/animation'

const sections = [
  { title: '弹跳效果', description: '元素随着横向滚动产生弹跳动画，模拟物理弹性效果。', tone: 'from-indigo-950 to-blue-900' },
  { title: '渐入渐出', description: '多个元素按顺序淡入并放大，展示平滑的过渡。', tone: 'from-violet-950 to-fuchsia-900' },
  { title: '3D 旋转', description: '元素在三维空间中旋转，创造出立体感和空间感。', tone: 'from-teal-950 to-cyan-900' },
  { title: '视差浮动', description: '多个气泡以不同速度移动，形成层次感。', tone: 'from-orange-950 to-rose-900' },
] as const

const bubbleColors = ['#ff3cac', '#784ba0', '#2b86c5', '#04befe', '#ff6b6b']
const bubbles = Array.from({ length: 5 }, (_, row) => Array.from({ length: 8 }, (_, index) => ({
  size: 28 + ((row * 17 + index * 13) % 52),
  left: index * 12 + ((row * 7 + index * 3) % 8),
  speed: 0.5 + ((row + index) % 5) * 0.18,
  color: bubbleColors[(row + index) % bubbleColors.length],
})))

/** ScrollTrigger 横向滚动的真实 DOM 页面 */
export function ScrollTriggerXPage() {
  let container!: HTMLDivElement
  let progressBar!: HTMLDivElement
  const sectionElements: HTMLElement[] = []
  const titleElements: HTMLElement[] = []
  const bounceElements: HTMLElement[] = []
  const fadeElements: HTMLElement[] = []
  const rotateElements: HTMLElement[] = []
  const bubbleElements: HTMLElement[] = []
  const triggers: ScrollTrigger[] = []

  onMount(() => {
    triggers.push(new ScrollTrigger({
      trigger: container,
      scroller: container,
      direction: 'horizontal',
      scrub: true,
      start: ['top', 'top'],
      end: ['bottom', 'bottom'],
      onUpdate: self => progressBar.style.width = `${self.progress * 100}%`,
    }))

    titleElements.forEach((title, index) => {
      const section = sectionElements[index]
      triggers.push(new ScrollTrigger({
        trigger: section,
        scroller: container,
        direction: 'horizontal',
        start: ['top', 'bottom'],
        end: ['center', 'bottom'],
        scrub: true,
        props: [
          { opacity: 0, x: '-100px' },
          { opacity: 1, x: '0px' },
        ],
        targets: title,
      }))
    })

    bounceElements.forEach((element, index) => {
      const section = sectionElements[index]
      triggers.push(new ScrollTrigger({
        trigger: section,
        scroller: container,
        direction: 'horizontal',
        start: ['top', 'bottom'],
        end: ['bottom', 'top'],
        scrub: true,
        ease: 'backInOut',
        onUpdate: (self) => {
          const scale = 0.5 + Math.sin(self.progress * Math.PI) * 0.5
          const y = Math.sin(self.progress * Math.PI * 2) * 50
          element.style.transform = `translate(-50%, calc(-50% + ${y}px)) scale(${scale}) rotate(${self.progress * 360}deg)`
        },
      }))
    })

    fadeElements.forEach((element, index) => {
      const section = sectionElements[1]
      const delay = (index * 0.2)
      triggers.push(new ScrollTrigger({
        trigger: section,
        scroller: container,
        direction: 'horizontal',
        start: ['top', 'bottom'],
        end: ['bottom', 'top'],
        scrub: true,
        onUpdate: (self) => {
          const progress = Math.max(0, Math.min(1, (self.progress - delay) * 1.5))
          element.style.opacity = String(progress >= 1
            ? 0
            : progress)
          element.style.transform = `translate(-50%, -50%) scale(${0.5 + progress})`
        },
      }))
    })

    rotateElements.forEach((element) => {
      const section = sectionElements[2]
      triggers.push(new ScrollTrigger({
        trigger: section,
        scroller: container,
        direction: 'horizontal',
        start: ['top', 'bottom'],
        end: ['top', 'top'],
        scrub: true,
        onUpdate: (self) => {
          const rotateY = 90 - self.progress * 360
          const scale = 0.5 + Math.sin(self.progress * Math.PI) * 0.5
          element.style.transform = `translate(-50%, -50%) perspective(1000px) rotateY(${rotateY}deg) scale(${scale})`
        },
      }))
    })

    bubbleElements.forEach((bubble, index) => {
      const section = sectionElements[3]
      const speed = Number(bubble.dataset.speed)
      triggers.push(new ScrollTrigger({
        trigger: section,
        scroller: container,
        direction: 'horizontal',
        start: ['top', 'bottom'],
        end: ['top', 'top'],
        scrub: true,
        onUpdate: (self) => {
          const offset = (self.progress - 0.5) * 240 * speed
          const scale = 0.8 + Math.sin(self.progress * Math.PI) * 0.4
          bubble.style.transform = `translateX(${offset}px) scale(${scale})`
        },
      }))
    })

    triggers.push(new ScrollTrigger({
      trigger: container,
      scroller: container,
      direction: 'horizontal',
      smoothScroll: { direction: 'horizontal' },
    }))
  })

  onCleanup(() => {
    triggers.forEach(trigger => trigger.destroy())
    triggers.length = 0
  })

  return (
    <PageShell title="ScrollTriggerX" description="横向滚动动画：所有场景、标题和气泡都是 Solid JSX 真实 DOM">
      <div class="mb-4 flex items-center gap-3">
        <StatusBadge tone="success">横向滚动</StatusBadge>
        <span class="text-sm text-slate-400">使用触控板或 Shift + 滚轮左右移动</span>
      </div>
      <div class="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <div ref={container} class="flex h-[min(70vh,720px)] min-h-140 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth">
          {sections.map((scene, index) => (
            <section ref={element => sectionElements[index] = element} class={`relative h-full min-w-full shrink-0 snap-start overflow-hidden bg-linear-to-br ${scene.tone}`}>
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_36%)]" />
              <h2 ref={element => titleElements[index] = element} class="absolute left-[10%] top-[12%] text-4xl font-semibold tracking-tight text-white sm:text-6xl">{scene.title}</h2>
              <p class="absolute bottom-[12%] left-[10%] max-w-xl text-base leading-7 text-slate-200">{scene.description}</p>

              {index === 0 && <div ref={element => bounceElements[0] = element} class="absolute left-1/2 top-1/2 flex h-48 w-48 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-linear-to-br from-amber-300 to-orange-600 text-xl font-bold text-white shadow-2xl">弹跳</div>}
              {index === 1 && (
                <div class="absolute inset-0">
                  {[0, 1, 2].map(item => (
                    <div ref={element => fadeElements[item] = element} class="absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-linear-to-br from-sky-400 to-cyan-300 text-lg font-bold text-slate-950 shadow-xl" style={{ left: `${25 + item * 25}%`, opacity: 0 }}>
                      渐入
                      {item + 1}
                    </div>
                  ))}
                </div>
              )}
              {index === 2 && <div ref={element => rotateElements[0] = element} class="absolute left-1/2 top-1/2 flex h-48 w-48 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-linear-to-br from-fuchsia-500 to-cyan-300 text-xl font-bold text-white shadow-2xl">3D</div>}
              {index === 3 && (
                <div class="absolute inset-0">
                  {bubbles.map((row, rowIndex) => (
                    <div class="absolute left-0 h-12 w-full" style={{ top: `${20 + rowIndex * 15}%` }}>
                      {row.map((bubble, bubbleIndex) => <span ref={element => bubbleElements[rowIndex * row.length + bubbleIndex] = element} data-speed={bubble.speed} class="absolute rounded-full opacity-70" style={{ 'width': `${bubble.size}px`, 'height': `${bubble.size}px`, 'left': `${bubble.left}%`, 'background-color': bubble.color, 'box-shadow': 'inset 5px 5px 12px rgba(255,255,255,.35)' }} />)}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/15"><div ref={progressBar} class="h-full w-0 bg-emerald-300 transition-[width]" /></div>
      </div>
    </PageShell>
  )
}
