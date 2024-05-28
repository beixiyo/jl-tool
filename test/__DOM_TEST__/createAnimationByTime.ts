import { ATo } from '@deb/animation'
import { getColor } from '@deb/tools/colorTools'


const div1 = genDiv('0', '0'),
    div2 = genDiv('40px', '100px')



const aTo = new ATo()
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
            translateX: '50vw',
            translateY: '50px',
        },
        2000,
        {
            transform: true,
            timeFunc: 'backInOut'
        }
    )




function genDiv(left: string, top: string) {
    const div = document.createElement('div')
    div.style.cssText = `
        background-color: ${getColor()};
        width: 100px;
        height: 100px;
        position: fixed;
        left: ${left};
        top: ${top};
    `
    document.body.appendChild(div)

    return div
}

