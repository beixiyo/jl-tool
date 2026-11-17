/** 对外类型：schema 声明、store / index 操作句柄与事务上下文 */

/** 主键或索引的取值路径；数组表示复合键 */
export type KeyPath = string | string[]

/**
 * 数据库的类型描述，与运行时 `stores` 声明一一对应
 *
 * @example
 * interface AppDB {
 *   tasks: { value: Task, key: string, indexes: 'ownerId' | 'ownerTask' }
 *   settings: { value: Settings }
 * }
 */
export type DatabaseSchema<S = Record<string, StoreTypes>> = { [K in keyof S]: StoreTypes }

/** 单个 store 的值、主键与索引名类型 */
export type StoreTypes = {
  value: unknown
  /** @default IDBValidKey */
  key?: IDBValidKey
  /** 索引名联合类型；没有索引时省略 */
  indexes?: string
}

/** 未提供类型描述时的退化形态：任意 store 名、未知值 */
export type UntypedSchema = Record<string, { value: unknown; key: IDBValidKey; indexes: string }>

/**
 * 索引定义
 *
 * - 字符串或数组：只声明取值路径
 * - 对象：额外声明 `unique` / `multiEntry`
 */
export type IndexDefinition =
  | KeyPath
  | {
    keyPath: KeyPath
    /** 同一索引值只允许出现一次，写入重复值时事务失败。@default false */
    unique?: boolean
    /** 取值为数组时为每个元素各建一条索引。@default false */
    multiEntry?: boolean
  }

/** 单个 store 的运行时声明 */
export type StoreOptions<I extends string = string> =
  & {
    /**
     * 主键在值里的路径；省略时主键独立于值存放（键值模式），写入需显式传 key
     * @default null
     */
    keyPath?: KeyPath | null
    /** @default false */
    autoIncrement?: boolean
  }
  & ([I] extends [never] ? { indexes?: Record<string, never> }
    : string extends I ? { indexes?: Record<string, IndexDefinition> }
    : { indexes: Record<I, IndexDefinition> })

/** 按类型描述推导出的 `stores` 声明 */
export type StoresOptions<S extends DatabaseSchema<S>> = {
  [K in keyof S & string]: StoreOptions<IndexName<S[K]>>
}

/** {@link defineDatabase} 的参数 */
export type DatabaseOptions<S extends DatabaseSchema<S>> = {
  name: string
  stores: StoresOptions<S>
  /**
   * 单轮打开期间，因并发升级冲突重新检查 schema 的最大尝试次数
   * @default 5
   */
  maxOpenAttempts?: number
  /**
   * 每轮打开连接前同步调用，抛错即中止本轮打开；下次操作会重新尝试
   * 适合注入调用方自己的准入校验，库本身不关心其语义
   * @default undefined
   */
  beforeOpen?: (context: { name: string }) => void
  /**
   * 读出的每个值先经过此函数再返回，用于兼容旧数据格式；写入不经过
   * @default undefined
   */
  decode?: (value: unknown, context: { store: string }) => unknown
}

/** 范围查询条件：单个键或键范围 */
export type Query = IDBValidKey | IDBKeyRange

/** 游标遍历选项 */
export type IterateOptions = {
  /** @default undefined 全部 */
  query?: Query | null
  /** @default 'next' */
  direction?: IDBCursorDirection
}

/**
 * 遍历回调；返回 `false` 提前结束
 *
 * 在游标事件中同步执行，不能等待事务外的异步
 */
export type IterateCallback<V, K> = (value: V, key: K, primaryKey: IDBValidKey) => boolean | void

/** 索引上的只读查询与按范围删除 */
export type IndexApi<V> = {
  /** 第一条匹配记录 */
  get: (query: Query) => Promise<V | undefined>
  getAll: (query?: Query | null, count?: number) => Promise<V[]>
  /** 匹配记录的主键 */
  getAllKeys: (query?: Query | null, count?: number) => Promise<IDBValidKey[]>
  count: (query?: Query | null) => Promise<number>
  iterate: (callback: IterateCallback<V, IDBValidKey>, options?: IterateOptions) => Promise<void>
  /**
   * 删除索引命中的全部记录（需在 readwrite 中执行）
   * @returns 删除条数
   */
  deleteAll: (query: Query) => Promise<number>
}

/** store 上的键值与记录操作 */
export type StoreApi<V, K extends IDBValidKey, I extends string> = {
  /** 按主键读取，不存在为 `undefined` */
  get: (key: K) => Promise<V | undefined>
  has: (key: K) => Promise<boolean>
  /** 键值模式写入：主键独立于值（store 未声明 keyPath） */
  set: (key: K, value: V) => Promise<void>
  /** 记录模式写入：主键取自值的 keyPath 或自增，存在则覆盖 */
  put: (value: V) => Promise<K>
  /** 记录模式新增：主键已存在时失败 */
  add: (value: V) => Promise<K>
  /** 删除单个主键或主键范围 */
  delete: (query: Query) => Promise<void>
  clear: () => Promise<void>
  getAll: (query?: Query | null, count?: number) => Promise<V[]>
  getAllKeys: (query?: Query | null, count?: number) => Promise<K[]>
  count: (query?: Query | null) => Promise<number>
  iterate: (callback: IterateCallback<V, K>, options?: IterateOptions) => Promise<void>
  index: (name: I) => IndexApi<V>
}

/** 事务内的 store：与 {@link StoreApi} 相同，另可取得原生对象 */
export type TransactionStoreApi<V, K extends IDBValidKey, I extends string> = StoreApi<V, K, I> & {
  /** 原生 object store，用于本库未覆盖的操作 */
  raw: IDBObjectStore
}

/** 多 store 事务的上下文 */
export type TransactionContext<S extends DatabaseSchema<S>, N extends keyof S & string> = {
  store: <T extends N>(name: T) => TransactionStoreApi<StoreValue<S[T]>, StoreKey<S[T]>, IndexName<S[T]>>
  /** 原生事务，用于本库未覆盖的操作 */
  raw: IDBTransaction
}

/** {@link defineDatabase} 的返回值 */
export type Database<S extends DatabaseSchema<S>> = {
  readonly name: string
  /** 单 store 句柄；每次调用各自开一个事务 */
  store: <N extends keyof S & string>(name: N) => StoreApi<StoreValue<S[N]>, StoreKey<S[N]>, IndexName<S[N]>>
  /**
   * 在一个事务里跨 store 读写，回调返回且原生 complete 后才成功；任一步失败整体回滚
   *
   * 回调只能等待本事务内的请求，网络、哈希等异步须在事务开始前完成
   */
  transaction: <N extends keyof S & string, T>(
    storeNames: N | readonly N[],
    mode: IDBTransactionMode,
    run: (context: TransactionContext<S, N>) => T | Promise<T>,
  ) => Promise<T>
  /** 立即打开并完成 schema 升级；通常无需调用，首个操作会自动打开 */
  open: () => Promise<IDBDatabase>
  /** 幂等关闭当前连接；后续操作会重新打开 */
  close: () => void
}

export type StoreValue<T extends StoreTypes> = T['value']
export type StoreKey<T extends StoreTypes> = T extends { key: infer K extends IDBValidKey } ? K : IDBValidKey
/** 索引名；类型描述未写 `indexes` 时为 never，未提供类型描述（推断为宽泛的 StoreTypes）时为 string */
export type IndexName<T extends StoreTypes> = 0 extends (1 & T) ? string
  : T extends { indexes?: infer I } ? I extends string ? I
    : never
  : never
