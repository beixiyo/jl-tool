export class LRUCache<K, V> extends Map<K, V> {
  /**
   * @param maxCacheLen 最大缓存长度
   */
  constructor(public maxCacheLen: number) {
    super()
  }

  get(key: K): V | undefined {
    const hasKey = super.has(key)
    const value = super.get(key)
    /**
     * 如果存在，则删除后重新设置，保证顺序最新
     */
    if (hasKey) {
      super.delete(key)
      super.set(key, value as V)
    }
    return value
  }

  set(key: K, value: V): this {
    /**
     * 如果存在，则删除后重新设置，保证顺序最新
     */
    if (super.has(key)) {
      super.delete(key)
    }
    const res = super.set(key, value)

    /**
     * 如果超出最大缓存长度，则删除最久未使用的（第一个）
     */
    while (this.size > this.maxCacheLen && this.size > 0) {
      const oldest = this.keys().next()
      if (oldest.done)
        break

      super.delete(oldest.value)
    }

    return res
  }
}
