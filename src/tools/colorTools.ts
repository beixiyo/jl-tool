import { Reg } from '@/shared'
import { numFixed } from './tools'

/**
 * 把颜色提取出 RGBA
 * @example
 * ```ts
 * getColorInfo('rgba(0, 0, 0, 1)')
 * getColorInfo('rgb(0, 0, 0)')
 *
 * getColorInfo('#fff')
 * getColorInfo('#fff1')
 * ```
 */
export function getColorInfo(color: string) {
  if (color.startsWith('#')) {
    color = hexToRGB(color)
  }

  let rgbColor: RegExpMatchArray | null
  if ((rgbColor = color.match(Reg.rgb))) {
    const r = Number.parseInt(rgbColor[1])
    const g = Number.parseInt(rgbColor[2])
    const b = Number.parseInt(rgbColor[3])
    const alpha = rgbColor[4] !== undefined
      ? Number.parseFloat(rgbColor[4])
      : 1

    return {
      r,
      g,
      b,
      a: alpha,
    }
  }

  return {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  }
}

/**
 * 获取十六进制随机颜色
 * @returns 十六进制颜色字符串，格式为 '#RRGGBB'
 *
 * @example
 * ```ts
 * // 基础用法
 * getColor() // '#a1b2c3'
 * getColor() // '#ff0000'
 * getColor() // '#00ff00'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 生成随机主题色
 * const themeColor = getColor()
 * document.documentElement.style.setProperty('--primary-color', themeColor)
 * ```
 */
export function getColor() {
  return `#${Math.random().toString(16).slice(2, 8).padEnd(6, '0')}`
}

/**
 * 生成随机十六进制颜色数组
 * @param size 数组长度
 * @returns 十六进制颜色字符串数组
 *
 * @example
 * ```ts
 * // 基础用法
 * getColorArr(3) // ['#a1b2c3', '#ff0000', '#00ff00']
 * getColorArr(5) // ['#123456', '#789abc', '#def012', '#345678', '#9abcde']
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 生成调色板
 * const palette = getColorArr(8)
 * palette.forEach((color, index) => {
 *   console.log(`颜色 ${index + 1}: ${color}`)
 * })
 * ```
 */
export function getColorArr(size: number) {
  return Array
    .from({ length: size })
    .map(() => getColor())
}

/**
 * 把十六进制颜色转成原始长度的颜色
 * @param color 十六进制颜色字符串
 * @returns 扩展后的十六进制颜色字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * hexColorToRaw('#000') // '#000000'
 * hexColorToRaw('#000f') // '#000000ff'
 * hexColorToRaw('#abc') // '#aabbcc'
 * hexColorToRaw('#abcdef') // '#abcdef'（已经是完整格式）
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 颜色标准化
 * const shortColor = '#f0f'
 * const fullColor = hexColorToRaw(shortColor)
 * console.log(fullColor) // '#ff00ff'
 * ```
 */
export function hexColorToRaw(color: string) {
  if (!color.startsWith('#')) {
    console.warn('the color is invalidate')
    return genDefaultColor()
  }

  /** 排除类似 #000000 | #000000ff 正常长度的颜色 */
  if (color.length > '#000f'.length) {
    return color
  }

  let c = '#'
  for (let i = 1; i < color.length; i++) {
    const s = color[i]
    c += s + s
  }
  return c
}

/**
 * 十六进制颜色转 RGB
 * @param color 十六进制颜色字符串
 * @returns RGB 或 RGBA 颜色字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * hexToRGB('#ff0000') // 'rgb(255, 0, 0)'
 * hexToRGB('#00ff00') // 'rgb(0, 255, 0)'
 * hexToRGB('#0000ff80') // 'rgba(0, 0, 255, 0.5)'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 颜色转换
 * const hexColor = '#ff6b6b'
 * const rgbColor = hexToRGB(hexColor)
 * element.style.backgroundColor = rgbColor
 * ```
 */
export function hexToRGB(color: string) {
  if (color.startsWith('#')) {
    const _color = hexColorToRaw(color) as string
    const colorArr = []

    for (let i = 1; i < _color.length; i += 2) {
      const str = _color.slice(i, i + 2)
      colorArr.push(Number.parseInt(str, 16))
    }
    if (colorArr.length === 4) {
      colorArr[3] = numFixed(colorArr[3] / 255, 2)
    }

    return colorArr.length >= 4
      ? `rgba(${colorArr.join(', ')})`
      : `rgb(${colorArr.join(', ')})`
  }

  console.warn('the color is invalidate')
  return genDefaultColor()
}

/**
 * RGB 转十六进制
 * @param color RGB 或 RGBA 颜色字符串
 * @returns 十六进制颜色字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * rgbToHex('rgb(255, 0, 0)') // '#ff0000'
 * rgbToHex('rgba(0, 255, 0, 0.5)') // '#00ff0080'
 * rgbToHex('rgb(0, 0, 255)') // '#0000ff'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 颜色格式转换
 * const rgbColor = 'rgb(255, 107, 107)'
 * const hexColor = rgbToHex(rgbColor)
 * console.log(hexColor) // '#ff6b6b'
 * ```
 */
