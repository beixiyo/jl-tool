import { TransferType } from '@/types'
import { createCvs } from './tools'


/**
 * 截取图片指定区域，可设置缩放，返回 base64 | blob
 * @param img 图片
 * @param opts 配置
 * @param resType 需要返回的文件格式，默认 `base64`
 */
export function cutImg<T extends TransferType = 'base64'>(
  img: HTMLImageElement,
  opts: CutImgOpts = {},
  resType: T = 'base64' as T,
): Promise<HandleImgReturn<T>> {
  const {
    width = img.width,
    height = img.height,
    x = 0,
    y = 0,
    scaleX = 1,
    scaleY = 1,
    mimeType,
    quality,
  } = opts

  const scaledWidth = Math.round(width * scaleX)
  const scaledHeight = Math.round(height * scaleY)

  const { cvs, ctx } = createCvs(scaledWidth, scaledHeight)

  // 在绘制之前设置缩放
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

  return getCvsImg<T>(cvs, resType, mimeType, quality)
}

/**
 * 压缩图片
 * @param img 图片
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param quality 压缩质量，默认 0.5
 * @param mimeType 图片类型，默认 `image/webp`。`image/jpeg | image/webp` 才能压缩
 * @returns base64 | blob
 */
export function compressImg<T extends TransferType = 'base64'>(
  img: HTMLImageElement,
  resType: T = 'base64' as T,
  quality = .5,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/webp'
): Promise<HandleImgReturn<T>> {
  const { cvs, ctx } = createCvs(img.width, img.height)
  ctx.drawImage(img, 0, 0)

  return getCvsImg<T>(cvs, resType, mimeType, quality)
}

/**
 * 把 canvas 上的图像转成 base64 | blob
 * @param cvs canvas
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param mimeType 图片的 MIME 格式
 * @param quality 压缩质量
 */
export function getCvsImg<T extends TransferType = 'base64'>(
  cvs: HTMLCanvasElement,
  resType: T = 'base64' as T,
  mimeType?: string,
  quality?: number
): Promise<HandleImgReturn<T>> {
  switch (resType) {
    case 'base64':
      return Promise.resolve(cvs.toDataURL(mimeType, quality)) as Promise<HandleImgReturn<T>>
    case 'blob':
      return new Promise<Blob>((resolve) => {
        cvs.toBlob(
          blob => {
            resolve(blob!)
          },
          mimeType,
          quality
        )
      }) as Promise<HandleImgReturn<T>>

    default:
      const data: never = resType
      throw new Error(`未知的返回类型：${data}`)
  }
}



export type HandleImgReturn<T extends TransferType> =
  T extends 'blob'
  ? Blob
  : string

export type CutImgOpts = {
  x?: number
  y?: number
  width?: number
  height?: number
  scaleX?: number
  scaleY?: number

  /** 图片的 MIME 格式 */
  mimeType?: string
  /** 图像质量，取值范围 0 ~ 1 */
  quality?: number
}
