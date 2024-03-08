import {
    blobToBase64,
    compressImg,
    getImg,
    createCvs,
    getPixel,
    fillPixel,
    parseImgData,
    cutImg
} from '@jl-org/tool'


/** --------------------------------------------------------------
 * 压缩测试
 */
const input = document.createElement('input')
input.type = 'file'
document.body.appendChild(input)

input.addEventListener('change', async (e) => {
    const file = input.files![0]
    console.log(file)

    const src = await blobToBase64(file)
    console.log(src)
    console.log('------------------------------------------------------------')

    const img = await getImg(src) as HTMLImageElement
    const blob = await compressImg(img, 'base64', .5, 'image/webp')
    console.log(blob)

    const img2 = await getImg(blob) as HTMLImageElement
    document.body.appendChild(img2)
})



/** --------------------------------------------------------------
 * 辅助函数测试
 */
const WIDTH = 4,
    HEIGHT = 4

const { ctx, cvs } = createCvs(WIDTH, HEIGHT)
document.body.appendChild(cvs)

fillPixel(ctx, 0, 0, 'rgba(255, 0, 0, 0.5)')
fillPixel(ctx, WIDTH - 1, HEIGHT - 1, 'rgba(40, 255, 255, 0.5)')



/** ----------------------- Test ------------------------------ */
const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT).data

/** 像素获取测试 */
console.log(getPixel(0, 0, imgData, WIDTH))
console.log(getPixel(WIDTH - 1, HEIGHT - 1, imgData, WIDTH))
console.log(imgData)
console.log(parseImgData(imgData, WIDTH, HEIGHT))


const img = new Image()
img.src = 'https://cdn.pixabay.com/photo/2023/04/10/20/41/bird-7914702_640.jpg'

/** ------------------------- 裁剪图片测试 ----------------------------- */
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
