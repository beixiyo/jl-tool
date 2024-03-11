import { ONE_DAY } from '@/shared'
import { isObj } from '@/shared/is'
import { TimeType, TreeData } from '@/types'


/** 获取类型 */
export const getType = (data: any) => (Object.prototype.toString.call(data) as string).slice(8, -1).toLowerCase()

/** 随机长度为`10`的字符串 */
export const randomStr = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

/** 今年的第几天 */
export const dayOfYear = (date: Date = new Date()) => Math.floor((+date - +(new Date(date.getFullYear(), 0, 0))) / ONE_DAY)

/** 获取时分秒 */
export const timeFromDate = (date: Date) => date.toTimeString().slice(0, 8)

/** 摄氏度转华氏度 */
export const celsiusToFahrenheit = (celsius: number) => celsius * 9 / 5 + 32
/** 华氏度转摄氏度 */
export const fahrenheitToCelsius = (fahrenheit: number) => (fahrenheit - 32) * 5 / 9

/** 获取日期间隔 单位(天) */
export function dayDiff(date1: TimeType, date2: TimeType) {
    const d1 = new Date(date1),
        d2 = new Date(date2)
    return Math.ceil(Math.abs(+d1 - +d2) / ONE_DAY)
}

/**
 * 获取随机范围整型数值 不包含最大值
 */
export function getRandomNum(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min)
}

/**
 * 对数组求和
 * @param handler 可以对数组每一项进行操作，返回值将会被相加
 */
export function getSum<T>(arr: T[], handler?: (item: T) => number): number {
    return arr.reduce(
        (init, item) => {
            const val = handler
                ? handler(item)
                : item

            if (typeof val !== 'number') {
                throw new Error('数组中的值或处理过的值必须是数字')
            }

            return init + val
        },
        0
    )
}

/** 深拷贝 */
export function deepClone<T>(data: T, map = new WeakMap) {
    if (typeof data !== 'object') return data
    if (data instanceof Date) return new Date(data)
    if (data instanceof RegExp) return new RegExp(data)

    if (map.has(data)) return map.get(data)

    const tar = new (data as any).constructor()
    map.set(data, tar)
    for (const key in data) {
        if (!data.hasOwnProperty(key)) continue
        tar[key] = deepClone(data[key], map)
    }
    return tar
}

/** 深度比较对象 `Map | Set`无法使用 */
export function deepCompare(o1: any, o2: any, seen = new WeakMap()) {
    if (Object.is(o1, o2)) {
        return true
    }

    if (!isObj(o1) || !isObj(o2) || getType(o1) !== getType(o2)) {
        return false
    }

    /** 循环引用 说明深度不同 */
    if (seen.has(o1) || seen.has(o2)) {
        return false
    }

    seen.set(o1, true)
    seen.set(o2, true)

    const keys1 = Object.keys(o1).concat(Object.getOwnPropertySymbols(o1) as any)
    const keys2 = Object.keys(o2).concat(Object.getOwnPropertySymbols(o2) as any)

    if (keys1.length !== keys2.length) {
        seen.delete(o1)
        seen.delete(o2)
        return false
    }

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepCompare(o1[key], o2[key], seen)) {
            seen.delete(o1)
            seen.delete(o2)
            return false
        }
    }

    seen.delete(o1)
    seen.delete(o2)
    return true
}

/** 递归树拍平 */
export function arrToTree(arr: TreeData[]): TreeData[] {
    if (arr.length < 2) return arr
    const res = [],
        map = {}

    arr.forEach(item => {
        const { pid, id } = item
        !map[id] && (map[id] = { children: [] })

        map[id] = {
            ...item,
            children: map[id].children
        }

        const treeItem = map[id]
        if (pid === 0) {
            res.push(treeItem)
        }
        else {
            if (!map[pid]) {
                map[pid] = {
                    children: []
                }
            }

            map[pid].children.push(treeItem)
        }
    })

    return res
}

/**
 * 把数组分成 n 块
 * @param arr 数组
 * @param size 每个数组大小
 * @returns 返回二维数组
 */
