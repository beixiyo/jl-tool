import type { HeapItem } from '@/dataStructure/Heap'
import { describe, expect, it } from 'vitest'
import { MaxHeap, MinHeap } from '@/dataStructure/Heap'

/**
 * 循环取值测试用不了，只能手动抛异常测试
 */
describe('最小堆测试', () => {
  const minNum = 3
  const mh = new MinHeap()

  mh.push(
    createTask(4),
    createTask(minNum),
    createTask(6),
    createTask(16),
    createTask(8),
    createTask(8),
    createTask(6),
    createTask(minNum),
  )

  let val: HeapItem
  let lastNum = minNum

  console.log('最小堆')
  while (val = mh.pop()!) {
    console.log({ 本次取值: val.sortIndex, 上次取值: lastNum })
    if (val.sortIndex < lastNum) {
      throw new Error('最小堆取值错误')
    }

    lastNum = val.sortIndex
  }

  it('pass', () => {
    expect(true).toBeTruthy()
  })
})

describe('最大堆测试', () => {
  const maxNum = 16
  const mh = new MaxHeap()

  mh.push(
    createTask(4),
    createTask(3),
    createTask(6),
    createTask(maxNum),
    createTask(8),
    createTask(8),
    createTask(6),
    createTask(3),
  )

  let val: HeapItem
  let lastNum = maxNum

  console.log('最大堆')
  while (val = mh.pop()!) {
    console.log({ 本次取值: val.sortIndex, 上次取值: lastNum })
    if (val.sortIndex > lastNum) {
      throw new Error('最大堆取值错误')
    }

    lastNum = val.sortIndex
  }

  it('pass', () => {
    expect(true).toBeTruthy()
  })
})

function createTask(i: number): HeapItem {
  return {
    sortIndex: i,
  }
}
