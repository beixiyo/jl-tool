import { getColor } from '@deb/tools/colorTools'
import { ATo } from '@deb/animation'


const square = document.createElement('div')
square.style.cssText = `
    background-color: ${getColor()};
    width: 100px;
    height: 100px;
    will-change: transform;
`
document.body.appendChild(square)

const square2 = genEl()


const aTo = new ATo()

aTo.start(
    square2.style,
    {
        left: '45vh',
        top: 50,
    },
    1000,
    {
        timeFunc: 'ease',
        unit: 'rem'
    }
)

// aTo.start(
//     square.style,
//     {
//         translateX: 1000,
//         translateY: 100,
//         scale: 2,
//         opacity: .5
//     },
//     1,
//     {
//         timeFunc: 'ease-in-out',
//         transform: true,
//         onEnd: (t, p) => console.log('end', t, p)
//     }
// )
//     .next(square2.style,
//         {
//             left: '45vh',
//             top: 50,
//         },
//         1000,
//         {
//             timeFunc: 'linear',
//         }
//     )


// setTimeout(() => {
//     aTo.stop()
// }, 8000)


function genEl() {
    const el = document.createElement('div')
    el.style.cssText = `
        background-color: ${getColor()};
        width: 100px;
        height: 100px;
        will-change: transform;
        position: fixed;
        left: 5px;
        top: 1vw;
    `
    document.body.appendChild(el)
    return el
}