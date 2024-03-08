import { TransferType } from '@/types'
import { createCvs } from './tools'

/**
 * 截取图片的一部分，返回 base64 | blob
 */
export function cutImg<T extends TransferType>(
    img: HTMLImageElement,
    resType: T,
    x = 0,
    y = 0,
    width = img.width,
    height = img.height,
    opts: {
        type?: string
        quality?: number,
    } = {},
): HandleImgReturn<T> {
    img.setAttribute('crossOrigin', 'anonymous')
    const { cvs, ctx } = createCvs(width, height)
    const { type, quality } = opts
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

    if (resType === 'base64') {
        return Promise.resolve(cvs.toDataURL(type, quality)) as HandleImgReturn<T>
    }

    return new Promise<Blob>((resolve) => {
        cvs.toBlob(
            blob => {
                resolve(blob)
            },
            type,
            quality
        )
    }) as HandleImgReturn<T>
}


/**
 * 压缩图片
 * @param img 图片
 * @param resType 需要返回的文件格式
 * @param quality 压缩质量，默认 0.5
 * @param mimeType 图片类型，默认 `image/webp`。`image/jpeg | image/webp` 才能压缩，
 * @returns base64 | blob
 */
export function compressImg<T extends TransferType>(
    img: HTMLImageElement,
    resType: T,
    quality = .5,
    mimeType: 'image/jpeg' | 'image/webp' = 'image/webp'
): HandleImgReturn<T> {
    const { cvs, ctx } = createCvs(img.width, img.height)
    ctx.drawImage(img, 0, 0)

    if (resType === 'base64') {
        return Promise.resolve(cvs.toDataURL(mimeType, quality)) as HandleImgReturn<T>
    }

    return new Promise((resolve) => {
        cvs.toBlob(
            (blob) => {
                resolve(blob)
            },
            mimeType,
            quality
        )
    }) as HandleImgReturn<T>
}


type HandleImgReturn<T extends TransferType> =
    T extends 'blob'
    ? Promise<Blob>
    : Promise<string>
