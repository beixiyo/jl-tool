import { isFn } from '@/shared'

/**
 * 观察者模式，批量通知观察者
 */
export class Observer<T> {
  private observers: Set<IObserver<T>> = new Set()

  /** 添加观察者 */
  addObserver(observer: IObserver<T>) {
    this.observers.add(observer)
  }

  /** 移除观察者 */
  removeObserver(observer: IObserver<T>) {
    this.observers.delete(observer)
  }

  /** 通知所有观察者 */
  notify(data: T) {
    this.observers.forEach((observer) => {
      if (isFn(observer.update)) {
        observer.update(data)
      }
    })
  }
}

export interface IObserver<T> {
  update: (data: T) => void
}
