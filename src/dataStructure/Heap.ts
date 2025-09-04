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
  readonly data: T[]

  /**
   * 创建一个新的最小堆实例
   */
  constructor() {
    this.data = []
  }

  /**
   * 获取堆中元素的数量
   * @returns 堆中元素的数量
   */
  get size() {
    return this.data.length
  }

  /**
   * 检查堆是否为空
   * @returns 如果堆为空则返回true，否则返回false
   */
  isEmpty() {
    return this.data.length === 0
  }

  /**
   * 返回堆顶元素但不移除它
   * @returns 堆顶元素，如果堆为空则返回undefined
   */
  peek() {
    return this.data[0]
  }

  /**
   * 向堆中添加一个或多个元素
   * @param items 要添加到堆中的元素
   */
  push(...items: T[]) {
    items.forEach(item => this.pushOne(item))
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
      const [left, leftIndex] = this.getLeft(curIndex)
      const [right, rightIndex] = this.getRight(curIndex)
      const curItem = data[curIndex]

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

      this.swap(curIndex, minIndex)
      curIndex = minIndex
    }

    return first
  }

  /**
   * 向堆中添加单个元素并维护堆性质
   * @param item 要添加的元素
   */
  private pushOne(item: T) {
    const { data } = this
    data.push(item)

    /** 向上交换以维护最小堆性质 */
    let curIndex = data.length - 1
    while (curIndex > 0) {
      const [parent, parentIndex] = this.getParent(curIndex)

      if (item.sortIndex < parent.sortIndex) {
        this.swap(curIndex, parentIndex)
        curIndex = parentIndex
      }
      else {
        break
      }
    }
  }

  /**
   * 获取指定索引的父节点
   * @param index 子节点的索引
   * @returns 包含父节点和其索引的元组
   */
  private getParent(index: number): [T, number] {
    const i = Math.floor((index - 1) / 2)
    return [this.data[i], i]
  }

  /**
   * 获取指定索引的左子节点
   * @param index 父节点的索引
   * @returns 包含左子节点和其索引的元组
   */
  private getLeft(index: number): [T, number] {
    const i = index * 2 + 1
    return [this.data[i], i]
  }

  /**
   * 获取指定索引的右子节点
   * @param index 父节点的索引
   * @returns 包含右子节点和其索引的元组
   */
  private getRight(index: number): [T, number] {
    const i = index * 2 + 2
    return [this.data[i], i]
  }

  /**
   * 交换数组中两个位置的元素
   * @param i 第一个元素的索引
   * @param j 第二个元素的索引
   */
  private swap(i: number, j: number) {
    const temp = this.data[i]
    this.data[i] = this.data[j]
    this.data[j] = temp
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
  readonly data: T[]

  /**
   * 创建一个新的最大堆实例
   */
  constructor() {
    this.data = []
  }

  /**
   * 获取堆中元素的数量
   * @returns 堆中元素的数量
   */
  get size() {
    return this.data.length
  }

  /**
   * 检查堆是否为空
   * @returns 如果堆为空则返回true，否则返回false
   */
  isEmpty() {
    return this.data.length === 0
  }

  /**
   * 返回堆顶元素但不移除它
   * @returns 堆顶元素，如果堆为空则返回undefined
   */
  peek() {
    return this.data[0]
  }

  /**
   * 向堆中添加一个或多个元素
   * @param items 要添加到堆中的元素
   */
  push(...items: T[]) {
    items.forEach(item => this.pushOne(item))
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
      const
        [left, leftIndex] = this.getLeft(curIndex)
      const [right, rightIndex] = this.getRight(curIndex)
      const curItem = data[curIndex]

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

      this.swap(curIndex, maxIndex)
      curIndex = maxIndex
    }

    return first
  }

  /**
   * 向堆中添加单个元素并维护堆性质
   * @param item 要添加的元素
   */
  private pushOne(item: T) {
    const { data } = this
    data.push(item)

    /** 向上交换以维护最大堆性质 */
    let curIndex = data.length - 1
    while (curIndex > 0) {
      const [parent, parentIndex] = this.getParent(curIndex)

      if (item.sortIndex > parent.sortIndex) {
        this.swap(curIndex, parentIndex)
        curIndex = parentIndex
      }
      else {
        break
      }
    }
  }

  /**
   * 获取指定索引的父节点
   * @param index 子节点的索引
   * @returns 包含父节点和其索引的元组
   */
  private getParent(i: number): [T, number] {
    const index = Math.floor((i - 1) / 2)
    return [this.data[index], index]
  }

  /**
   * 获取指定索引的左子节点
   * @param index 父节点的索引
   * @returns 包含左子节点和其索引的元组
   */
  private getLeft(i: number): [T, number] {
    const index = 2 * i + 1
    return [this.data[index], index]
  }

  /**
   * 获取指定索引的右子节点
   * @param index 父节点的索引
   * @returns 包含右子节点和其索引的元组
   */
  private getRight(i: number): [T, number] {
    const index = 2 * i + 2
    return [this.data[index], index]
  }

  /**
   * 交换数组中两个位置的元素
   * @param i 第一个元素的索引
   * @param j 第二个元素的索引
   */
  private swap(i: number, j: number) {
    const temp = this.data[i]
    this.data[i] = this.data[j]
    this.data[j] = temp
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
