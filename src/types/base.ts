/** 输出类型 */
export type TransferType = 'base64' | 'blob'

export type BaseType = string | number
export type BaseKey = keyof any

/** 可用的日期类型 */
export type TimeType = Date | number | string

export type Pixel = [R: number, G: number, B: number, A: number]

export type TreeData<T, K = BaseType> = (T & {
  children?: TreeData<T, K>[]
})[]

/**
 * arrToTree 函数的泛型约束
 * @template T 原始数据类型
 */
export type ArrToTreeOpts<T> = {
  /**
   * 唯一标识符字段
   * @default 'id'
   */
  idField?: keyof T
  /**
   * 父节点标识符字段
   * @default 'pid'
   */
  pidField?: keyof T
  /**
   * 根节点ID
   * @default 0
   */
  rootId?: BaseType
}
