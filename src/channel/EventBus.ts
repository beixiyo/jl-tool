/** 消息订阅与派发 */
export class EventBus {
    eventMap = new Map<string, Set<{
        once?: boolean
        fn: Function
    }>>()

    /** 订阅 */
    on(eventName: string, fn: Function) {
        this.subscribe(eventName, fn, false)
    }

    /** 订阅一次 */
    once(eventName: string, fn: Function) {
        this.subscribe(eventName, fn, true)
    }

    /** 发送 */
    emit(eventName: string, ...args: any[]) {
        for (const [key, fnSet] of this.eventMap) {
            if (eventName === key) {
                fnSet.forEach(({ fn, once }) => {
                    fn(...args)
                    once && this.off(eventName, fn)
                })
            }
        }
    }

    /**
     * 取关
     * @param eventName 空字符或者不传代表重置所有
     * @param func 要取关的函数 为空取关该事件的所有函数
     */
    off(eventName?: string, func?: Function) {
        if (!eventName) {
            this.eventMap = new Map()
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

    private subscribe(eventName: string, fn: Function, once = false) {
        const fnSet = this.eventMap.get(eventName)
        if (!fnSet) {
            this.eventMap.set(eventName, new Set())
        }

        this.eventMap
            .get(eventName)
            .add(EventBus.genItem(fn, once))
    }

    private static genItem(fn: Function, once = false) {
        return { fn, once }
    }
}