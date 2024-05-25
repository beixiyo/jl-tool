/**
 * 观察者模式，批量通知观察者
 */
export class Observer {
    private observers: IObserver[] = []

    /** 添加观察者 */
    addObserver(observer: IObserver) {
        this.observers.push(observer)
    }

    /** 移除观察者 */
    removeObserver(observer: IObserver) {
        const index = this.observers.indexOf(observer)
        if (index !== -1) {
            this.observers.splice(index, 1)
        }
    }

    /** 通知所有观察者 */
    notify(data: any) {
        this.observers.forEach(observer => observer.update(data))
    }
}


export interface IObserver {
    update(...data: any[]): void
}
