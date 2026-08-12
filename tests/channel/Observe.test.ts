import type { IObserver } from '@/channel/Observe'
import { describe, expect, it, vi } from 'vitest'
import { Observer } from '@/channel/Observe'

/** 创建一个模拟观察者类 */
class MockObserver<T> implements IObserver<T> {
  update = vi.fn()
}

describe('observer', () => {
  it('应该能够添加观察者', () => {
    const observer = new Observer<string>()
    const mockObserver = new MockObserver<string>()

    observer.addObserver(mockObserver)

    /** 通过调用 notify 来检查观察者是否被正确添加 */
    observer.notify('test')
    expect(mockObserver.update).toHaveBeenCalledWith('test')
  })

  it('应该能够移除观察者', () => {
    const observer = new Observer<string>()
    const mockObserver = new MockObserver<string>()

    observer.addObserver(mockObserver)
    observer.removeObserver(mockObserver)

    /** 通知后，被移除的观察者不应该被调用 */
    observer.notify('test')
    expect(mockObserver.update).not.toHaveBeenCalled()
  })

  it('应该能够通知所有观察者', () => {
    const observer = new Observer<number>()
    const mockObserver1 = new MockObserver<number>()
    const mockObserver2 = new MockObserver<number>()

    observer.addObserver(mockObserver1)
    observer.addObserver(mockObserver2)

    observer.notify(42)

    expect(mockObserver1.update).toHaveBeenCalledWith(42)
    expect(mockObserver2.update).toHaveBeenCalledWith(42)
  })

  it('应该只通知有效的观察者（具有 update 方法）', () => {
    const observer = new Observer<string>()
    const mockObserver = new MockObserver<string>()
    const invalidObserver = {} as IObserver<string> // 不具有 update 方法的对象

    observer.addObserver(mockObserver)
    observer.addObserver(invalidObserver)

    observer.notify('test')

    /** 只有有效的观察者应该被调用 */
    expect(mockObserver.update).toHaveBeenCalledWith('test')
  })
})
