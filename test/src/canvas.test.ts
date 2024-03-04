import {
    createCvs,
    getPixel,
    fillPixel,
    parseImgData,
    cutImg
} from '@jl-org/tool'

const WIDTH = 4,
    HEIGHT = 4

const { ctx, cvs } = createCvs(WIDTH, HEIGHT)
document.body.appendChild(cvs)


fillPixel(ctx, 0, 0, 'rgba(255, 0, 0, 0.5)')
fillPixel(ctx, WIDTH - 1, HEIGHT - 1, 'rgba(40, 255, 255, 0.5)')




/** ----------------------- Test ------------------------------ */
const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT).data

console.log(getPixel(WIDTH - 1, HEIGHT - 1, imgData, WIDTH))
console.log(imgData)
console.log(parseImgData(imgData, WIDTH, HEIGHT))


const img = new Image()
img.src = 'https://pics0.baidu.com/feed/7e3e6709c93d70cf716b8ae23a2b4f0db8a12b54.jpeg@f_auto?token=bb790300b544f36c26730df6aa5c4d41'

img.onload = async () => {
    document.body.appendChild(img)
    const src = await cutImg(img, 'blob', 100, 0, 200, 100)

    const newImg = new Image()
    if (src instanceof Blob) {
        const url = URL.createObjectURL(src)
        newImg.src = url
        newImg.onload = () => {
            document.body.appendChild(newImg)
        }
        return 
    }

    newImg.src = src
    newImg.onload = () => {
        document.body.appendChild(newImg)
    }
}
