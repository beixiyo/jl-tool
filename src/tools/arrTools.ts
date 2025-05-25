import type { ArrToTreeOpts, BaseKey, BaseType, TreeData } from '@/types/base'
import { isPureNum } from '@/shared/is'
import { deepClone } from './tools'

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
        throw new TypeError('数组中的值或处理过的值必须是数字')
      }

      return init + val
    },
    0,
  )
}

/**
 * - 给定一个数组，根据 key 进行分组
 * - 分组内容默认放入数组中，你也可以指定为 `'+' | '-' | '*' | '/' | '**'` 进行相应的操作
 * - 你也可以把整个对象进行分组（设置 `operateKey` 为 `null`），他会把整个对象放入数组。而不是进行 加减乘除 等操作
 *
 * @example
 * ```ts
 * const input = [{ type: 'chinese', score: 10 }, { type: 'chinese', score: 100 }]
 * groupBy(input, 'type', 'score') => [{ type: 'chinese', score: [10, 100] }]
 * groupBy(input, 'type', null) => [ { type: 'chinese', children: [{ ... }] }, ... ]
 * ```
 *
 * @param data 要分组的数组
 * @param key 要进行分组的 **键**
 * @param operateKey 要操作的 **键**，填 `null` 则对整个对象进行分组，并且会把 `action` 设置为 `arr`
 * @param action 操作行为，默认放入数组，你也可以进行相应的操作，`'+'` 为加法，`'-'` 为减法，`'*'` 为乘法，`'/'` 为除法，`'**'` 为乘方
 * @param enableParseFloat 默认 false，当你指定 action 为数值操作时，是否使用 parseFloat，这会把 '10px' 也当成数字
 * @param enableDeepClone 是否深拷贝，默认 false
 */
export function groupBy<T extends Record<BaseKey, any>>(
  data: T[],
  key: keyof T,
  operateKey: null | (keyof T),
  action: 'arr' | '+' | '-' | '*' | '/' | '**' = 'arr',
  enableParseFloat = false,
  enableDeepClone = false,
) {
  let i = 0
  const res: any[] = []
  /**
   * 存储键对应的索引
   * @example
   * {
   *     'chinese': 0,
   *     'math': 1
   * }
   */
  const keyMap: any = {}

  if (operateKey === null) {
    action = 'arr'
  }

  data.forEach((item) => {
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
        children: [_item],
      }
    }
    else if (action === 'arr') {
      res[i] = {
        ..._item,
        [operateKey]: [_item[operateKey]],
      }
    }
    else {
      res[i] = {
        ..._item,
        [operateKey]: _item[operateKey],
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
        num = Number.parseFloat(curData)
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
        // @ts-ignore
        (res[index][operateKey] as number) += num
        break
      case '-':
        // @ts-ignore
        (res[index][operateKey] as number) -= num
        break
      case '*':
        // @ts-ignore
        (res[index][operateKey] as number) *= num
        break
      case '/':
        // @ts-ignore
        (res[index][operateKey] as number) /= num
        break
      case '**':
        // @ts-ignore
        (res[index][operateKey] as number) **= num
        break

      default:
        const nv: never = action
        break
    }
  }

  /** 根据配置决定是否解析 */
  function toParseFloat(arr: any[], index: number) {
    if (!enableParseFloat)
      return
    arr[index][operateKey] = Number.parseFloat(arr[index][operateKey])
  }
}

/**
 * 扁平数组转递归树
 * @example
 * ```ts
 * const arr = [
 *     { id: 1, name: '部门1', pid: 0 },
 *     { id: 2, name: '部门2', pid: 1 },
 *     { id: 3, name: '部门3', pid: 1 },
 *     { id: 4, name: '部门4', pid: 3 },
 *     { id: 5, name: '部门5', pid: 4 },
 *     { id: 6, name: '部门6', pid: 1 },
 * ]
 * const treeData = arrToTree(arr)
 * ```
 */
export function arrToTree<T extends Record<string, any>>(
  arr: T[],
  options?: ArrToTreeOpts<T>,
): TreeData<T> {
  const {
    idField = 'id',
    pidField = 'pid',
    rootId = 0,
  } = options || {}

  if (arr.length < 2)
    return arr as TreeData<T>

  const res: TreeData<T> = []
  const map: Record<BaseType, TreeData<T>[number]> = {}

  for (const item of arr) {
    const id = item[idField]
    const pid = item[pidField]

    if (!map[id]) {
      map[id] = { ...item, children: [] }
    }
    else {
      map[id] = {
        ...item,
        children: map[id].children,
      }
    }

    const treeItem = map[id]

    if (pid === rootId) {
      /** 放入跟节点 */
      res.push(treeItem)
    }
    /** 子节点 */
    else {
      /** 没有父节点，则新建 */
      if (!map[pid]) {
        map[pid] = { children: [] } as any
      }

      /** 往对应父节点的引用值添加子节点 */
      map[pid].children!.push(treeItem as any)
    }
  }

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
  opts: SearchOpts = {},
): T[] {
  const { key = 'name', ignoreCase = true } = opts

  const loop = (data: T[]) => {
    const result = <T[]>[]

    for (const item of data) {
      let flag: boolean

      if (ignoreCase) {
        // @ts-ignore
        flag = item[key]?.toLowerCase()?.includes(keyword.toLowerCase())
      }
      else {
        // @ts-ignore
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
            children: filterData,
          })
        }
      }
    }

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
  if (size <= 1)
    return arr.map(item => [item])

  const _arr: any[] = []
  const chunkSize = Math.ceil(arr.length / size)
  for (let i = 0; i < chunkSize; i++) {
    _arr.push(arr.slice(i * size, (i + 1) * size))
  }

  return _arr
}

