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
    this.subscribe(eventName, fn, false)
    return () => {
      this.off(eventName, fn)
    }
  }

  /**
   * 订阅一次
   * @param eventName 事件名
   * @param fn 接收函数
   */
  once<K extends EventType<T>>(eventName: K, fn: (param: EventParams<T, K>) => void) {
    this.subscribe(eventName, fn, true)
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

    fnSet.forEach(({ fn, once }) => {
      fn(param)
      once && this.off(eventName, fn as any)
    })
  }

  /**
   * 取消订阅
   * @param eventName 不传代表重置所有
   * @param func 要取关的函数，为空取关该事件的所有函数
   */
  off<K extends EventType<T>>(eventName?: K, func?: (param: EventParams<T, K>) => void) {
    /** 不传重置所有 */
    if (!eventName) {
      this.eventMap.clear()
      this.beforeTriggerMap.clear()
      return
    }

    const fnSet = this.eventMap.get(eventName as BaseKey)
    /**
     * fn 为空取关该事件的所有函数
     */
    if (fnSet && !func) {
      fnSet.clear()
      return
    }

    fnSet?.forEach((item) => {
      if (item.fn === func) {
        fnSet.delete(item)
      }
    })

    this.beforeTriggerMap.delete(eventName as BaseKey)
  }

  private subscribe<K extends EventType<T>>(eventName: K, fn: (param: EventParams<T, K>) => void, once = false) {
    const fnSet = this.eventMap.get(eventName as BaseKey)
    if (!fnSet) {
      this.eventMap.set(eventName as BaseKey, new Set())
    }

    this.eventMap
      .get(eventName as BaseKey)!
      .add(EventBus.genItem(fn, once))

    /**
     * 如果有之前遗漏事件，则统一派发事件
     */
    const param = this.beforeTriggerMap.get(eventName as BaseKey)
    if (param) {
      param.forEach(arg => fn(arg))
      this.beforeTriggerMap.delete(eventName as BaseKey)
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
