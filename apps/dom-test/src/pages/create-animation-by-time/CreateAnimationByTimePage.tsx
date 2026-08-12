import type { TimeFunc } from '@/animation/types'
import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup } from 'solid-js'
import { ATo, createAnimationByTime } from '@/animation'

export function CreateAnimationByTimePage() {
  let basicBox!: HTMLDivElement
  let easingBox!: HTMLDivElement
  let chainFirst!: HTMLDivElement
  let chainSecond!: HTMLDivElement
  const handles: Array<{ stop: VoidFunction }> = []
  const [basicProgress, setBasicProgress] = createSignal(0)
  const [objectProgress, setObjectProgress] = createSignal(0)
  const [objectValue, setObjectValue] = createSignal(0)
  const [easing, setEasing] = createSignal<TimeFunc>('linear')
  const [chainRunning, setChainRunning] = createSignal(false)

  const track = <T extends { stop: VoidFunction }>(handle: T) => {
    handles.push(handle)
    return handle
  }
  const resetBasic = () => {
    basicBox.style.transform = 'translateX(0px)'
    basicBox.style.opacity = '1'
    setBasicProgress(0)
  }
  const runBasic = () => {
    resetBasic()
    track(createAnimationByTime({
      target: basicBox,
      to: { x: 200, opacity: 0.3 },
      duration: 1000,
      onUpdate: progress => setBasicProgress(progress),
    }))
  }
  const runEasing = (ease: TimeFunc) => {
    easingBox.style.transform = 'translateX(0px)'
    setEasing(() => ease)
    track(createAnimationByTime({ target: easingBox, to: { x: 200 }, duration: 1500, ease }))
  }
  const resetChain = () => {
    chainFirst.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)'
    chainSecond.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)'
    setChainRunning(false)
  }
  const runChain = () => {
    resetChain()
    setChainRunning(true)
    const animation = new ATo()
    animation
      .start({ target: chainFirst, to: { x: 100, rotate: 360 }, duration: 1000, ease: 'easeInOut' })
      .next({
        target: chainSecond,
        to: { x: 250, scale: 1.2, rotate: -360 },
        duration: 1000,
        ease: 'backInOut',
        onComplete: () => setChainRunning(false),
      })
    handles.push(animation)
  }
  const runObject = () => {
    const target = { value: 0, progress: 0 }
    setObjectValue(0)
    setObjectProgress(0)
    track(createAnimationByTime({
      target,
      to: { value: 100, progress: 1 },
      duration: 2000,
      onUpdate: (progress) => {
        setObjectValue(target.value)
        setObjectProgress(progress)
      },
    }))
  }

  onCleanup(() => handles.forEach(handle => handle.stop()))

  return (
    <PageShell title="createAnimationByTime" description="用 Solid 的事件和状态承载 DOM 补间、缓动、链式动画与普通对象动画。">
      <div class="grid gap-6 lg:grid-cols-2">
        <Panel title="基础补间" description="同一个生产 API 同时修改 x transform 和 opacity。">
          <div class="relative h-16 overflow-hidden rounded-xl bg-slate-950 p-2">
            <div ref={basicBox} class="h-12 w-12 rounded-lg bg-emerald-400" />
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button onClick={runBasic}>开始</Button>
            <Button onClick={resetBasic}>重置</Button>
          </div>
          <div class="mt-3 text-sm text-slate-400">
            progress：
            {basicProgress().toFixed(2)}
          </div>
        </Panel>
        <Panel title="缓动效果" description="切换 easeIn、easeOut、easeInOut，观察同一目标的时间曲线。">
          <div class="relative h-16 overflow-hidden rounded-xl bg-slate-950 p-2"><div ref={easingBox} class="h-12 w-12 rounded-lg bg-sky-400" /></div>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => runEasing('easeIn')}>Ease In</Button>
            <Button onClick={() => runEasing('easeOut')}>Ease Out</Button>
            <Button onClick={() => runEasing('easeInOut')}>Ease In-Out</Button>
          </div>
          <div class="mt-3 text-sm text-slate-400">
            当前：
            {String(easing())}
          </div>
        </Panel>
        <Panel title="链式动画 ATo" description="第一个目标完成后，由 ATo.next() 自动启动第二个目标。">
          <div class="relative h-28 overflow-hidden rounded-xl bg-slate-950 p-2">
            <div ref={chainFirst} class="h-12 w-12 rounded-lg bg-violet-400" />
            <div ref={chainSecond} class="mt-3 h-12 w-12 rounded-lg bg-rose-400" />
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button onClick={runChain}>开始链式动画</Button>
            <Button onClick={resetChain}>重置</Button>
          </div>
          <div class="mt-3">
            <StatusBadge tone={chainRunning()
              ? 'warning'
              : 'neutral'}
            >
              {chainRunning()
                ? 'running'
                : 'idle'}
            </StatusBadge>
          </div>
        </Panel>
        <Panel title="普通对象动画" description="目标也可以是普通 JavaScript 对象，不需要 DOM。">
          <div class="rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-300">
            value:
            {objectValue().toFixed(2)}
            <br />
            progress:
            {' '}
            {(objectProgress() * 100).toFixed(0)}
            %
          </div>
          <div class="mt-4"><Button onClick={runObject}>开始对象动画</Button></div>
        </Panel>
      </div>
    </PageShell>
  )
}
