import type { TimeFunc } from '@/animation/types'
import { ATo, createAnimationByTime } from '@/animation'
import { createBtn, createCard, injectStyles } from './tool'

/**
 * 创建动画方块
 */
function createAnimationBox() {
  const box = document.createElement('div')
  box.className = 'animation-box'
  return box
}

/**
 * 动态创建所有UI元素
 */
function setupUI() {
  document.title = '🎨 createAnimationByTime Test Page'
  injectStyles()

  const h1 = document.createElement('h1')
  h1.innerHTML = '🎨 createAnimationByTime Test Page'
  const mainDesc = document.createElement('p')
  mainDesc.className = 'info'
  mainDesc.textContent = '一个强大的动画工具函数，用于创建基于时间的补间动画。'

  const container = document.createElement('div')
  container.className = 'container'

  // --- 1. 基本用法 ---
  const card1 = createCard('🔧 基本用法', '简单的位移动画，点击按钮开始。')
  const boxBasic = createAnimationBox()
  const btnBasicStart = createBtn('开始动画')
  const btnBasicReset = createBtn('重置')
  const controls1 = document.createElement('div')
  controls1.className = 'controls'
  controls1.append(btnBasicStart, btnBasicReset)
  card1.append(boxBasic, controls1)

  // --- 2. 缓动效果 ---
  const card2 = createCard('🎢 缓动效果 Easing', '应用不同的缓动函数来改变动画的节奏。')
  const boxEasing = createAnimationBox()
  const btnEaseIn = createBtn('Ease In')
  const btnEaseOut = createBtn('Ease Out')
  const btnEaseInOut = createBtn('Ease In-Out')
  const controls2 = document.createElement('div')
  controls2.className = 'controls'
  controls2.append(btnEaseIn, btnEaseOut, btnEaseInOut)
  card2.append(boxEasing, controls2)

  // --- 3. 链式动画 ---
  const card3 = createCard('🔗 链式动画 ATo', '一个元素动画完成后，驱动另一个元素开始。')
  const boxChain1 = createAnimationBox()
  const boxChain2 = createAnimationBox()
  Object.assign(boxChain2.style, { backgroundColor: '#f36e6e' })
  const chainContainer = document.createElement('div')
  chainContainer.className = 'flex-row'
  chainContainer.append(boxChain1, boxChain2)
  const btnChainStart = createBtn('开始链式动画')
  const btnChainReset = createBtn('重置')
  const controls3 = document.createElement('div')
  controls3.className = 'controls'
  controls3.append(btnChainStart, btnChainReset)
  card3.append(chainContainer, controls3)

  // --- 4. 非DOM对象动画 ---
  const card4 = createCard('🤖 非DOM对象动画', '动画不仅限于DOM元素，也可以作用于任何JS对象。')
  const objOutput = document.createElement('div')
  objOutput.className = 'info'
  objOutput.innerHTML = '查看控制台输出 👉 <span></span>'
  const btnObjStart = createBtn('开始对象动画')
  const controls4 = document.createElement('div')
  controls4.className = 'controls'
  controls4.append(btnObjStart)
  card4.append(objOutput, controls4)

  container.append(card1, card2, card3, card4)
  document.body.append(h1, mainDesc, container)

  return {
    boxBasic,
    btnBasicStart,
    btnBasicReset,
    boxEasing,
    btnEaseIn,
    btnEaseOut,
    btnEaseInOut,
    boxChain1,
    boxChain2,
    btnChainStart,
    btnChainReset,
    objOutputSpan: objOutput.querySelector('span')!,
    btnObjStart,
  }
}

// ==================================================================
// =================== 动画逻辑 ======================================
// ==================================================================

const ui = setupUI()

// --- 1. 基本用法 ---
function resetBasic() {
  ui.boxBasic.style.transform = 'translateX(0px)'
  ui.boxBasic.style.opacity = '1'
}
ui.btnBasicStart.addEventListener('click', () => {
  createAnimationByTime({
    target: ui.boxBasic,
    to: { x: 200, opacity: 0.3 },
    duration: 1000,
  })
})
ui.btnBasicReset.addEventListener('click', resetBasic)

// --- 2. 缓动效果 ---
function animateEasing(ease: TimeFunc) {
  ui.boxEasing.style.transform = 'translateX(0px)'
  createAnimationByTime({
    target: ui.boxEasing,
    to: { x: 200 },
    duration: 1500,
    ease,
  })
}
ui.btnEaseIn.addEventListener('click', () => animateEasing('easeIn'))
ui.btnEaseOut.addEventListener('click', () => animateEasing('easeOut'))
ui.btnEaseInOut.addEventListener('click', () => animateEasing('easeInOut'))

// --- 3. 链式动画 ---
function resetChain() {
  [ui.boxChain1, ui.boxChain2].forEach((box) => {
    box.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)'
  })
}
ui.btnChainStart.addEventListener('click', () => {
  resetChain()
  const ato = new ATo()
  ato
    .start({
      target: ui.boxChain1,
      to: { x: 100, rotate: 360 },
      duration: 1000,
      ease: 'easeInOut',
    })
    .next({
      target: ui.boxChain2,
      to: { x: 250, scale: 1.2, rotate: -360 },
      duration: 1000,
      ease: 'backInOut',
    })
})
ui.btnChainReset.addEventListener('click', resetChain)

// --- 4. 非DOM对象动画 ---
ui.btnObjStart.addEventListener('click', () => {
  const myObject = { value: 0, progress: 0 }
  ui.objOutputSpan.textContent = JSON.stringify(myObject)

  createAnimationByTime({
    target: myObject,
    to: { value: 100, progress: 1 },
    duration: 2000,
    onUpdate: () => {
      ui.objOutputSpan.textContent = `value: ${myObject.value.toFixed(2)}, progress: ${(myObject.progress * 100).toFixed(0)}%`
    },
    onComplete: () => {
      console.log('非DOM对象动画完成!', myObject)
    },
  })
})

// --- 初始化状态 ---
resetBasic()
animateEasing('linear')
resetChain()
ui.objOutputSpan.textContent = JSON.stringify({ value: 0, progress: 0 })

console.log('🎨 测试页面加载完成!')
