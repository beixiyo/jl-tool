import { getColor, applyAnimation, createAnimationByTime, createAnimation } from '@jl-org/tool'


console.log(
    createAnimation(
        0, 100, 0, 100, v => .5
    )(25)
)


let isEnd = false
const square = document.createElement('div')
square.style.cssText = `
    background-color: ${getColor()};
    width: 100px;
    height: 100px;
    transform: translateX(0px);
    will-change: transform;
`
document.body.appendChild(square)

setTimeout(() => {
    createAnimationByTime(
        square.style,
        {
            translateX: 800,
            translateY: 30,
            opacity: .5,
            rotate: 360,
            scale: 1.5,
        },
        1000,
        {
            timeFunc: 'ease-out',
            transform: true,
            onEnd: () => isEnd = true
        }
    )
}, 500);

const square2 = document.createElement('div')
square2.style.cssText = `
    background-color: ${getColor()};
    width: 100px;
    height: 100px;
    will-change: transform;
    position: fixed;
    left: 5vw;
    top: 5vw;
`
document.body.appendChild(square2)
createAnimationByTime(
    square2.style,
    {
        left: 80,
        top: 10,
        opacity: .5,
    },
    10000,
    {
        timeFunc: 'ease-out',
        unit: 'vw'
    }
)


const o = {
    a: 20
}
createAnimationByTime(
    o,
    { a: 300 },
    3000
)


