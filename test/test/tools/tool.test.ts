import { celsiusToFahrenheit, cutStr, deepClone, excludeKeys, excludeVals, fahrenheitToCelsius, filterKeys, filterVals, genIcon, getType, numFixed, padEmptyObj, padNum, randomStr, toCamel } from '@/tools/tools'
import { describe, expect, test } from 'vitest'


test('获取类型', () => {
    expect(getType(undefined)).toBe('undefined')
    expect(getType(null)).toBe('null')
    expect(getType({})).toBe('object')

    expect(getType(1)).toBe('number')
    expect(getType(NaN)).toBe('number')
    expect(getType('1')).toBe('string')

    expect(getType(new Map())).toBe('map')
    expect(getType(new Set())).toBe('set')

    expect(getType(() => { })).toBe('function')
    expect(getType(function () { })).toBe('function')
    expect(getType(async function () { })).toBe('asyncfunction')
})


test('随机字符串', () => {
    expect(randomStr()).toHaveLength(10)
    expect(typeof randomStr()).toBe('string')
})

test('温度转换', () => {
    expect(celsiusToFahrenheit(40)).toBe(104)
    expect(fahrenheitToCelsius(104)).toBe(40)
})


describe('深克隆', () => {
    const temp: any = { t: 1 }
    const o: any = { a: 1, b: 2, c: 3, temp }

    o.temp = temp
    temp.o = o

    test('引用地址', () => {
        expect(deepClone(o)).not.toBe(o)
    })

    test('循环引用', () => {
        expect(deepClone(o)).toEqual(o)
    })
})


test('截取字符串', () => {
    const str = '123456789'
    expect(cutStr(str, 6)).toBe('123...')
    expect(cutStr(str, 7)).toBe('1234...')

    expect(cutStr(str, 3)).toBe('123')
    expect(cutStr(str, 0)).toBe('')
    expect(cutStr(str, -1)).toBe('12345678')

    expect(cutStr(str, 6, '---')).toBe('123---')
    expect(cutStr(str, 6, '--')).toBe('1234--')
})


// ==========================================================


const o = {
    a: 0,
    b: '0',
    c: '\n',
    d: '\t',
    e: '  ',
    f: '',
    g: 'null',
    h: null,
    i: undefined,
    j: {},
    k: [],
}

describe('填补对象空值', () => {
    test('忽略 0', () => {
        expect(padEmptyObj(o)).toEqual(getBaseRes())
    })

    test('不忽略 0', () => {
        expect(padEmptyObj(o, {
            ignoreNum: false
        })).toEqual({
            ...getBaseRes(),
            a: '--'
        })
    })

    test('忽略 0 并自定义分隔符', () => {
        const sep = '***'
        expect(padEmptyObj(o, {
            ignoreNum: false,
            padStr: sep
        }))
            .toEqual({
                ...getBaseRes(sep),
                a: sep
            })
    })
})


function getBaseRes(sep = '--') {
    return {
        a: 0,
        b: '0',
        c: sep,
        d: sep,
        e: sep,
        f: sep,
        g: 'null',
        h: sep,
        i: sep,
        j: {},
        k: [],
    }
}


// ==========================================================


test('蛇形转驼峰', () => {
    expect(toCamel('my_ass_oh_no')).toBe('myAssOhNo')
})

test('自定义转换符号', () => {
    expect(toCamel('test/a', '/')).toBe('testA')
})


test('数字补齐精度', () => {
    expect(padNum(1)).toBe('1.00')
    expect(padNum(1, 3)).toBe('1.000')
    expect(padNum(1, 3, '1')).toBe('1.111')
})

test('解决 Number.toFixed 计算错误', () => {
    /** 反面教材 */
    expect(1.335.toFixed(2)).toBe('1.33')
    expect(numFixed(1.335, 2)).toBe(1.34)
})


test('生成 (iconfont | 其他) 的类名', () => {
    expect(genIcon('face')).toBe('iconfont icon-face')
    expect(genIcon('face', 'prefix')).toBe('prefix icon-face')
    expect(genIcon('face', 'prefix', 'last')).toBe('prefix last-face')
})


// ==========================================================


describe('提取 | 排除对象值', () => {
    const obj = {
        a: 1,
        b: 0,
        c: null,
        d: undefined,
        f: 100
    }

    test('提取键测试', () => {
        expect(filterKeys(obj, ['a', 'b'])).toEqual({
            a: 1,
            b: 0
        })
    })
    test('排除键测试', () => {
        expect(excludeKeys(obj, ['a', 'b'])).toEqual({
            c: null,
            d: undefined,
            f: 100
        })
    })

    test('提取值测试', () => {
        expect(filterVals(obj, [1, 0])).toEqual({
            a: 1,
            b: 0
        })
    })
    test('排除值测试', () => {
        expect(excludeVals(obj, [1, 0])).toEqual({
            c: null,
            d: undefined,
            f: 100
        })
    })
})