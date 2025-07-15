import { typewriterEffect } from '@/tools/typewriterEffect'
import { createBtn, createCard, injectStyles } from './tool'

function setupUI() {
  document.title = '📠 Typewriter Effect Test'
  injectStyles()

  const h1 = document.createElement('h1')
  h1.innerHTML = '📠 Typewriter Effect'
  const mainDesc = document.createElement('p')
  mainDesc.className = 'info'
  mainDesc.textContent = '一个模拟打字机效果的工具函数。'

  const container = document.createElement('div')
  container.className = 'container'

  // --- 1. 基本用法 ---
  const card1 = createCard('🔧 基本用法', '点击按钮开始/停止打字效果。')
  const output1 = document.createElement('div')
  output1.className = 'info'
  output1.style.minHeight = '60px'
  output1.style.border = '1px solid #ddd'
  output1.style.padding = '10px'
  const btnStart1 = createBtn('开始')
  const btnStop1 = createBtn('停止')
  const status1 = document.createElement('p')
  status1.className = 'info'
  const controls1 = document.createElement('div')
  controls1.className = 'controls'
  controls1.append(btnStart1, btnStop1)
  card1.append(output1, controls1, status1)

  // --- 2. 速度控制 ---
  const card2 = createCard('🚀 速度控制', '用不同的速度体验打字效果。')
  const output2 = document.createElement('div')
  output2.className = 'info'
  output2.style.minHeight = '60px'
  output2.style.border = '1px solid #ddd'
  output2.style.padding = '10px'
  const btnSlow = createBtn('慢速 (100ms)')
  const btnNormal = createBtn('正常 (30ms)')
  const btnFast = createBtn('快速 (10ms)')
  const controls2 = document.createElement('div')
  controls2.className = 'controls'
  controls2.append(btnSlow, btnNormal, btnFast)
  card2.append(output2, controls2)

  // --- 3. 动态内容与续打 ---
  const card3 = createCard('🔄 动态内容', '在下方输入框中修改内容，打字效果会平滑地衔接。')
  const output3 = document.createElement('div')
  output3.className = 'info'
  output3.style.minHeight = '60px'
  output3.style.border = '1px solid #ddd'
  output3.style.padding = '10px'
  const input3 = document.createElement('textarea')
  input3.style.width = '100%'
  input3.style.boxSizing = 'border-box'
  input3.rows = 3
  input3.placeholder = '在这里输入...'
  card3.append(output3, input3)

  container.append(card1, card2, card3)
  document.body.append(h1, mainDesc, container)

  return {
    output1,
    btnStart1,
    btnStop1,
    status1,
    output2,
    btnSlow,
    btnNormal,
    btnFast,
    output3,
    input3,
  }
}

// ==================================================================
// =================== 动画逻辑 ======================================
// ==================================================================

const ui = setupUI()
const text1 = '这是一个基础的打字机效果演示，从第二个字符开始，通过 Promise 感知动画结束。'
const text2 = '速度就是激情！你可以通过调整 speed 参数来控制每个字符出现的速度。'
const text3Start = '实时更新内容，打字机也能跟上你的节奏！'
let stopFn1: (() => void) | null = null
let stopFn2: (() => void) | null = null
let stopFn3: (() => void) | null = null

// --- 1. 基本用法 ---
ui.btnStart1.addEventListener('click', () => {
  stopFn1?.()
  ui.status1.textContent = '状态: 正在打字... ✍️'
  const { promise, stop } = typewriterEffect({
    content: text1,
    continueFromIndex: 2,
    onUpdate: (txt) => {
      ui.output1.textContent = txt
    },
  })
  stopFn1 = stop
  promise.then(() => {
    ui.status1.textContent = '状态: 完成 ✅'
    stopFn1 = null
  })
})

ui.btnStop1.addEventListener('click', () => {
  if (stopFn1) {
    stopFn1()
    ui.status1.textContent = '状态: 已手动停止 🛑'
    stopFn1 = null
  }
})

// --- 2. 速度控制 ---
function runSpeedTest(speed: number) {
  stopFn2?.()
  const { stop } = typewriterEffect({
    content: text2,
    speed,
    onUpdate: (txt) => {
      ui.output2.textContent = txt
    },
  })
  stopFn2 = stop
}
ui.btnSlow.addEventListener('click', () => runSpeedTest(100))
ui.btnNormal.addEventListener('click', () => runSpeedTest(30))
ui.btnFast.addEventListener('click', () => runSpeedTest(10))

// --- 3. 动态内容 ---
ui.input3.value = text3Start
function runDynamicTest() {
  stopFn3?.()
  const currentText = ui.output3.textContent || ''
  const targetText = ui.input3.value
  const { stop } = typewriterEffect({
    content: targetText,
    continueFromIndex: currentText.length,
    onUpdate: (txt) => {
      ui.output3.textContent = txt
    },
  })
  stopFn3 = stop
}
ui.input3.addEventListener('input', runDynamicTest)

// --- 初始化 ---
ui.output1.textContent = '点击“开始”按钮'
ui.output2.textContent = '选择一个速度'
ui.output3.textContent = ''
runDynamicTest()
