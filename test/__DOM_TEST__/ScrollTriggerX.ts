import { ScrollTrigger } from '@/animation'
import '@/shared'
import '@/tools/domTools'

/** 创建一个横向滚动容器和示例元素 */
function createHorizontalScrollDemo() {
  /** 添加样式 */
  const style = document.createElement('style')
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      font-family: Arial, sans-serif;
      background-color: #121212;
      color: white;
    }

    .scroll-container {
      width: 100%;
      height: 100vh;
      overflow-x: scroll;
      overflow-y: hidden;
      white-space: nowrap;
      scroll-behavior: smooth;
      background-color: #121212;
    }

    .horizontal-section {
      display: inline-block;
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    .section-1 { background: linear-gradient(90deg, #1a237e, #0d47a1); }
    .section-2 { background: linear-gradient(90deg, #311b92, #4a148c); }
    .section-3 { background: linear-gradient(90deg, #004d40, #00695c); }
    .section-4 { background: linear-gradient(90deg, #bf360c, #d84315); }

    .animated-element {
      position: absolute;
      width: 200px;
      height: 200px;
      transform-origin: center;
      border-radius: 10px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
    }

    .title {
      position: absolute;
      top: 10%;
      left: 10%;
      font-size: 36px;
      color: white;
      white-space: normal;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      opacity: 0;
    }

    .description {
      position: absolute;
      bottom: 10%;
      left: 10%;
      width: 80%;
      color: white;
      white-space: normal;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
      font-size: 18px;
    }

    .bounce-element {
      background: linear-gradient(135deg, #f5af19, #f12711);
    }

    .fade-element {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
      opacity: 0;
    }

    .rotate-element {
      background: linear-gradient(135deg, #b721ff, #21d4fd);
    }

    .perspective-element {
      background: linear-gradient(135deg, #08AEEA, #2AF598);
      transform-style: preserve-3d;
    }

    .parallax-row {
      position: absolute;
      height: 50px;
      width: 100%;
      left: 0;
    }

    .bubble {
      position: absolute;
      border-radius: 50%;
      opacity: 0.7;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.1));
    }

    .progress-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      height: 5px;
      background-color: #ffffff;
      z-index: 100;
    }
  `
  document.head.appendChild(style)

  /** 创建容器 */
  const container = document.createElement('div')
  container.className = 'scroll-container'
  document.body.appendChild(container)

  /** 创建进度条 */
  const progressBar = document.createElement('div')
  progressBar.className = 'progress-bar'
  document.body.appendChild(progressBar)

  /** 创建四个部分 */
  const sectionContents = [
    {
      title: '弹跳效果',
      description: '元素随着滚动产生弹跳动画，模拟物理弹性效果。',
      effectType: 'bounce',
    },
    {
      title: '渐入渐出效果',
      description: '元素随着滚动逐渐显示并放大，展示平滑的过渡动画。',
      effectType: 'fade',
    },
    {
      title: '3D旋转效果',
      description: '元素在三维空间中旋转，创造出立体感和空间感。',
      effectType: 'rotate',
    },
    {
      title: '视差浮动效果',
      description: '多个元素以不同的速度移动，形成层次感和深度感。',
      effectType: 'perspective',
    },
  ]

  /** 创建部分 */
  sectionContents.forEach((content, index) => {
    const section = document.createElement('div')
    section.className = `horizontal-section section-${index + 1}`

    /** 创建标题 */
    const title = document.createElement('h2')
    title.className = 'title'
    title.textContent = content.title

    /** 创建描述 */
    const description = document.createElement('p')
    description.className = 'description'
    description.textContent = content.description

    /** 根据不同类型创建动画元素 */
    switch (content.effectType) {
      case 'bounce':
        /** 创建弹跳元素 */
        const bounceElement = document.createElement('div')
        bounceElement.className = 'animated-element bounce-element'
        bounceElement.textContent = '弹跳效果'
        bounceElement.style.left = '50%'
        bounceElement.style.top = '50%'
        bounceElement.style.transform = 'translate(-50%, -50%) scale(0.5)'
        section.appendChild(bounceElement)
        break

      case 'fade':
        /** 创建渐入元素 */
        for (let i = 0; i < 3; i++) {
          const fadeElement = document.createElement('div')
          fadeElement.className = 'animated-element fade-element'
          fadeElement.textContent = '渐入效果'
          fadeElement.style.left = `${25 + i * 25}%`
          fadeElement.style.top = '50%'
          fadeElement.style.transform = 'translate(-50%, -50%) scale(0.5)'
          fadeElement.dataset.delay = (i * 0.2).toString()
          section.appendChild(fadeElement)
        }
        break

      case 'rotate':
        /** 创建旋转元素 */
        const rotateElement = document.createElement('div')
        rotateElement.className = 'animated-element rotate-element'
        rotateElement.textContent = '3D旋转'
        rotateElement.style.left = '50%'
        rotateElement.style.top = '50%'
        rotateElement.style.transform = 'translate(-50%, -50%) rotateY(90deg)'
        section.appendChild(rotateElement)
        break

      case 'perspective':
        /** 创建浮动元素 */
        const colors = ['#FF3CAC', '#784BA0', '#2B86C5', '#04BEFE', '#FF6B6B']
        /** 创建五行气泡 */
        for (let row = 0; row < 5; row++) {
          const bubbleRow = document.createElement('div')
          bubbleRow.className = 'parallax-row'
          bubbleRow.style.top = `${20 + row * 15}%`

          /** 每行6-12个气泡 */
          const bubbleCount = 6 + Math.floor(Math.random() * 7)
          for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement('div')
            bubble.className = 'bubble'

            /** 随机大小和位置 */
            const size = 20 + Math.random() * 60
            const xPos = (i / bubbleCount) * 100 + Math.random() * 10

            bubble.style.width = `${size}px`
            bubble.style.height = `${size}px`
            bubble.style.left = `${xPos}%`
            bubble.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]

            /** 设置数据属性用于视差效果 */
            bubble.dataset.speed = (0.5 + Math.random() * 0.8).toString()

            bubbleRow.appendChild(bubble)
          }

          section.appendChild(bubbleRow)
        }
        break
    }

    section.appendChild(title)
    section.appendChild(description)
    container.appendChild(section)
  })

  /** 设置ScrollTrigger */
  setupScrollTriggers(container, progressBar)
}

/** 设置ScrollTrigger实例 */
function setupScrollTriggers(container: HTMLElement, progressBar: HTMLElement) {
  /** 设置全局进度条 */
  new ScrollTrigger({
    trigger: container,
    scroller: container,
    direction: 'horizontal', // 关键参数：设置为横向滚动
    scrub: true,
    start: ['top', 'top'],
    end: ['bottom', 'bottom'],
    onUpdate: (self) => {
      progressBar.style.width = `${self.progress * 100}%`
    },
  })

  /** 处理标题动画 */
  document.querySelectorAll('.title').forEach((title) => {
    const section = title.parentElement
    if (!section)
      return

    new ScrollTrigger({
      trigger: section,
      scroller: container,
      direction: 'horizontal',
      start: ['top', 'bottom'],
      end: ['center', 'bottom'],
      scrub: true,
      props: [
        { opacity: 0, x: '-100px' }, // 起始状态
        { opacity: 1, x: '0px' }, // 结束状态
      ],
    })
  })

  /** 处理弹跳效果 */
  document.querySelectorAll('.bounce-element').forEach((element) => {
    const section = element.parentElement
    if (!section)
      return

    new ScrollTrigger({
      trigger: section,
      scroller: container,
      direction: 'horizontal',
      start: ['top', 'bottom'],
      end: ['bottom', 'top'],
      scrub: true,
      ease: 'backInOut',
      onUpdate: (self) => {
        /** 弹跳效果：缩放和Y轴弹跳 */
        const progress = self.progress
        const scaleValue = 0.5 + Math.sin(progress * Math.PI) * 0.5
        const yBounce = Math.sin(progress * Math.PI * 2) * 50;

        /** 应用弹跳效果 */
        (element as HTMLElement).style.transform = `
          translate(-50%, calc(-50% + ${yBounce}px))
          scale(${scaleValue})
          rotate(${progress * 360}deg)
        `
      },
    })
  })

  /** 处理渐入效果 */
  document.querySelectorAll('.fade-element').forEach((element) => {
    const section = element.parentElement
    if (!section)
      return

    const delay = Number.parseFloat((element as HTMLElement).dataset.delay || '0')

    new ScrollTrigger({
      trigger: section,
      scroller: container,
      direction: 'horizontal',
      start: ['top', 'bottom'],
      end: ['bottom', 'top'],
      scrub: true,
      onUpdate: (self) => {
        /** 计算延迟后的进度 */
        let progress = self.progress
        progress = Math.max(0, Math.min(1, (progress - delay) * 1.5))

        /** 应用渐入渐出效果 */
        if (progress <= 0) {
          (element as HTMLElement).style.opacity = '0'
          ;(element as HTMLElement).style.transform = 'translate(-50%, -50%) scale(0.5)'
        }
        else if (progress >= 1) {
          (element as HTMLElement).style.opacity = '0'
          ;(element as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.5)'
        }
        else {
          (element as HTMLElement).style.opacity = progress.toString()
          ;(element as HTMLElement).style.transform = `translate(-50%, -50%) scale(${0.5 + progress})`
        }
      },
    })
  })

  /** 处理3D旋转效果 */
  document.querySelectorAll('.rotate-element').forEach((element) => {
    const section = element.parentElement
    if (!section)
      return

    new ScrollTrigger({
      trigger: section,
      scroller: container,
      direction: 'horizontal',
      start: ['top', 'bottom'],
      end: ['bottom', 'top'],
      scrub: true,
      onUpdate: (self) => {
        // 3D旋转效果
        const progress = self.progress
        const rotateY = 90 - progress * 360 // 从90度旋转到-270度
        const scale = 0.5 + Math.sin(progress * Math.PI) * 0.5;

        /** 应用3D旋转 */
        (element as HTMLElement).style.transform = `
          translate(-50%, -50%)
          perspective(1000px)
          rotateY(${rotateY}deg)
          scale(${scale})
        `
      },
    })
  })

  /** 处理视差浮动效果 */
  document.querySelectorAll('.bubble').forEach((bubble) => {
    const row = bubble.parentElement
    if (!row)
      return

    const section = row.parentElement
    if (!section)
      return

    const speed = Number.parseFloat((bubble as HTMLElement).dataset.speed || '1')
    const initialLeft = (bubble as HTMLElement).style.left

    new ScrollTrigger({
      trigger: section,
      scroller: container,
      direction: 'horizontal',
      start: ['top', 'bottom'],
      end: ['bottom', 'top'],
      scrub: true,
      onUpdate: (self) => {
        /** 视差浮动效果 */
        const progress = self.progress
        const xOffset = (progress - 0.5) * 100 * speed;

        /** 应用视差移动 */
        (bubble as HTMLElement).style.transform = `translateX(${xOffset}px)`

        /** 调整气泡大小 */
        const scaleFactor = 0.8 + Math.sin(progress * Math.PI) * 0.4
        ;(bubble as HTMLElement).style.transform += ` scale(${scaleFactor})`
      },
    })
  })

  /** 为整体容器启用平滑滚动 */
  new ScrollTrigger({
    scroller: container,
    trigger: document.body,
    direction: 'horizontal',
    smoothScroll: {
      direction: 'horizontal', // 确保平滑滚动也是横向的
    },
  })
}

/** 初始化 */
window.addEventListener('load', () => {
  createHorizontalScrollDemo()
})

/** 添加提示信息 */
const hint = document.createElement('div')
hint.style.cssText = `
  position: fixed;
  top: 20px;
  left: 20px;
  color: white;
  background: rgba(0,0,0,0.7);
  padding: 10px;
  border-radius: 5px;
  z-index: 100;
  font-family: Arial, sans-serif;
`
hint.textContent = '横向滚动演示 - 使用鼠标滚轮或触控板左右滚动'
document.body.appendChild(hint)
