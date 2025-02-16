import { getImg } from '@/tools/domTools'
import { Pixel } from '@/types'


/**
 * 创建一个指定宽高的画布
 * @param width 画布的宽度
 * @param height 画布的高度
 * @param options 上下文配置
 * @returns 包含画布和上下文的对象
 */
export function createCvs(width?: number, height?: number, options?: CanvasRenderingContext2DSettings) {
  const cvs = document.createElement('canvas'),
    ctx = cvs.getContext('2d', options)!
  width && (cvs.width = width)
  height && (cvs.height = height)

  return { cvs, ctx }
}

/**
 * 获取 canvas ImageData 的像素点的索引
 */
export function getImgDataIndex(x: number, y: number, width: number) {
  /**
   * canvas 的像素点是一维数组，需要通过计算获取对应坐标的像素点
   * 一个像素点占 4 个位置，分别是 `R` `G` `B` `A`
   * width * 4 * y 是第 `y` 行的起始位置
   * x * 4 是第 `x` 列的起始位置
   * 然后加上 `i` 就是 `R` `G` `B` `A` 的位置
   */
  const index = (width * 4 * y) + (x * 4)
  return index
}

/**
 * 取出 `canvas` 用一维数组描述的颜色中，某个坐标的`RGBA`数组
 * ### 注意坐标从 0 开始
 * @param x 宽度中的第几列
 * @param y 高度中的第几行
 * @param imgData ctx.getImageData 方法获取的 ImageData
 * @returns `RGBA` 元组
 */
export function getPixel(x: number, y: number, imgData: ImageData) {
  const { data, width } = imgData
  const arr: Pixel = [0, 0, 0, 0]
  const index = getImgDataIndex(x, y, width)

  for (let i = 0; i < 4; i++) {
    arr[i] = data[index + i]
  }

  return arr
}

/**
 * 处理 ImageData 的每一个像素点
 */
export function eachPixel(
  imgData: ImageData,
  callback: (pixel: Pixel, x: number, y: number, index: number) => void
) {
  const { width, height } = imgData
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = getPixel(x, y, imgData)
      const index = (width * 4 * y) + (x * 4)
      callback(pixel, x, y, index)
    }
  }
}

/**
 * 美化 ctx.getImageData.data 属性
 * 每一行为一个大数组，每个像素点为一个小数组
 * @param imgData ctx.getImageData 方法获取的 ImageData
 */
export function parseImgData(imgData: ImageData) {
  const { width, height } = imgData
  const arr: Pixel[][] = []

  for (let x = 0; x < width; x++) {
    const row: Pixel[] = []

    for (let y = 0; y < height; y++) {
      row.push(getPixel(x, y, imgData))
    }

    arr.push(row)
  }

  return arr as Pixel[][]
}

/**
 * 给 canvas 某个像素点填充颜色
 */
export function fillPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

/**
 * 放大 ImageData 到指定倍数
 * @returns 返回一个新的 ImageData
 */
export function scaleImgData(imgData: ImageData, scale: number) {
  scale = Math.max(1, Math.floor(scale))

  const { width, height, data } = imgData
  const newWidth = width * scale
  const newHeight = height * scale
  const pixelData = new Uint8ClampedArray(newWidth * newHeight * 4)

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      // 获取原始图像中像素的索引
      const srcIndex = (y * width + x) * 4

      // 将该像素放大 scale 倍
      for (let sy = 0; sy < scale; ++sy) {
        for (let sx = 0; sx < scale; ++sx) {
          // 计算新图像中的目标位置
          const dstX = x * scale + sx
          const dstY = y * scale + sy
          const dstIndex = (dstY * newWidth + dstX) * 4

          // 设置放大的图像中对应位置的颜色
          pixelData[dstIndex] = data[srcIndex]
          pixelData[dstIndex + 1] = data[srcIndex + 1]
          pixelData[dstIndex + 2] = data[srcIndex + 2]
          pixelData[dstIndex + 3] = data[srcIndex + 3]
        }
      }
    }
  }

  return new ImageData(pixelData, newWidth, newHeight)
}

/**
 * 传入图片地址，返回 ImageData
 */
export async function getImgData(
  src: string,
  setImg = (img: HTMLImageElement) => img.crossOrigin = 'anonymous'
) {
  const img = await getImg(src, setImg)
  if (!img) {
    throw new Error('图片加载失败')
  }

  const { ctx, cvs } = createCvs(img.naturalWidth, img.naturalHeight)
  ctx.drawImage(img, 0, 0)

  return {
    ctx,
    cvs,
    imgData: ctx.getImageData(0, 0, cvs.width, cvs.height),

    width: img.width,
    height: img.height,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  }
}
