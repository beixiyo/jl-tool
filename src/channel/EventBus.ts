import type { BaseKey } from '../types'


/** 
 * 消息订阅与派发，订阅和派发指定消息
 */
export class EventBus<T extends BaseKey = BaseKey> {

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
   * 订阅
   * @param eventName 事件名
   * @param fn 接收函数
   */
  on(eventName: T, fn: Function) {
    this.subscribe(eventName, fn, false)
  }

  /**
   * 订阅一次
   * @param eventName 事件名
   * @param fn 接收函数
   */
  once(eventName: T, fn: Function) {
    this.subscribe(eventName, fn, true)
  }

  /**
   * 发送指定事件，通知所有订阅者
   * @param eventName 事件名
   * @param args 不定参数
   */
  emit(eventName: T, ...args: any[]) {
    const fnSet = this.eventMap.get(eventName)

    /**
     * 没有事件接受，先存起来
     */
    if (!fnSet && this.opts.triggerBefore) {
      const params = this.beforeTriggerMap.get(eventName)
      if (params) {
        params.push(args)
      }
      else {
        this.beforeTriggerMap.set(eventName, [args])
      }
      return
    }

    if (!fnSet) return

    fnSet.forEach(({ fn, once }) => {
      fn(...args)
      once && this.off(eventName, fn)
    })
  }

  /**
   * 取关
   * @param eventName 不传代表重置所有
   * @param func 要取关的函数，为空取关该事件的所有函数
   */
  off(eventName?: T, func?: Function) {
    // 不传重置所有
    if (!eventName) {
      this.eventMap.clear()
      this.beforeTriggerMap.clear()
      return
    }

    const fnSet = this.eventMap.get(eventName)
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

    this.beforeTriggerMap.delete(eventName)
  }

  private subscribe(eventName: T, fn: Function, once = false) {
    const fnSet = this.eventMap.get(eventName)
    if (!fnSet) {
      this.eventMap.set(eventName, new Set())
    }

    this.eventMap
      .get(eventName)!
      .add(EventBus.genItem(fn, once))

    /** 
     * 如果有之前遗漏事件，则统一派发事件
     */
    const args = this.beforeTriggerMap.get(eventName)
    if (args) {
      args.forEach(arg => fn(...(arg || [])))
      this.beforeTriggerMap.delete(eventName)
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