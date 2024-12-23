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
 * 取出 `canvas` 用一维数组描述的颜色中，某个坐标的`RGBA`数组  
 * ### 注意坐标从 0 开始
 * @param x 宽度中的第几列
 * @param y 高度中的第几行
 * @param imgData ctx.getImageData 方法获取的 ImageData
 * @returns `RGBA`数组
 */
export function getPixel(x: number, y: number, imgData: ImageData) {
  const { data, width } = imgData
  const arr: Pixel = [0, 0, 0, 0]
  /**
   * canvas 的像素点是一维数组，需要通过计算获取对应坐标的像素点
   * 一个像素点占 4 个位置，分别是 `R` `G` `B` `A`
   * width * 4 * y 是第 `y` 行的起始位置
   * x * 4 是第 `x` 列的起始位置
   * 然后加上 `i` 就是 `R` `G` `B` `A` 的位置
   */
  const index = (width * 4 * y) + (x * 4)

  for (let i = 0; i < 4; i++) {
    arr[i] = data[index + i]
  }

  return arr
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

/** 给 canvas 某个像素点填充颜色的函数 */
export function fillPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

