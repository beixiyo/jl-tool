/**
 * 根据总面积、宽高计算宽高
 * @param totalArea 期望的总面积，宽 * 高
 * @param aspectRatio 宽高比元组
 * @param options 可选最大范围限制、是否需要被指定数值整除
 * @returns 计算出的 [宽度, 高度]
 */
export function calcAspectRatio(
  totalArea: number,
  aspectRatio: [number, number],
  options: AspectRatioOpts = {},
): [number, number] {
  const [widthRatio, heightRatio] = aspectRatio

  /** 计算初始缩放因子 */
  const scalingFactor = Math.sqrt(totalArea / (widthRatio * heightRatio))

  /** 计算初始宽高 */
  let width = Math.round(widthRatio * scalingFactor)
  let height = Math.round(heightRatio * scalingFactor)

  const { maxHeight, maxWidth } = options
  if (maxWidth !== undefined && maxHeight != undefined) {
    /** 检查是否超出画板限制 */
    const widthScale = maxWidth / width
    const heightScale = maxHeight / height

    /** 选择最小的缩放比例，确保不超出画板 */
    const finalScale = Math.min(1, widthScale, heightScale)

    /** 应用最终缩放 */
    width = Math.round(width * finalScale)
    height = Math.round(height * finalScale)
  }

  /** 检查是否需要被指定数值整除 */
  if (options.divisionBy !== undefined) {
    width = width % options.divisionBy === 0
      ? width
      : width - (width % options.divisionBy)

    height = height % options.divisionBy === 0
      ? height
      : height - (height % options.divisionBy)
  }

  return [width, height]
}

export type AspectRatioOpts = {
  /**
   * 最大宽度
   */
  maxWidth?: number
  /**
   * 最大高度
   */
  maxHeight?: number
  /**
   * 是否需要被指定数值整除
   */
  divisionBy?: number
}
