import type { TransferType } from '@/types'
import { getImg } from '@/domTools'
import { createCvs, supportsWebpEncode } from './tools'

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
 * 压缩图片到不超过指定体积：先逐级降低质量，最低质量仍超限时按比例缩小分辨率后重试
 *
 * 图片只解码一次；同一分辨率下只绘制一次，逐级降质只重新编码
 * Safari 等不支持 WebP 编码的环境会自动降级为 JPEG（见 `getCvsImg`）
 * @param imgOrUrl 图片
 * @param opts 配置
 * @returns 达标图片的 `Blob`；质量与分辨率都用尽仍超限时返回 `null`。图片加载失败会 reject
 */
export async function compressImgToMaxSize(
  imgOrUrl: HTMLImageElement | string,
  opts: CompressImgToMaxSizeOpts,
): Promise<Blob | null> {
  const {
    maxBytes,
    quality = 0.85,
    minQuality = 0.25,
    qualityStep = 0.1,
    scaleStep = 0.8,
    minScale = 0.2,
    mimeType = 'image/webp',
  } = opts

  const image = await getImg(imgOrUrl)

  if (!image)
    return Promise.reject(new Error('image load error'))
  const { naturalWidth, naturalHeight } = image

  for (let scale = 1; ; scale *= scaleStep) {
    const { cvs, ctx } = createCvs(
      Math.max(1, Math.round(naturalWidth * scale)),
      Math.max(1, Math.round(naturalHeight * scale)),
    )
    ctx.drawImage(image, 0, 0, cvs.width, cvs.height)

    /** 逐级降质：从 quality 降到不小于 minQuality 的最低值 */
    for (let q = quality; ; q -= qualityStep) {
      const blob = await getCvsImg(cvs, 'blob', mimeType, q)
      if (blob.size <= maxBytes)
        return blob

      if (q - qualityStep < minQuality)
        break
    }

    /** 分辨率已缩到下限仍不达标，放弃 */
    if (scale * scaleStep < minScale)
      return null
  }
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
  /**
   * Safari 不支持 WebP 编码，传入 `image/webp` 会静默回退为 PNG（忽略 quality），
   * 照片类图片的 PNG 几乎必然比原图更大，这里主动降级为同样支持压缩的 JPEG
   */
  if (mimeType === 'image/webp' && !supportsWebpEncode())
    mimeType = 'image/jpeg'

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
      throw new Error(`Unknown return type: ${data}`)
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

export type CompressImgToMaxSizeOpts = {
  /** 目标最大字节数 */
  maxBytes: number
  /** 首次压缩质量。@default 0.85 */
  quality?: number
  /** 允许降低到的最低质量，再低会改为缩小分辨率。@default 0.25 */
  minQuality?: number
  /** 每次递归降低的质量。@default 0.1 */
  qualityStep?: number
  /** 最低质量仍超限时，每轮缩小的分辨率比例。@default 0.8 */
  scaleStep?: number
  /** 允许缩小到的最小分辨率比例（相对原图）。@default 0.2 */
  minScale?: number
  /**
   * 编码格式，不支持 WebP 编码的环境自动降级为 `image/jpeg`
   * @default 'image/webp'
   */
  mimeType?: 'image/webp' | 'image/jpeg'
}
