/**
 * 事件频道，用于管理事件
 * 可以批量触发，也可以单独触发
 */
export class Channel {
    private readonly listeners = {}

    /**
     * 添加监听
     * @param actionType 类型 
     * @param func 函数
     * @returns 删除监听的 **函数**
     */
    add(actionType: ActionType, func: Function) {
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
    del(actionType: ActionType, func?: Function) {
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
    trigger(actionType: ActionType, ...args: any[]) {
        const tasks = this.listeners[actionType]
        if (!tasks) {
            return
        }

        for (const fn of tasks) {
            fn(...args)
        }
    }
}

export type ActionType = string | symbol
