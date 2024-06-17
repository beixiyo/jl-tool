import { ATo, createAnimationByTime } from '@deb'
import { getColor } from '@deb'


const div1 = genDiv('0', '0'),
    div2 = genDiv('40px', '100px'),
    div3 = genDiv('300px', '0')


createAnimationByTime(
    div3.style,
    {
        left: '100px',
        top: '500px',
    },
    1000,
    {
        // callback() {
        //     console.log(arguments)
        // },
        // onEnd() {
        //     console.log('end', arguments)
        // }
    }
)


const aTo = new ATo()
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
            transform: true,
            timeFunc: 'backInOut',
        }
    )
    .next(
        () => div2.style,
        {
            translateX: '10px',
            translateY: '0px',
        },
        1000,
        {
            callback(p, progress) {
                console.log(p)
            }
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

