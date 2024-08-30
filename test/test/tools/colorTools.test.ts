import { colorAddOpacity, getColor, getColorArr, getColorInfo, hexColorToRaw, hexToRGB, lightenColor } from '@/tools/colorTools'
import { expect, test } from 'vitest'


test('获取随机颜色', () => {
    expect(getColor()).toMatch(/^#/)
    expect(getColor()).toHaveLength(7)
})

test('获取随机颜色数组', () => {
    expect(getColorArr(10)).toHaveLength(10)
    expect(getColorArr(10)[0]).toMatch(/^#/)
    expect(getColorArr(10)[0]).toHaveLength(7)
})


test('补齐 16 进制颜色长度', () => {
    expect(hexColorToRaw('#000')).toBe('#000000')
    expect(hexColorToRaw('#000f')).toBe('#000000ff')
})


const blackHex = '#000',
    blackRGB = 'rgb(0, 0, 0)',
    blackRGBA = 'rgba(0, 0, 0, 0)'

test('16 进制转 RGB', () => {
    expect(hexToRGB(blackHex)).toBe(blackRGB)
    expect(hexToRGB('#0000')).toBe(blackRGBA)
})

test('RGB 转十六进制', () => {
    expect(hexToRGB(blackRGB)).toBe(blackRGBA)
    expect(hexToRGB('#fff')).toBe('rgb(255, 255, 255)')
    expect(hexToRGB('#ffff')).toBe('rgba(255, 255, 255, 1)')
})


test('淡化颜色透明度', () => {
    expect(lightenColor(blackHex, .5)).toBe('rgba(0, 0, 0, 0.5)')
    expect(lightenColor(blackRGB, .1)).toBe('rgba(0, 0, 0, 0.9)')
})

test('颜色添加透明度', () => {
    expect(colorAddOpacity(blackHex, .5)).toBe('#00000080')
    expect(colorAddOpacity(blackRGB, .5)).toBe('#00000080')
    expect(colorAddOpacity(blackRGBA, .5)).toBe('#00000080')

    expect(colorAddOpacity(blackRGBA)).toBe('#0000001a')
})


test('提取颜色', () => {
    expect(getColorInfo('rgba(0, 0, 0, 1)'))
        .toEqual({ r: 0, g: 0, b: 0, a: 1 })
        
    expect(getColorInfo('rgb(0, 0, 0, 1)'))
        .toEqual({ r: 0, g: 0, b: 0, a: 1 })
        
    expect(getColorInfo('#fff'))
        .toEqual({ r: 255, g: 255, b: 255, a: 1 })

    expect(getColorInfo('#ffffff11'))
        .toEqual({ r: 255, g: 255, b: 255, a: .07 })

    expect(getColorInfo('#fff0'))
        .toEqual({ r: 255, g: 255, b: 255, a: 0 })

})