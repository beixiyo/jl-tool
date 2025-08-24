import { describe, expect, it } from 'vitest'
import { MaxHeap, MinHeap } from '@/dataStructure/Heap'

describe('heap', () => {
  describe('minHeap', () => {
    it('应该正确创建最小堆', () => {
      const heap = new MinHeap<{ sortIndex: number }>()
      expect(heap.size).toBe(0)
      expect(heap.isEmpty()).toBe(true)
    })

    it('应该正确插入和弹出元素', () => {
      const heap = new MinHeap<{ sortIndex: number }>()

      heap.push({ sortIndex: 5 })
      heap.push({ sortIndex: 3 })
      heap.push({ sortIndex: 7 })
      heap.push({ sortIndex: 1 })

      expect(heap.size).toBe(4)
      expect(heap.peek()?.sortIndex).toBe(1)

      expect(heap.pop()?.sortIndex).toBe(1)
      expect(heap.pop()?.sortIndex).toBe(3)
      expect(heap.pop()?.sortIndex).toBe(5)
      expect(heap.pop()?.sortIndex).toBe(7)

      expect(heap.isEmpty()).toBe(true)
    })

    it('应该处理重复元素', () => {
      const heap = new MinHeap<{ sortIndex: number }>()

      heap.push({ sortIndex: 3 })
      heap.push({ sortIndex: 3 })
      heap.push({ sortIndex: 1 })
      heap.push({ sortIndex: 1 })

      expect(heap.pop()?.sortIndex).toBe(1)
      expect(heap.pop()?.sortIndex).toBe(1)
      expect(heap.pop()?.sortIndex).toBe(3)
      expect(heap.pop()?.sortIndex).toBe(3)
    })

    it('应该处理空堆的 peek 和 pop', () => {
      const heap = new MinHeap<{ sortIndex: number }>()

      expect(heap.peek()).toBeUndefined()
      expect(heap.pop()).toBeUndefined()
    })
  })

  describe('maxHeap', () => {
    it('应该正确创建最大堆', () => {
      const heap = new MaxHeap<{ sortIndex: number }>()
      expect(heap.size).toBe(0)
      expect(heap.isEmpty()).toBe(true)
    })

    it('应该正确插入和弹出元素', () => {
      const heap = new MaxHeap<{ sortIndex: number }>()

      heap.push({ sortIndex: 5 })
      heap.push({ sortIndex: 3 })
      heap.push({ sortIndex: 7 })
      heap.push({ sortIndex: 1 })

      expect(heap.size).toBe(4)
      expect(heap.peek()?.sortIndex).toBe(7)

      expect(heap.pop()?.sortIndex).toBe(7)
      expect(heap.pop()?.sortIndex).toBe(5)
      expect(heap.pop()?.sortIndex).toBe(3)
      expect(heap.pop()?.sortIndex).toBe(1)

      expect(heap.isEmpty()).toBe(true)
    })

    it('应该处理重复元素', () => {
      const heap = new MaxHeap<{ sortIndex: number }>()

      heap.push({ sortIndex: 3 })
      heap.push({ sortIndex: 3 })
      heap.push({ sortIndex: 1 })
      heap.push({ sortIndex: 1 })

      expect(heap.pop()?.sortIndex).toBe(3)
      expect(heap.pop()?.sortIndex).toBe(3)
      expect(heap.pop()?.sortIndex).toBe(1)
      expect(heap.pop()?.sortIndex).toBe(1)
    })
  })

  describe('堆操作', () => {
    it('应该正确处理大量元素', () => {
      const heap = new MinHeap<{ sortIndex: number }>()
      const numbers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

      numbers.forEach(num => heap.push({ sortIndex: num }))

      expect(heap.size).toBe(10)

      for (let i = 0; i < 10; i++) {
        expect(heap.pop()?.sortIndex).toBe(i)
      }
    })

    it('应该正确处理动态插入和弹出', () => {
      const heap = new MinHeap<{ sortIndex: number }>()

      heap.push({ sortIndex: 5 })
      expect(heap.peek()?.sortIndex).toBe(5)

      heap.push({ sortIndex: 3 })
      expect(heap.peek()?.sortIndex).toBe(3)

      heap.push({ sortIndex: 7 })
      expect(heap.peek()?.sortIndex).toBe(3)

      expect(heap.pop()?.sortIndex).toBe(3)
      expect(heap.peek()?.sortIndex).toBe(5)

      heap.push({ sortIndex: 1 })
      expect(heap.peek()?.sortIndex).toBe(1)
    })
  })
})
