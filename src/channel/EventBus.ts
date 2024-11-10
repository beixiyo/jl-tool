import type { BaseKey } from '../types'


/** 
 * 消息订阅与派发，订阅和派发指定消息
 */
export class EventBus<T extends BaseKey = BaseKey> {
  private readonly eventMap = new Map<BaseKey, Set<{
    once?: boolean
    fn: Function
  }>>()

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
    if (!fnSet) {
      return
    }

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
    if (!eventName) {
      this.eventMap.clear()
      return
    }

    const fnSet = this.eventMap.get(eventName)
    /** fn 为空取关该事件的所有函数 */
    if (fnSet && !func) {
      fnSet.clear()
      return
    }

    fnSet?.forEach((item) => {
      if (item.fn === func) {
        fnSet.delete(item)
      }
    })
  }

  private subscribe(eventName: T, fn: Function, once = false) {
    const fnSet = this.eventMap.get(eventName)
    if (!fnSet) {
      this.eventMap.set(eventName, new Set())
    }

    this.eventMap
      .get(eventName)!
      .add(EventBus.genItem(fn, once))
  }

  private static genItem(fn: Function, once = false) {
    return { fn, once }
  }
}
