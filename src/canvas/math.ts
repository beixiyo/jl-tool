import { DEG_1 } from '@/shared'
import { getWinHeight, getWinWidth } from '@/tools/domTools'


/**
 * 根据总面积、宽高计算宽高
 * @param totalArea 期望的总面积
 * @param aspectRatio 宽高比元组
 * @param options 可选最大范围限制
 * @returns 计算出的 [宽度, 高度]
 */
export function calcAspectRatio(
  totalArea: number,
  aspectRatio: [number, number],
  options: {
    maxWidth?: number,
    maxHeight?: number
  } = {}
): [number, number] {
  const [widthRatio, heightRatio] = aspectRatio

  // 计算初始缩放因子
  const scalingFactor = Math.sqrt(totalArea / (widthRatio * heightRatio))

  // 计算初始宽高
  let width = Math.round(widthRatio * scalingFactor)
  let height = Math.round(heightRatio * scalingFactor)

  const { maxHeight, maxWidth } = options
  if (maxWidth !== undefined && maxHeight != undefined) {
    // 检查是否超出画板限制
    const widthScale = maxWidth / width
    const heightScale = maxHeight / height

    // 选择最小的缩放比例，确保不超出画板
    const finalScale = Math.min(1, widthScale, heightScale)

    // 应用最终缩放
    width = Math.round(width * finalScale)
    height = Math.round(height * finalScale)
  }

  return [width, height]
}


/**
 * 根据半径和角度获取 DOM 坐标
 * @param r 半径
 * @param deg 角度
 */
export function calcCoord(r: number, deg: number) {
  const x = Math.sin(deg * DEG_1) * r,
    // 数学坐标系和图像坐标系相反
    y = -Math.cos(deg * DEG_1) * r
  return [x, y] as const
}

/**
 * 将鼠标的坐标映射为在一个特定范围内的坐标
 * 
 * @example
 * ```ts
 * // 范围在 [-1, 1]
 * calcDOMCoord(e, innerWidth, innerHeight, 1)
 * 
 * // 范围在 [-1, 1]，y 轴反转
 * calcDOMCoord(e, innerWidth, innerHeight, 1, true)
 * 
 * // 范围在 [0, 1]
 * calcDOMCoord(e, innerWidth, innerHeight, false)
 * ```
 * 
 * @param point 鼠标的 x y 坐标
 * @param width 窗口的宽度，默认窗口宽度
 * @param height 窗口的高度，默认窗口高度
 * @param range 坐标转换的范围，默认为 1，表示范围在 `[-1, 1]`。如果传 false，则范围在 `[0, 1]`
 * @param isReverse 是否反转 y 坐标，默认 false，DOM 坐标的 y 轴和数学坐标系是相反的
 * @returns 返回一个包含 x 和 y 坐标的数组
 */
export function calcDOMCoord(
  point: Pick<MouseEvent, 'clientX' | 'clientY'>,
  width = getWinWidth(),
  height = getWinHeight(),
  range: number | false = 1,
  isReverse = false,
) {
  const { clientX, clientY } = point

  let x: number,
    y: number

  if (range === false) {
    x = clientX / width
    y = -clientY / height + 1

    if (isReverse) {
      y = clientY / height
    }
  }
  else {
    x = (clientX / width) * range * 2 - range
    y = -(clientY / height) * range * 2 + range

    if (isReverse) {
      y = (clientY / height) * range * 2 - range
    }
  }

  return [x, y] as const
}
