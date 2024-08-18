/** 输出类型 */
export type TransferType = 'base64' | 'blob'

export type BaseType = string | number
export type BaseKey = keyof any

/** 可用的日期类型 */
export type TimeType = Date | number | string

export type Pixel = [R: number, G: number, B: number, A: number]

/** 基础树形结构 */
export type TreeItem = {
    pid: BaseType
    id: BaseType
}
export type TreeData<T extends TreeItem> =
    T & {
        children?: TreeData<T>[]
    }
