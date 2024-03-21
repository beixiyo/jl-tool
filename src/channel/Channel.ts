import { BaseKey } from '@/types'

/**
 * 事件频道，用于批量触发事件
 */
export class Channel {
    private readonly listeners = {}

    /**
     * 添加监听
     * @param actionType 类型 
     * @param func 函数
     * @returns 删除监听的 **函数**
     */
    add(actionType: BaseKey, func: Function) {
        this.listeners[actionType]
            ? this.listeners[actionType].add(func)
            : this.listeners[actionType] = new Set([func])

        return () => {
            this.listeners[actionType].delete(func)
        }
    }

    /**
     * 删除某个类型 或者 某个类型的具体函数
     * @param actionType 类型
     * @param func 具体函数，不传则删除所有
     */
    del(actionType: BaseKey, func?: Function) {
        if (!func) {
            delete this.listeners[actionType]
            return
        }

        const set = this.listeners[actionType]
        if (!set) return
        set.delete(func)
    }

    /**
     * 触发某个类型
     * @param actionType 类型
     * @param args 不定参数
     */
    trigger(actionType: BaseKey, ...args: any[]) {
        const tasks = this.listeners[actionType]
        if (!tasks) {
            return
        }

        for (const fn of tasks) {
            fn(...args)
        }
    }
}

