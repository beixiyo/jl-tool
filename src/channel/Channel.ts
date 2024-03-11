export class Channel {
    listeners = {}

    /**
     * 添加监听
     * @param actionType 类型 
     * @param func 函数
     * @returns 把传递的函数，从这个类型的监听中删除的 **函数**
     */
    add(actionType: ActionType, func: () => void) {
        this.listeners[actionType]
            ? this.listeners[actionType].add(func)
            : this.listeners[actionType] = new Set([func])

        return () => {
            this.listeners[actionType].delete(func)
        }
    }

    /**
     * 删除某个类型
     * @param actionType 类型
     */
    del(actionType: ActionType) {
        delete this.listeners[actionType]
    }

    /**
     * 触发某个类型
     * @param actionType 类型 
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
