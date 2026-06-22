import { applyAnimation } from '@/animation/applyAnimation'
import { Clock } from '@/tools/Clock'

const clock = new Clock()
let autoUpdate = true

document.body.className = 'min-h-screen bg-slate-950 text-slate-100'

const root = document.createElement('main')
root.className = 'mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8'

const title = document.createElement('h1')
title.className = 'text-2xl font-semibold'
title.textContent = 'Clock DOM Test'

const subtitle = document.createElement('p')
subtitle.className = 'max-w-2xl text-sm leading-6 text-slate-400'
subtitle.textContent = 'Observe elapsed time, pause/resume state, and explicit frame delta updates from one Clock instance.'

const metrics = document.createElement('section')
metrics.className = 'grid grid-cols-2 gap-3 md:grid-cols-4'

const controls = document.createElement('section')
controls.className = 'flex flex-wrap gap-2'

const eventLog = document.createElement('pre')
eventLog.className = 'max-h-56 overflow-auto rounded border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-300'

document.body.append(root)
root.append(title, subtitle, metrics, controls, eventLog)

const metricMap = {
  now: createMetric('now'),
  startTime: createMetric('startTime'),
  curTime: createMetric('curTime'),
  elapsedMS: createMetric('elapsedMS'),
  elapsed: createMetric('elapsed'),
  deltaMS: createMetric('deltaMS'),
  delta: createMetric('delta'),
  pausedAt: createMetric('pausedAt'),
  pausedDuration: createMetric('pausedDuration'),
  lastUpdateAt: createMetric('lastUpdateAt'),
  isStarted: createMetric('isStarted'),
  isRunning: createMetric('isRunning'),
  isPaused: createMetric('isPaused'),
  autoUpdate: createMetric('autoUpdate'),
}

Object.values(metricMap).forEach(({ el }) => metrics.append(el))

const startBtn = createButton('start')
const pauseBtn = createButton('pause')
const resumeBtn = createButton('resume')
const resetBtn = createButton('reset')
const updateBtn = createButton('manual update')
const toggleAutoBtn = createButton('toggle auto update')

controls.append(startBtn, pauseBtn, resumeBtn, resetBtn, updateBtn, toggleAutoBtn)

startBtn.onclick = () => {
  clock.start()
  log('start()')
  render()
}

pauseBtn.onclick = () => {
  clock.pause()
  log('pause()')
  render()
}

resumeBtn.onclick = () => {
  clock.resume()
  log('resume()')
  render()
}

resetBtn.onclick = () => {
  clock.reset()
  log('reset()')
  render()
}

updateBtn.onclick = () => {
  clock.update()
  log(`update() -> deltaMS: ${formatNumber(clock.deltaMS)}`)
  render()
}

toggleAutoBtn.onclick = () => {
  autoUpdate = !autoUpdate
  log(`autoUpdate = ${autoUpdate}`)
  render()
}

log('Clock created with autoStart=true')

applyAnimation(() => {
  if (autoUpdate)
    clock.update()

  render()
})

function render() {
  setMetric('now', formatNumber(clock.now))
  setMetric('startTime', formatNumber(clock.startTime))
  setMetric('curTime', formatNumber(clock.curTime))
  setMetric('elapsedMS', formatNumber(clock.elapsedMS))
  setMetric('elapsed', clock.elapsed.toFixed(3))
  setMetric('deltaMS', formatNumber(clock.deltaMS))
  setMetric('delta', clock.delta.toFixed(4))
  setMetric('pausedAt', formatOptional(clock.pausedAt))
  setMetric('pausedDuration', formatNumber(clock.pausedDuration))
  setMetric('lastUpdateAt', formatNumber(clock.lastUpdateAt))
  setMetric('isStarted', String(clock.isStarted))
  setMetric('isRunning', String(clock.isRunning))
  setMetric('isPaused', String(clock.isPaused))
  setMetric('autoUpdate', String(autoUpdate))
}

function createMetric(label: string) {
  const el = document.createElement('article')
  el.className = 'rounded border border-slate-800 bg-slate-900 p-4'

  const name = document.createElement('div')
  name.className = 'text-xs uppercase tracking-wide text-slate-500'
  name.textContent = label

  const value = document.createElement('div')
  value.className = 'mt-2 font-mono text-lg text-emerald-300'
  value.textContent = '--'

  el.append(name, value)
  return { el, value }
}

function createButton(text: string) {
  const button = document.createElement('button')
  button.className = 'rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300'
  button.type = 'button'
  button.textContent = text
  return button
}

function setMetric(key: keyof typeof metricMap, value: string) {
  metricMap[key].value.textContent = value
}

function log(message: string) {
  const time = new Date().toLocaleTimeString()
  eventLog.textContent = `[${time}] ${message}\n${eventLog.textContent ?? ''}`
}

function formatOptional(value: number | undefined) {
  return value === undefined
    ? '--'
    : formatNumber(value)
}

function formatNumber(value: number) {
  return value.toFixed(2)
}
