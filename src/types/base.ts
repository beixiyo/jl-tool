export type ImgMIME =
    | 'image/gif'
    | 'image/jpeg'
    | 'image/png'
    | 'image/bmp'
    | 'image/svg+xml'
    | 'image/webp'
    | 'image/x-icon'
    | 'image/tiff'
    | 'image/ief'
    | 'image/jpeg'

export type TransferType = 'base64' | 'blob'

export type BaseType = string | number
export type TimeType = Date | number | string
export type KeyCode = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export type TreeData = {
    pid: number
    id: number
    children: TreeData[]
    [key: string]: any
}