export function arrToChunk<T>(arr: T[], size: number): T[][] {
    if (size <= 1) return arr.map((item) => [item])

    const _arr: any[] = []
    const chunkSize = Math.ceil(arr.length / size)
    for (let i = 0; i < chunkSize; i++) {
        _arr.push(arr.slice(i * size, (i + 1) * size))
    }

    return _arr
}

/** 二分查找，必须是正序的数组 */
export function binarySearch<T>(arr: T[], target: T) {
    let left = 0,
        right = arr.length - 1

    while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        if (arr[mid] === target) {
            return mid
        }
        else if (arr[mid] < target) {
            left = mid + 1
        }
        else {
            right = mid - 1
        }
    }

    return -1
}

/**
 * 截取字符串，默认补 `...` 到后面  
 * 如果长度小于等于 `placeholder` 补充字符串的长度，则直接截取
 * @param str 字符串
 * @param len 需要截取的长度
 * @param placeholder 补在后面的字符串 默认`...`
 */
export function cutStr(str: string, len: number, placeholder = '...') {
    const placeholderLen = placeholder.length
    if (len <= placeholderLen) {
        return str.slice(0, len)
    }

    const newStr = str.slice(0, len)

    return str.length > len
        ? str.slice(0, len - placeholderLen) + placeholder
        : newStr
}

/**
 * 蛇形转驼峰 也可以指定转换其他的
 * @param key 需要转换的字符串
 * @param replaceStr 默认是 `_`，也就是蛇形转驼峰
 * @example
 * toCamel('test_a') => 'testA'
 * toCamel('test/a', '/') => 'testA'
 */
export function toCamel(key: string, replaceStr = '_') {
    const reg = new RegExp(`${replaceStr}([a-z])`, 'ig')

    return key.replace(reg, (_, g1) => {
        return g1.toUpperCase()
    })
}

/** 柯里化 */
export function curry() {
    const fn = Array.prototype.slice.call(arguments, 0, 1)[0],
        argArr = Array.prototype.slice.call(arguments, 1)

    if (arguments.length >= fn.length) {
        return fn.apply(this, argArr)
    }

    return function curried(...args: any[]) {
        if (args.length >= fn.length) {
            return fn.apply(this, args)
        }

        return function (...moreArgs: any[]) {
            return curried.apply(this, moreArgs.concat(args))
        }
    }
}

/**
 * 数字补齐精度
 * @param num 数字
 * @param precision 精度长度 默认`2`
 * @param placeholder 补齐内容 默认`0`
 * @returns
 */
export function padNum(num: string | number, precision = 2, placeholder = '0') {
    num = String(num)
    if (!num) return ''
    if (!num.includes('.')) {
        return num + '.' + placeholder.repeat(precision)
    }

    const arr = num.split('.'),
        len = arr[1].length
    if (len < precision) {
        return num + placeholder.repeat(precision - len)
    }
    return num
}

/**
 * 解决 Number.toFixed 计算错误
 * @example
 * 1.335.toFixed(2) => '1.33'
 * numFixed(1.335) => 1.34
 *
 * @param num 数值
 * @param precision 精度 默认 2
 */
export function numFixed(num: number, precision = 2) {
    const scale = 10 ** precision
    return Math.round(num * scale) / scale
}

/**
 * 日期补零 把`yyyy-MM-dd` 转成 `yyyy-MM-dd HH:mm:ss`
 * @param date 格式: `2016-06-10` 必须和它长度保持一致
 * @param placeholder 后面补充的字符串 默认`00:00:00`
 * @returns 如`2016-06-10 10:00:00`
 */
export function padDate(date: string, placeholder = '00:00:00') {
    if (!date) throw new Error('日期格式必须是`yyyy-MM-dd`')
    if (date.length !== '2016-06-10'.length) throw new Error('日期格式必须是`yyyy-MM-dd`')

    return date + ' ' + placeholder
}

/**
 * 把日期转为 `Date` 对象
 * @param date 日期，可以是字符串或者时间戳
 */
export function getValidDate(date: Date | string | number) {
    if (getType(date) !== 'date') {
        date = new Date(date)
        if (String(date) === 'Invalid Date') {
            throw new Error('日期格式错误')
        }
    }

    return date
}

