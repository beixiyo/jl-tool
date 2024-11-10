import { LRUCache } from '@/dataStructure/LRUCache'
import { beforeEach, describe, expect, test } from 'vitest'


describe('LRUCache', () => {
  let cache: LRUCache<number, string>

  beforeEach(() => {
    cache = new LRUCache<number, string>(3)
  })

  test('should set and get values correctly', () => {
    cache.set(1, 'a')
    cache.set(2, 'b')
    expect(cache.get(1)).toBe('a')
    expect(cache.get(2)).toBe('b')
  })

  test('should update the order of keys based on usage', () => {
    cache.set(1, 'a')
    cache.set(2, 'b')
    cache.set(3, 'c')
    cache.get(1)
    cache.set(4, 'd')

    expect(cache.get(1)).toBe('a')
    expect(cache.get(2)).toBeUndefined()
    expect(cache.get(3)).toBe('c')
    expect(cache.get(4)).toBe('d')
  })

  test('should evict the least recently used item when cache is full', () => {
    cache.set(1, 'a')
    cache.set(2, 'b')
    cache.set(3, 'c')
    cache.set(4, 'd')
    expect(cache.get(1)).toBeUndefined()
    expect(cache.get(2)).toBe('b')
    expect(cache.get(3)).toBe('c')
    expect(cache.get(4)).toBe('d')
  })

  test('should handle maxLen of 0', () => {
    const zeroLenCache = new LRUCache<number, string>(0)
    zeroLenCache.set(1, 'a')
    expect(zeroLenCache.get(1)).toBeUndefined()
  })

  test('should handle negative maxLen', () => {
    const negativeLenCache = new LRUCache<number, string>(-1)
    negativeLenCache.set(1, 'a')
    expect(negativeLenCache.get(1)).toBeUndefined()
  })

  test('should handle deleting non-existent keys', () => {
    cache.delete(1)
    expect(cache.get(1)).toBeUndefined()
  })

  test('should handle deleting and re-adding keys', () => {
    cache.set(1, 'a')
    cache.delete(1)
    cache.set(1, 'b')
    expect(cache.get(1)).toBe('b')
  })

  test('should handle getting non-existent keys', () => {
    expect(cache.get(1)).toBeUndefined()
  })

  test('should handle setting and getting multiple keys', () => {
    cache.set(1, 'a')
    cache.set(2, 'b')
    cache.set(3, 'c')
    expect(cache.get(1)).toBe('a')
    expect(cache.get(2)).toBe('b')
    expect(cache.get(3)).toBe('c')
  })

  test('should handle setting and getting the same key multiple times', () => {
    cache.set(1, 'a')
    expect(cache.get(1)).toBe('a')
    cache.set(1, 'b')
    expect(cache.get(1)).toBe('b')
    cache.set(1, 'c')
    expect(cache.get(1)).toBe('c')
  })
})
