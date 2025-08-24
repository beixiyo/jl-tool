import type { TransferType } from '@/types'
import { getImg } from '@/domTools'
import { createCvs } from './tools'

/**
 * 裁剪图片指定区域，可设置缩放，返回 base64 | blob
 * @param imgOrUrl 图片
 * @param opts 配置
 * @param resType 需要返回的文件格式，默认 `base64`
 */
export async function cutImg<T extends TransferType = 'base64'>(
  imgOrUrl: HTMLImageElement | string,
  opts: CutImgOpts = {},
  resType: T = 'base64' as T,
): Promise<HandleImgReturn<T>> {
  const image = await getImg(imgOrUrl)

  if (!image)
    return Promise.reject(new Error('image load error'))
  const { naturalWidth, naturalHeight } = image

  const {
    width = naturalWidth,
    height = naturalHeight,
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

  /** 在绘制之前设置缩放 */
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height)

  return getCvsImg<T>(cvs, resType, mimeType, quality)
}

/**
 * 缩放图片到指定大小，保持原始比例
 * @param imgOrUrl 图片或图片地址
 * @param width 目标宽度
 * @param height 目标高度
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param opts 导出配置
 * @returns 返回 base64 | blob 格式的图片
 */
export async function resizeImg<T extends TransferType = 'base64'>(
  imgOrUrl: HTMLImageElement | string,
  width: number,
  height: number,
  resType: T = 'base64' as T,
  opts: ExportImgOpts = {},
) {
  const { cvs, ctx } = createCvs(width, height)
  const image = await getImg(imgOrUrl)

  if (!image)
    return Promise.reject(new Error('image load error'))

  const { naturalWidth, naturalHeight } = image
  const scale = Math.min(width / naturalWidth, height / naturalHeight)

  const scaledWidth = Math.round(naturalWidth * scale)
  const scaledHeight = Math.round(naturalHeight * scale)

  ctx.drawImage(
    image,
    (width - scaledWidth) / 2,
    (height - scaledHeight) / 2,
    scaledWidth,
    scaledHeight,
  )

  return getCvsImg(cvs, resType, opts.mimeType, opts.quality)
}

/**
 * 压缩图片
 * @param imgOrUrl 图片
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param quality 压缩质量，默认 0.5
 * @param mimeType 图片的 MIME 格式，默认 `image/webp`。`image/jpeg | image/webp` 才能压缩
 * @returns base64 | blob
 */
export async function compressImg<T extends TransferType = 'base64'>(
  imgOrUrl: HTMLImageElement | string,
  resType: T = 'base64' as T,
  quality = 0.5,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/webp',
): Promise<HandleImgReturn<T>> {
  const image = await getImg(imgOrUrl)

  if (!image)
    return Promise.reject(new Error('image load error'))
  const { naturalWidth, naturalHeight } = image

  const { cvs, ctx } = createCvs(naturalWidth, naturalHeight)
  ctx.drawImage(image, 0, 0)

  return getCvsImg<T>(cvs, resType, mimeType, quality)
}

/**
 * 把 canvas 上的图像转成 base64 | blob
 * @param cvs canvas
 * @param resType 需要返回的文件格式，默认 `base64`
 * @param mimeType 图片的 MIME 格式。`image/jpeg | image/webp` 才能压缩
 * @param quality 压缩质量
 */
export function getCvsImg<T extends TransferType = 'base64'>(
  cvs: HTMLCanvasElement,
  resType: T = 'base64' as T,
  mimeType?: string,
  quality?: number,
): Promise<HandleImgReturn<T>> {
  switch (resType) {
    case 'base64':
      return Promise.resolve(cvs.toDataURL(mimeType, quality)) as Promise<HandleImgReturn<T>>
    case 'blob':
      return new Promise<Blob>((resolve) => {
        cvs.toBlob(
          (blob) => {
            resolve(blob!)
          },
          mimeType,
          quality,
        )
      }) as Promise<HandleImgReturn<T>>

    default:
      const data: never = resType
      throw new Error(`未知的返回类型：${data}`)
  }
}

/**
 * 获取图片信息
 */
export async function getImgInfo(imgOrUrl: string | HTMLImageElement) {
  const image = await getImg(imgOrUrl)
  if (!image)
    return Promise.reject(new Error('image load error'))

  return {
    naturalHeight: image.naturalHeight,
    naturalWidth: image.naturalWidth,
    width: image.width,
    height: image.height,
    el: image,
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
} & ExportImgOpts

export type ExportImgOpts = {
  /**
   * 图片的 MIME 格式
   * `image/jpeg | image/webp` 才能压缩
   */
  mimeType?: string
  /** 图像质量，取值范围 0 ~ 1 */
  quality?: number
}
