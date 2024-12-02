import { DEG_1 } from '@/shared'


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
