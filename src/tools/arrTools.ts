import type { BaseKey, TreeData, TreeItem } from '@/types/base'
import { deepClone } from './tools'
import { isPureNum } from '@/shared/is'

/**
 * 计算分页的当前数据
 * @param arr 全部数据的数组
 * @param curPage 当前页
 * @param pageSize 一页大小，默认 20
 */
export function getPageData<T>(arr: T[], curPage: number, pageSize = 20) {
    return arr.slice((curPage - 1) * pageSize, curPage * pageSize)
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

/**
 * 给定一个数组，根据 key 进行分组
 * 
 * 分组内容默认放入数组中，你也可以指定为 `'+' | '-' | '*' | '/' | '**'` 进行相应的操作  
 * 
 * 你也可以把整个对象进行分组（设置 `operateKey` 为 `null`），他会把整个对象放入数组。而不是进行 加减乘除 等操作
 * @param data 要分组的数组
 * @param key 要进行分组的 **键**
 * @param operateKey 要操作的 **键**，填 `null` 则对整个对象进行分组，并且会把 `action` 设置为 `arr`
 * @param action 操作行为，默认放入数组，你也可以进行相应的操作，`'+'` 为加法，`'-'` 为减法，`'*'` 为乘法，`'/'` 为除法，`'**'` 为乘方
 * @param enableParseFloat 默认 false，当你指定 action 为数值操作时，是否使用 parseFloat，这会把 '10px' 也当成数字
 * @param enableDeepClone 是否深拷贝，默认 false
 * @example
 * const input = [{ type: 'chinese', score: 10 }, { type: 'chinese', score: 100 }]
 * groupBy(input, 'type', 'score') => [{ type: 'chinese', score: [10, 100] }]
 * groupBy(input, 'type', null) => [ { type: 'chinese', children: [{ ... }] }, ... ]
 */
export function groupBy<T extends Record<BaseKey, any>>(
    data: T[],
    key: keyof T,
    operateKey: null | (keyof T),
    action: 'arr' | '+' | '-' | '*' | '/' | '**' = 'arr',
    enableParseFloat = false,
    enableDeepClone = false
) {
    let i = 0
    const res: any[] = [],
        /**
         * 存储键对应的索引
         * @example 
         * {
         *     'chinese': 0,
         *     'math': 1
         * }
         */
        keyMap: any = {}

    if (operateKey === null) {
        action = 'arr'
    }

    data.forEach(item => {
        const mapKey = item[key]
        /** 尚未存入数组的情况 */
        if (keyMap[mapKey] === undefined) {
            handleKeyMap(mapKey, item)
        }
        else {
            hanledRepeatKey(mapKey, item)
        }
    })
    return res

    function handleKeyMap(mapKey: keyof T, item: any) {
        keyMap[mapKey] = i
        const _item = enableDeepClone
            ? deepClone(item)
            : item

        if (operateKey === null) {
            res[i] = {
                type: mapKey,
                children: [_item]
            }
        }
        else if (action === 'arr') {
            res[i] = {
                ..._item,
                [operateKey]: [_item[operateKey]]
            }
        }
        else {
            res[i] = {
                ..._item,
                [operateKey]: _item[operateKey]
            }
        }
        i++
    }

    function hanledRepeatKey(mapKey: keyof T, item: any) {
        const index = keyMap[mapKey]
        if (action !== 'arr' && !isPureNum(item[operateKey], enableParseFloat)) {
            throw new TypeError('指定的键值无法当作数值计算（Is not like Number）')
        }

        let num: number
        let curData: any

        if (operateKey === null) {
            curData = enableDeepClone
                ? deepClone(item)
                : item
        }
        else {
            curData = item[operateKey]
        }

        if (operateKey === null) {
            res[index].children.push(curData)
            return
        }

        if (action !== 'arr') {
            if (enableParseFloat) {
                num = parseFloat(curData)
            }
            else {
                num = Number(curData)
            }
        }

        if (action !== 'arr') {
            toParseFloat(res, index)
        }
        switch (action) {
            case 'arr':
                res[index][operateKey].push(curData)
                break
            case '+':
                (res[index][operateKey] as number) += num
                break
            case '-':
                (res[index][operateKey] as number) -= num
                break
            case '*':
                (res[index][operateKey] as number) *= num
                break
            case '/':
                (res[index][operateKey] as number) /= num
                break
            case '**':
                (res[index][operateKey] as number) **= num
                break

            default:
                const nv: never = action
                break
        }
    }

    /** 根据配置决定是否解析 */
    function toParseFloat(arr: any[], index: number) {
        if (!enableParseFloat) return
        arr[index][operateKey] = parseFloat(arr[index][operateKey])
    }
}

/**
 * 扁平数组转递归树
 * @example
```ts
const arr = [
    { id: 1, name: '部门1', pid: 0 },
    { id: 2, name: '部门2', pid: 1 },
    { id: 3, name: '部门3', pid: 1 },
    { id: 4, name: '部门4', pid: 3 },
    { id: 5, name: '部门5', pid: 4 },
    { id: 6, name: '部门6', pid: 1 },
]
const treeData = arrToTree(arr)
```
 */
export function arrToTree<T extends TreeItem>(arr: T[]): TreeData<T>[] {
    if (arr.length < 2) return arr
    const res = [],
        /** id 为键，存放一个个深度递归的数组 */
        map = {}

    arr.forEach(item => {
        const { pid, id } = item
        if (!map[id]) {
            map[id] = { children: [] }
        }
        /** 把每个互相引用关联的节点，平铺开来。下面就能往对应的节点赋值 */
        map[id] = {
            ...item,
            children: map[id].children
        }

        const treeItem = map[id]
        if (pid === 0) {
            /** 这里存的是整个根节点的引用 */
            res.push(treeItem)
        }
        /** 子节点 */
        else {
            /** 没有父节点，则新建 */
            if (!map[pid]) {
                map[pid] = { children: [] }
            }
            /** 往对应父节点的引用值添加子节点 */
            map[pid].children.push(treeItem)
        }
    })

    return res
}

/**
 * 树形结构搜索
 * @param keyword 搜索关键字
 * @param data 数据
 * @param opts 配置项，包含搜索字段和是否忽略大小写
 */
export function searchTreeData<T extends { children?: T[] }>(
    keyword: string,
    data: T[],
    opts: SearchOpts = {}
): T[] {
    const { key = 'name', ignoreCase = true } = opts

    const loop = (data: T[]) => {
        const result = <T[]>[]
        data.forEach(item => {
            let flag: boolean
            if (ignoreCase) {
                flag = item[key]?.toLowerCase()?.includes(keyword.toLowerCase())
            }
            else {
                flag = item[key]?.includes(keyword)
            }

            if (flag) {
                result.push({ ...item })
            }
            else if (item.children) {
                const filterData = loop(item.children)
                if (filterData.length) {
                    result.push({
                        ...item,
                        children: filterData
                    })
                }
            }
        })
        return result
    }

    return loop(data)
}

/**
 * 把数组分成 n 块，空数组直接返回，其他情况均返回二维数组
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

/** 
 * 二分查找，必须是正序的数组
 * @returns 索引，找不到返回 -1
 */
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


type SearchOpts = {
    /** 要搜索比对的键，@default name */
    key?: string
    /** 是否忽略大小写，@default true */
    ignoreCase?: boolean
}