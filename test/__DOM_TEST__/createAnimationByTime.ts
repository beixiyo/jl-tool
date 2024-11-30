import { ATo, createAnimationByTime } from '@/animation'
import { getColor } from '@deb'


const div1 = genDiv('0', '0'),
  div2 = genDiv('40px', '100px'),
  div3 = genDiv('300px', '0', '#000')


createAnimationByTime(
  div3.style,
  {
    left: '100px',
    translateY: '500px'
  },
  1000,
)


const aTo = new ATo()
/**
 * 点击暂停动画
 */
window.addEventListener('click', aTo.stop.bind(aTo))

aTo
  .start(
    div1.style,
    {
      left: '200px',
      top: '200px',
      opacity: '0.1'
    },
    1000
  )
  .next(
    div2.style,
    {
      translateX: '500px',
      translateY: '50px',
    },
    2000,
    {
      timeFunc: 'backInOut',
    }
  )
  .next(
    () => div2.style,
    {
      translateX: '10px',
      translateY: '0px',
      rotate: 135
    },
    1000,
    {
      callback(p, progress) {
        console.log(p)
      }
    }
  )


function genDiv(left: string, top: string, color = getColor()) {
  const div = document.createElement('div')
  div.style.cssText = `
        background-color: ${color};
        width: 100px;
        height: 100px;
        position: fixed;
        left: ${left};
        top: ${top};
    `
  document.body.appendChild(div)

  return div
}

