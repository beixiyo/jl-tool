/**
 * 最小堆数据结构实现
 *
 * 最小堆是一种特殊的完全二叉树，其中每个节点的值都小于或等于其子节点的值。
 * 堆顶元素始终是整个堆中的最小值。
 *
 * @example
 * const minHeap = new MinHeap<HeapItem>();
 * minHeap.push({ sortIndex: 3 }, { sortIndex: 1 }, { sortIndex: 2 });
 * console.log(minHeap.pop()); // { sortIndex: 1 }
 */
export class MinHeap<T extends HeapItem> {
  /** 存储堆数据的数组 */
  readonly data: T[] = []

  /**
   * 获取堆中元素的数量
   * @returns 堆中元素的数量
   */
  get size(): number {
    return this.data.length
  }

  /**
   * 检查堆是否为空
   * @returns 如果堆为空则返回true，否则返回false
   */
  isEmpty(): boolean {
    return this.data.length === 0
  }

  /**
   * 返回堆顶元素但不移除它
   * @returns 堆顶元素，如果堆为空则返回undefined
   */
  peek(): T | undefined {
    return this.data[0]
  }

  /**
   * 向堆中添加一个或多个元素
   * @param items 要添加到堆中的元素
   */
  push(...items: T[]): void {
    for (const item of items) {
      this.pushOne(item)
    }
  }

  /**
   * 删除并返回堆顶元素
   * @returns 堆顶元素，如果堆为空则返回undefined
   */
  pop(): T | undefined {
    const { data } = this
    if (data.length <= 1) {
      return data.pop()
    }

    const first = data[0]
    const last = data.pop()!
    data[0] = last

    if (first.sortIndex === last.sortIndex) {
      return first
    }

    let curIndex = 0
    while (curIndex < data.length) {
      let minIndex = curIndex
      const leftIndex = getLeftIndex(curIndex)
      const rightIndex = getRightIndex(curIndex)
      const curItem = data[curIndex]
      const left = data[leftIndex]
      const right = data[rightIndex]

      if (
        leftIndex < data.length
        && left.sortIndex < curItem.sortIndex
      ) {
        minIndex = leftIndex
      }

      if (
        rightIndex < data.length
        && right.sortIndex < data[minIndex].sortIndex
      ) {
        minIndex = rightIndex
      }

      if (minIndex === curIndex) {
        break
      }

      swapInArray(data, curIndex, minIndex)
      curIndex = minIndex
    }

    return first
  }

  /**
   * 向堆中添加单个元素并维护堆性质
   * @param item 要添加的元素
   */
  private pushOne(item: T): void {
    const { data } = this
    data.push(item)

    /** 向上交换以维护最小堆性质 */
    let curIndex = data.length - 1
    while (curIndex > 0) {
      const parentIndex = getParentIndex(curIndex)
      const parent = data[parentIndex]

      if (item.sortIndex < parent.sortIndex) {
        swapInArray(data, curIndex, parentIndex)
        curIndex = parentIndex
      }
      else {
        break
      }
    }
  }
}

/**
 * 最大堆数据结构实现
 *
 * 最大堆是一种特殊的完全二叉树，其中每个节点的值都大于或等于其子节点的值。
 * 堆顶元素始终是整个堆中的最大值。
 *
 * @example
 * const maxHeap = new MaxHeap<HeapItem>();
 * maxHeap.push({ sortIndex: 1 }, { sortIndex: 3 }, { sortIndex: 2 });
 * console.log(maxHeap.pop()); // { sortIndex: 3 }
 */
export class MaxHeap<T extends HeapItem> {
  /** 存储堆数据的数组 */
  readonly data: T[] = []

  /**
   * 获取堆中元素的数量
   * @returns 堆中元素的数量
   */
  get size(): number {
    return this.data.length
  }

  /**
   * 检查堆是否为空
   * @returns 如果堆为空则返回true，否则返回false
   */
  isEmpty(): boolean {
    return this.data.length === 0
  }

  /**
   * 返回堆顶元素但不移除它
   * @returns 堆顶元素，如果堆为空则返回undefined
   */
  peek(): T | undefined {
    return this.data[0]
  }

  /**
   * 向堆中添加一个或多个元素
   * @param items 要添加到堆中的元素
   */
  push(...items: T[]): void {
    for (const item of items) {
      this.pushOne(item)
    }
  }

  /**
   * 删除并返回堆顶元素
   * @returns 堆顶元素，如果堆为空则返回undefined
   */
  pop(): T | undefined {
    const { data } = this
    if (data.length <= 1) {
      return data.pop()
    }

    const first = data[0]
    const last = data.pop()!
    data[0] = last

    if (first.sortIndex === last.sortIndex) {
      return first
    }

    let curIndex = 0
    while (curIndex < data.length) {
      let maxIndex = curIndex
      const leftIndex = getLeftIndex(curIndex)
      const rightIndex = getRightIndex(curIndex)
      const curItem = data[curIndex]
      const left = data[leftIndex]
      const right = data[rightIndex]

      if (
        leftIndex < data.length
        && curItem.sortIndex < left.sortIndex
      ) {
        maxIndex = leftIndex
      }

      if (
        rightIndex < data.length
        && right.sortIndex > data[maxIndex].sortIndex
      ) {
        maxIndex = rightIndex
      }

      if (maxIndex === curIndex) {
        break
      }

      swapInArray(data, curIndex, maxIndex)
      curIndex = maxIndex
    }

    return first
  }

  /**
   * 向堆中添加单个元素并维护堆性质
   * @param item 要添加的元素
   */
  private pushOne(item: T): void {
    const { data } = this
    data.push(item)

    /** 向上交换以维护最大堆性质 */
    let curIndex = data.length - 1
    while (curIndex > 0) {
      const parentIndex = getParentIndex(curIndex)
      const parent = data[parentIndex]

      if (item.sortIndex > parent.sortIndex) {
        swapInArray(data, curIndex, parentIndex)
        curIndex = parentIndex
      }
      else {
        break
      }
    }
  }
}

/**
 * 堆元素接口
 *
 * 所有可以被添加到堆中的元素都必须实现这个接口
 */
export interface HeapItem {
  /** 用于比较元素大小的索引值 */
  sortIndex: number
}

// ======================
// * 共享工具函数
// ======================
function getParentIndex(index: number): number {
  return Math.floor((index - 1) / 2)
}

function getLeftIndex(index: number): number {
  return index * 2 + 1
}

function getRightIndex(index: number): number {
  return index * 2 + 2
}

function swapInArray<T>(arr: T[], i: number, j: number): void {
  const temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}