/**
 * 二分查找，必须是正序的数组
 * @param arr 数组
 * @param value 目标值
 * @param getValFn 获取目标值的函数，可以从对象中取值
 * @returns 索引，找不到返回 -1
 */
export function binarySearch<T>(
  arr: T[],
  value: number,
  getValFn: (item: T) => number = (item: T) => item as number,
) {
  let left = 0
  let right = arr.length - 1
  let candidate = -1

  while (left <= right) {
    const mid = (left + right) >>> 1
    if (getValFn(arr[mid]) === value) {
      candidate = mid
      right = mid - 1
    }
    else if ((getValFn(arr[mid]) as any) < value) {
      left = mid + 1
    }
    else {
      right = mid - 1
    }
  }

  return candidate
}

/**
 * 广度遍历
 */
export function bfsFind<T extends TreeNode>(
  arr: T[],
  condition: (value: T) => boolean,
): T | null {
  /** 当前层的节点 */
  let currentLevel: T[] = arr
  /** 下一层的节点 */
  let nextLevel: T[] = []

  /** 循环遍历每一层 */
  while (currentLevel.length > 0) {
    for (const item of currentLevel) {
      if (condition(item)) {
        return item
      }

      /** 将当前节点的子节点添加到下一层 */
      if (item.children && item.children.length > 0) {
        nextLevel.push(...item.children)
      }
    }

    /** 当前层遍历完毕，进入下一层 */
    currentLevel = nextLevel
    nextLevel = []
  }

  return null
}

/**
 * 深度遍历
 */
export function dfsFind<T extends TreeNode>(
  arr: T[],
  condition: (value: T) => boolean,
): T | null {
  for (const item of arr) {
    if (condition(item)) {
      return item
    }

    /** 如果当前节点有子节点，递归搜索子节点 */
    if (item.children && item.children.length > 0) {
      const result = dfsFind(item.children, condition)
      if (result) {
        return result
      }
    }
  }

  return null
}

/**
 * 生成一个指定大小的类型化数组，默认 `Float32Array`，并用指定的生成函数填充
 * @param size 数组的长度
 * @param genVal 一个生成数值的函数，用于填充数组
 * @param ArrayFn 填充数组的构造函数，默认 `Float32Array`
 * @returns 返回一个填充了指定生成函数数值的数组
 */
export function genTypedArr<T extends AllTypedArrConstructor = Float32ArrayConstructor>(
  size: number,
  genVal: (index: number) => number,
  ArrayFn: T = Float32Array as T,
): ArrReturnType<T> {
  const arr = new ArrayFn(size)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = genVal(i)
  }

  return arr as ArrReturnType<T>
}

/**
 * 生成一个指定大小的数组，并用指定的生成函数填充
 * @param size 数组的长度
 * @param genVal 一个生成数值的函数，用于填充数组
 */
export function genArr<V>(
  size: number,
  genVal: (index: number) => V,
): V[] {
  const arr = new Array(size)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = genVal(i)
  }

  return arr
}

/**
 * 比较两个数组是否相等，默认不在乎顺序。空数组返回 true
 * @param ignoreOrder 是否忽略顺序，默认 true
 */
export function arrIsEqual<T = string | number>(
  arr1: T[],
  arr2: T[],
  ignoreOrder = true,
): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }
  if (arr1.length === 0 && arr2.length === 0) {
    return true
  }

  if (ignoreOrder) {
    const sortedArray1 = [...arr1].sort()
    const sortedArray2 = [...arr2].sort()
    return sortedArray1.every((value, index) => value === sortedArray2[index])
  }

  return arr1.every((value, index) => value === arr2[index])
}

export type AllTypedArrConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor

type ArrReturnType<T extends AllTypedArrConstructor = Float32ArrayConstructor> =
  T extends Float32ArrayConstructor ? Float32Array
    : T extends Float64ArrayConstructor ? Float64Array
      : T extends Int8ArrayConstructor ? Int8Array
        : T extends Uint8ArrayConstructor ? Uint8Array
          : T extends Int16ArrayConstructor ? Int16Array
            : T extends Uint16ArrayConstructor ? Uint16Array
              : T extends Int32ArrayConstructor ? Int32Array
                : T extends Uint32ArrayConstructor ? Uint32Array
                  : never

export type SearchOpts = {
  /** 要搜索比对的键，@default name */
  key?: string
  /** 是否忽略大小写，@default true */
  ignoreCase?: boolean
}

export type TreeNode<T = any> = {
  children?: T[]
}