export function rgbToHex(color: string) {
  let rgbColor: RegExpMatchArray | null

  if ((rgbColor = color.match(Reg.rgb))) {
    const r = Number.parseInt(rgbColor[1])
    const g = Number.parseInt(rgbColor[2])
    const b = Number.parseInt(rgbColor[3])
    const alpha = rgbColor[4] !== undefined
      ? Number.parseFloat(rgbColor[4])
      : 1

    /** 将 alpha 转换为十六进制 并乘以255 然后转换为两位的十六进制 */
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')

    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}${alphaHex}`
  }

  const _color = hexColorToRaw(color)
  if (_color)
    return _color
}

/**
 * 淡化颜色透明度，支持 `RGB` 和 `十六进制`
 * @param color 颜色字符串，支持 RGB、RGBA 和十六进制格式
 * @param strength 淡化的强度，范围 0-1
 * @returns 返回 RGBA 格式的颜色字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * lightenColor('rgba(0, 239, 255, 1)', 0.5) // 'rgba(0, 239, 255, 0.5)'
 * lightenColor('#ff0000', 0.3) // 'rgba(255, 0, 0, 0.7)'
 * lightenColor('rgb(0, 255, 0)', 0.8) // 'rgba(0, 255, 0, 0.2)'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 创建半透明背景
 * const primaryColor = '#3b82f6'
 * const lightBackground = lightenColor(primaryColor, 0.9)
 * element.style.backgroundColor = lightBackground
 * ```
 */
export function lightenColor(color: string, strength = 0) {
  if (color.startsWith('#')) {
    color = hexToRGB(color)
    if (!color) {
      console.warn('the color is invalidate')
      return genDefaultColor()
    }
  }

  const match = color.match(Reg.rgb)
  if (!match) {
    console.warn('the color is invalidate')
    return genDefaultColor()
  }

  const [_prev, r, g, b, a = 1] = match
  let alpha = +a - strength
  if (alpha < 0) {
    alpha = 0
  }
  else if (alpha > 1) {
    alpha = 1
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 颜色添加透明度，支持 `RGB` 和 `十六进制`
 * @param color 颜色字符串，支持 RGB、RGBA 和十六进制格式
 * @param opacity 透明度，范围 0-1
 * @returns 返回带透明度的十六进制颜色字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * colorAddOpacity('#ff0000', 0.5) // '#ff000080'
 * colorAddOpacity('rgb(0, 255, 0)', 0.3) // '#00ff004d'
 * colorAddOpacity('rgba(0, 0, 255, 0.8)', 0.2) // '#0000ff33'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 创建带透明度的颜色
 * const baseColor = '#3b82f6'
 * const transparentColor = colorAddOpacity(baseColor, 0.1)
 * element.style.backgroundColor = transparentColor
 * ```
 */
export function colorAddOpacity(color: string, opacity = 0.1) {
  color = rgbToHex(color) || '#000000'
  color = color.slice(0, 7)

  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0')
  return color + alphaHex
}

/**
 * 混合两种颜色
 * @param color1 第一种颜色，支持 RGB、RGBA 和十六进制格式
 * @param color2 第二种颜色，支持 RGB、RGBA 和十六进制格式
 * @param weight 第一种颜色的权重，范围 0-1，默认 0.5
 * @returns 混合后的 RGBA 颜色字符串
 *
 * @example
 * ```ts
 * // 基础用法
 * mixColor('#ff0000', '#0000ff', 0.5) // 'rgba(128, 0, 128, 1)'
 * mixColor('rgb(255, 0, 0)', 'rgb(0, 255, 0)', 0.3) // 'rgba(77, 179, 0, 1)'
 * mixColor('#ff0000', '#00ff00', 0.8) // 'rgba(204, 51, 0, 1)'
 * ```
 *
 * @example
 * ```ts
 * // 实际应用 - 创建渐变色
 * const startColor = '#ff6b6b'
 * const endColor = '#4ecdc4'
 * const midColor = mixColor(startColor, endColor, 0.5)
 * console.log(midColor) // 两种颜色的中间色
 * ```
 */
export function mixColor(color1: string, color2: string, weight = 0.5) {
  const c1 = getColorInfo(color1)
  const c2 = getColorInfo(color2)

  const r = Math.round(c1.r * weight + c2.r * (1 - weight))
  const g = Math.round(c1.g * weight + c2.g * (1 - weight))
  const b = Math.round(c1.b * weight + c2.b * (1 - weight))
  const a = Math.round(c1.a * weight + c2.a * (1 - weight))

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function genDefaultColor() {
  return 'rgba(0, 0, 0, 0)'
}
