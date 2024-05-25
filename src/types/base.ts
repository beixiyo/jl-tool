export type TransferType = 'base64' | 'blob'

export type BaseType = string | number
export type BaseKey = keyof any

export type TimeType = Date | number | string

export type Pixel = [R: number, G: number, B: number, A: number]

export type TreeItem = {
    pid: BaseType
    id: BaseType
}
export type TreeData<T extends TreeItem> =
    T & {
        children?: TreeData<T>[]
    }
