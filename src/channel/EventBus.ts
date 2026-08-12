import type { BaseKey } from '../types'

/**
 * 类型安全的消息订阅与派发，订阅和派发指定消息，支持传统模式和严格模式
 * @example
 * ```ts
 * // 对象严格约束
 * const bus = new EventBus<{
 *   onScroll: number
 * }>()
 *
 * // 有类型提示
 * bus.on('onScroll', (data) => {
 *   console.log(data)
 * })
 *
 * // 字符串约束
 * const bus2 = new EventBus<'TypeA' | 'TypeB'>()
 *
 * bus2.on('TypeA', (data) => {
 *   console.log(data)
 * })
 *
 * bus2.emit('TypeA', 1)
 *
 * // 枚举约束
 * enum En {
 *   A,
 *   B
 * }
 *
 * const bus3 = new EventBus<En>()
 * bus3.emit(En.A, 1)
 */
export class EventBus<T extends BaseKey | EventMap = BaseKey> {
  private readonly eventMap = new Map<BaseKey, Set<{
    once?: boolean
    fn: Function
  }>>()

  private readonly beforeTriggerMap = new Map<BaseKey, any[]>()

  opts: Required<EventBusOpts>

  constructor(opts: EventBusOpts = {}) {
    this.opts = mergeOpts(opts)
  }

  /**
   * 订阅并返回取消订阅的函数
   * @param eventName 事件名
   * @param fn 接收函数
   * @returns 取消订阅的函数
   */
  on<K extends EventType<T>>(eventName: K, fn: (param: EventParams<T, K>) => void) {
    return this.subscribe(eventName, fn, false)
  }

  /**
   * 订阅一次
   * @param eventName 事件名
   * @param fn 接收函数
   */
  once<K extends EventType<T>>(eventName: K, fn: (param: EventParams<T, K>) => void) {
    return this.subscribe(eventName, fn, true)
  }

  /**
   * 发送指定事件，通知所有订阅者
   * @param eventName 事件名
   * @param param 参数
   */
  emit<K extends EventType<T>>(eventName: K, param: EventParams<T, K>) {
    const fnSet = this.eventMap.get(eventName as BaseKey)

    /**
     * 没有事件接受，先存起来
     */
    if (!fnSet && this.opts.triggerBefore) {
      const params = this.beforeTriggerMap.get(eventName as BaseKey)
      if (params) {
        params.push(param)
      }
      else {
        this.beforeTriggerMap.set(eventName as BaseKey, [param])
      }
      return
    }

    if (!fnSet)
      return

    Array.from(fnSet).forEach((item) => {
      const { fn, once } = item
      if (once) {
        fnSet.delete(item)
        if (fnSet.size === 0) {
          this.eventMap.delete(eventName as BaseKey)
        }
      }
      fn(param)
    })

    if (fnSet.size === 0) {
      this.eventMap.delete(eventName as BaseKey)
    }
  }

  /**
   * 取消订阅
   * @param eventName 不传代表重置所有
   * @param func 要取关的函数，为空取关该事件的所有函数
   */
  off<K extends EventType<T>>(eventName?: K, func?: (param: EventParams<T, K>) => void) {
    /** 不传重置所有 */
    if (eventName === undefined) {
      this.eventMap.clear()
      this.beforeTriggerMap.clear()
      return
    }

    const fnSet = this.eventMap.get(eventName as BaseKey)
    /**
     * fn 为空取关该事件的所有函数
     */
    if (fnSet && !func) {
      this.eventMap.delete(eventName as BaseKey)
      this.beforeTriggerMap.delete(eventName as BaseKey)
      return
    }

    fnSet?.forEach((item) => {
      if (item.fn === func) {
        fnSet.delete(item)
      }
    })

    if (fnSet?.size === 0) {
      this.eventMap.delete(eventName as BaseKey)
    }
    this.beforeTriggerMap.delete(eventName as BaseKey)
  }

  private subscribe<K extends EventType<T>>(eventName: K, fn: (param: EventParams<T, K>) => void, once = false) {
    const eventKey = eventName as BaseKey
    const fnSet = this.eventMap.get(eventKey) ?? new Set()
    const item = EventBus.genItem(fn, once)
    fnSet.add(item)
    this.eventMap.set(eventKey, fnSet)

    /**
     * 如果有之前遗漏事件，则统一派发事件
     */
    const params = this.beforeTriggerMap.get(eventKey)
    if (params) {
      this.beforeTriggerMap.delete(eventKey)

      if (once) {
        fnSet.delete(item)
        if (fnSet.size === 0) {
          this.eventMap.delete(eventKey)
        }
        fn(params[0])
      }
      else {
        params.forEach(arg => fn(arg))
      }
    }

    return () => {
      fnSet.delete(item)
      if (fnSet.size === 0) {
        this.eventMap.delete(eventKey)
      }
    }
  }

  private static genItem(fn: Function, once = false) {
    return { fn, once }
  }
}

function mergeOpts(opts: EventBusOpts = {}) {
  const defaultOpts: Required<EventBusOpts> = { triggerBefore: false }
  return Object.assign(defaultOpts, opts)
}

export type EventBusOpts = {
  /**
   * 是否触发遗漏的事件
   * 当 emit 没有被订阅时，后续订阅者会收到
   * @default false
   */
  triggerBefore?: boolean
}

/** 定义事件映射类型，用于严格模式 */
type EventMap = Record<string, any>

/** 条件类型：如果T是Record类型，则使用严格模式；否则使用传统模式 */
type EventType<T> = T extends EventMap ? keyof T : T extends BaseKey ? T : never

/** 条件类型：根据事件名获取参数类型 */
type EventParams<T, K extends keyof any> = T extends EventMap
  ? K extends keyof T
    ? T[K]
    : any
  : any
