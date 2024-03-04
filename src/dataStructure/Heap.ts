/** 最小堆算法 */
export class MinHeap<T extends HeapItem> {
    readonly data: T[]

    constructor() {
        this.data = []
    }

    get size() {
        return this.data.length
    }

    isEmpty() {
        return this.data.length === 0
    }

    /** 返回堆顶的值 */
    peek() {
        return this.data[0]
    }

    push(...items: T[]) {
        items.forEach((item) => this.pushOne(item))
    }

    /** 删除并返回堆顶的值 */
    pop() {
        const { data } = this
        if (data.length <= 1) {
            return data.pop()
        }

        const first = data[0],
            last = data.pop()!
        data[0] = last

        if (first.sortIndex === last.sortIndex) {
            return first
        }

        let curIndex = 0
        while (curIndex < data.length) {
            let minIndex = curIndex
            const
                [left, leftIndex] = this.getLeft(curIndex),
                [right, rightIndex] = this.getRight(curIndex),
                curItem = data[curIndex]

            if (
                leftIndex < data.length &&
                left.sortIndex < curItem.sortIndex
            ) {
                minIndex = leftIndex
            }

            if (
                rightIndex < data.length &&
                right.sortIndex < data[minIndex].sortIndex
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

    private pushOne(item: T) {
        const { data } = this
        data.push(item)

        // 向上交换
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

    private getParent(index: number): [T, number] {
        const i = Math.floor((index - 1) / 2)
        return [this.data[i], i]
    }

    private getLeft(index: number): [T, number] {
        const i = index * 2 + 1
        return [this.data[i], i]
    }

    private getRight(index: number): [T, number] {
        const i = index * 2 + 2
        return [this.data[i], i]
    }

    private swap(i: number, j: number) {
        let temp = this.data[i]
        this.data[i] = this.data[j]
        this.data[j] = temp
    }
}


/** 最大堆算法 */
export class MaxHeap<T extends HeapItem> {
    readonly data: T[]

    constructor() {
        this.data = []
    }

    get size() {
        return this.data.length
    }

    isEmpty() {
        return this.data.length === 0
    }

    /** 返回堆顶的值 */
    peek() {
        return this.data[0]
    }

    push(...items: T[]) {
        items.forEach((item) => this.pushOne(item))
    }

    /** 删除并返回堆顶的值 */
    pop() {
        const { data } = this
        if (data.length <= 1) {
            return data.pop()
        }

        const first = data[0],
            last = data.pop()!
        data[0] = last

        if (first.sortIndex === last.sortIndex) {
            return first
        }

        let curIndex = 0
        while (curIndex < data.length) {
            let maxIndex = curIndex
            const
                [left, leftIndex] = this.getLeft(curIndex),
                [right, rightIndex] = this.getRight(curIndex),
                curItem = data[curIndex]

            if (
                leftIndex < data.length &&
                curItem.sortIndex < left.sortIndex
            ) {
                maxIndex = leftIndex
            }

            if (
                rightIndex < data.length &&
                right.sortIndex > data[maxIndex].sortIndex
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

    private pushOne(item: T) {
        const { data } = this
        data.push(item)

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

    private getParent(i: number): [T, number] {
        const index = Math.floor((i - 1) / 2)
        return [this.data[index], index]
    }

    private getLeft(i: number): [T, number] {
        const index = 2 * i + 1
        return [this.data[index], index]
    }

    private getRight(i: number): [T, number] {
        const index = 2 * i + 2
        return [this.data[index], index]
    }

    private swap(i: number, j: number) {
        const temp = this.data[i]
        this.data[i] = this.data[j]
        this.data[j] = temp
    }
}

interface HeapItem {
    sortIndex: number
}
