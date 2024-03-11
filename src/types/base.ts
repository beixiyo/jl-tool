export type TransferType = 'base64' | 'blob'

export type BaseType = string | number
export type TimeType = Date | number | string
export type KeyCode = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export type Pixel = [number, number, number, number]

export type TreeData = {
    pid: number
    id: number
    children: TreeData[]
    [key: string]: any
}