/**
 * 返回给定日期是否小于某年`一月一日` 默认去年
 * @param curDate 当前日期
 * @param yearLen 年份长度，默认 `-1`，即去年
 */
export function isLtYear(curDate: Date | string | number, yearLen = -1) {
    curDate = getValidDate(curDate)

    const date = new Date()
    date.setFullYear(date.getFullYear() + yearLen)
    date.setMonth(0)
    date.setDate(0)

    return curDate < date
}

/**
 * 生成 iconfont 的类名
 * @param name icon 名字
 * @param prefix 前缀默认 iconfont
 * @param suffix 后缀默认 icon
 * @param connector 连接符默认 -
 * @returns **iconfont icon-${name}**
 */
export function genIcon(name: string, prefix = 'iconfont', suffix = 'icon', connector = '-') {
    return `${prefix} ${suffix}${connector}${name}`
}


/**
 * 返回一个新对象，对象会提取值在 extractArr，中的元素
 * 例如提取所有空字符串
 * @example filterVals(data, [''])
 */
export function filterVals<T>(data: T, extractArr: any[]) {
    const _data: Partial<T> = {}

    for (const k in data) {
        if (!Object.hasOwnProperty.call(data, k)) continue

        const item = data[k]
        if (extractArr.includes(item)) {
            _data[k] = item
        }
    }
    return _data
}

/**
 * 返回一个新对象，对象会排除值在 excludeArr，中的元素
 * 例如排除所有空字符串
 * @example excludeVals(data, [''])
 */
export function excludeVals<T>(data: T, excludeArr: any[]) {
    const _data: Partial<T> = {}

    for (const k in data) {
        if (!Object.hasOwnProperty.call(data, k)) continue

        const item = data[k]
        if (!excludeArr.includes(item)) {
            _data[k] = item
        }
    }
    return _data
}

/**
 * 返回一个新对象，对象中会提取 `keys` 数组
 * 例如：提取 `name`
 * @example filterKeys(data, ['name'])
 */
export function filterKeys<T, K extends keyof T>(
    target: T,
    keys: K[]
) {
    const _data: any = {}

    for (const k in target) {
        if (!Object.hasOwnProperty.call(target, k)) continue

        if (keys.includes(k as unknown as K)) {
            const item = target[k]
            _data[k] = item
        }
    }
    return _data as Pick<T, Extract<keyof T, K>>
}

/**
 * 返回一个新对象，对象中会排除 `keys` 数组
 * 例如：排除 `name`
 * @example excludeKeys(data, ['name'])
 */
export function excludeKeys<T, K extends keyof T>(
    target: T,
    keys: K[]
) {
    const _data: any = {}

    for (const k in target) {
        if (!Object.hasOwnProperty.call(target, k)) continue

        if (!keys.includes(k as unknown as K)) {
            const item = target[k]
            _data[k] = item
        }
    }
    return _data as Omit<T, Extract<keyof T, K>>
}



// 递归树拍平简易写法
// export function dataToTree(data: TreeData[]) {
//     return data.filter(p => {
//         const children = data.filter(c => c.pid === p.id)
//         children.length && (p.children = children)
//         return p.pid === 0
//     })
// }
// function toTree(data: TreeData[], res = [], pid = 0) {
//     for (const item of data) {
//         if (item.pid === pid) {
//             const newItem = { ...item, children: [] }
//             res.push(newItem)
//             toTree(data, newItem.children, item.id)
//         }
//     }
//     return res
// }
// // 简化版
// function toTree(arr: TreeData[], pid = 0) {
//     return arr.filter(p => p.pid === pid).map(
//         item => ({
//             ...item,
//             children: toTree(arr, item.id)
//         })
//     )
// }


// export function deepClone<T>(source: T) {
//     const t = getType(source)
//     if (t !== 'object' && t !== 'array') {
//         return source
//     }

//     let target
//     if (t === 'object') {
//         target = {}
//         for (const key in source) {
//             source.hasOwnProperty(key)
//                 && (target[key] = deepClone(source[key]))
//         }
//     }
//     else {
//         target = []
//         for (let i = 0; i < source.length; i++) {
//             target[i] = deepClone(source[i])
//         }
//     }
//     return target
// }