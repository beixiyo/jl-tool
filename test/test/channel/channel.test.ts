import { describe, expect, test, vi } from 'vitest'
import { EventBus, Observer, type IObserver } from '@/channel'


describe('消息发布与订阅测试', () => {
  const eb = new EventBus()

  const
    testArgsFn = vi.fn(() => (...args: any[]) => args),
    onceFn = vi.fn(() => 'once'),

    testFn2 = vi.fn(() => 'test2'),
    testFn3 = vi.fn(() => 'test3'),
    testFn4 = vi.fn(() => 'test4')


  eb.on('testArgsFn', testArgsFn)

  eb.on('test2', testFn2)
  eb.on('test2', testFn3)
  eb.on('test2', testFn4)
  eb.once('once', onceFn)


  eb.emit('testArgsFn', 1, 2, 3)
  test('参数接收测试', () => {
    expect(testArgsFn.mock.calls).toEqual([[1, 2, 3]])
  })


  eb.emit('once')
  eb.emit('once')
  test('仅仅触发一次', () => {
    expect(onceFn).toHaveBeenCalledTimes(1)
  })


  /** 取关 testFn2 */
  eb.off('test2', testFn2)


  eb.emit('test2')
  eb.emit('test2')
  test('触发两次', () => {
    expect(testFn2).not.toBeCalled()
    expect(testFn3).toHaveBeenCalledTimes(2)
    expect(testFn4).toHaveBeenCalledTimes(2)
  })
})


describe('接受遗漏事件测试', () => {
  const eb = new EventBus({ triggerBefore: true })

  const testFn = vi.fn(() => 'testFn')

  eb.emit('test', testFn)
  eb.on('test', testFn)

  test('接受遗漏事件', () => {
    expect(testFn).toHaveBeenCalledTimes(1)
  })


  const argsFn = vi.fn(() => (...args: any[]) => args)
  eb.emit('testArgsFn', 1, 2, 3)
  eb.on('testArgsFn', argsFn)

  test('参数接收测试', () => {
    expect(argsFn.mock.calls).toEqual([[1, 2, 3]])
  })
})



describe('不接受遗漏事件测试', () => {
  const eb = new EventBus({ triggerBefore: false })

  const testFn = vi.fn(() => 'testFn')

  eb.emit('test', testFn)
  eb.on('test', testFn)

  test('接受遗漏事件', () => {
    expect(testFn).toHaveBeenCalledTimes(0)
  })


  const argsFn = vi.fn(() => (...args: any[]) => args)
  eb.emit('testArgsFn', 1, 2, 3)
  eb.on('testArgsFn', argsFn)

  test('参数接收测试', () => {
    expect(argsFn).toHaveBeenCalledTimes(0)
  })
})


describe('观察者模式', () => {
  const data: number[] = [],
    ob = new Observer()

  const o1: IObserver = {
    update: () => data.push(1)
  }
  const o2: IObserver = {
    update: () => data.push(2)
  }

  ob.addObserver(o1)
  ob.addObserver(o2)
  ob.removeObserver(o1)

  ob.notify()
  ob.notify()

  test('观测数据', () => {
    expect(data).toEqual([2, 2])
  })
})