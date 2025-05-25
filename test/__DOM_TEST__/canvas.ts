import { compressImg, cutImg } from '@/canvas/imgHandle'
import {
  createCvs,
  fillPixel,
  getPixel,
  parseImgData,
} from '@/canvas/tools'
import { blobToBase64 } from '@/fileTool/tools'
import { getImg } from '@/tools/domTools'

/**
 * --------------------------------------------------------------
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
  const blob = await compressImg(img, 'base64', 0.5, 'image/webp')
  console.log(blob)

  const img2 = await getImg(blob) as HTMLImageElement
  document.body.appendChild(img2)
})

/**
 * --------------------------------------------------------------
 * 辅助函数测试
 */
const WIDTH = 4
const HEIGHT = 4

const { ctx, cvs } = createCvs(WIDTH, HEIGHT)
document.body.appendChild(cvs)

fillPixel(ctx, 0, 0, 'rgba(255, 0, 0, 0.5)')
fillPixel(ctx, WIDTH - 1, HEIGHT - 1, 'rgba(40, 255, 255, 0.5)')

const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT)

/**
 * 像素获取测试
 */

// [255, 0, 0, 128]
console.log(getPixel(0, 0, imgData))
// [40, 255, 255, 128]
console.log(getPixel(WIDTH - 1, HEIGHT - 1, imgData))

console.log(imgData)
console.log(parseImgData(imgData));

/** ------------------------- 裁剪图片测试 ----------------------------- */

(async () => {
  const img = await getImg(
    'https://cdn.pixabay.com/photo/2023/04/10/20/41/bird-7914702_640.jpg',
    (img) => {
      img.crossOrigin = 'anonymous'
    },
  ) as HTMLImageElement

  document.body.appendChild(img)
  const src = await cutImg(img, {
    height: 100,
    width: 200,
    x: 100,
    y: 120,
    scaleX: 1.2,
    scaleY: 1.2,
  })

  const newImg = new Image()
  if (typeof src !== 'string') {
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
})()
