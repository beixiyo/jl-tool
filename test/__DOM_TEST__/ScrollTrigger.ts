import { ScrollTrigger } from '@/animation'

// Image URLs array
const images: string[] = [
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
]

// Text content array
const texts: string[] = ['展示文字1', '展示文字2', '展示文字3']

main()

// Create and append elements to the document
function createParallaxElements(): void {
  // Create style element
  const style = document.createElement('style')
  style.textContent = `
    body {
      padding: 0 0;
      margin: 0 0;
    }

    div {
      color: white;
      font-size: 36px;
      text-align: center;
      line-height: 100vh;
    }

    section {
      width: 100%;
      height: 100vh;
      object-fit: contain;
      background-size: 100%;
      background-position: center center;
    }
  `

  // Create sections with divs
  const sections = texts.map((text, index) => {
    const section = document.createElement('section')
    section.style.background = `url('${images[index]}') no-repeat center`

    const div = document.createElement('div')
    div.textContent = text

    section.appendChild(div)
    return section
  })

  // Add everything to the document
  document.head.appendChild(style)
  sections.forEach(section => document.body.appendChild(section))
}

function parallax() {
  const height = document.documentElement.clientHeight

  /** 为每一个 section 单独创建 ScrollTrigger */
  document.querySelectorAll<HTMLElement>('section').forEach((sec, i) => {
    new ScrollTrigger({
      trigger: sec, // 关键：把 trigger 指向该 section
      targets: sec, // 该 section 自己
      scrub: true,
      smoothScroll: true,
      start: ['top', 'bottom'],
      end: ['bottom', 'top'],
      props: [
        { backgroundPositionY: `-${height / 2}px` },
        { backgroundPositionY: `${height / 2}px` },
      ],
    })
  })
}

function main() {
  createParallaxElements()
  parallax()
}
