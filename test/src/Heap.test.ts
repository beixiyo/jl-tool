import { MinHeap, MaxHeap } from '@jl-org/tool'


console.log('MinHeap -------------------------------------------------------------------------');
(() => {
    function createTask(i: number) {
        return {
            sortIndex: i
        }
    }


    const mh = new MinHeap()

    mh.push(
        createTask(4),
        createTask(3),
        createTask(6),
        createTask(16),
        createTask(8),
        createTask(8),
        createTask(6),
        createTask(3),
    )

    console.log(mh.data)

    function pop() {
        const v = mh.peek()
        console.log(v?.sortIndex, v === mh.pop())
    }
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
})()


console.log('MaxHeap -------------------------------------------------------------------------');

(() => {
    function createTask(i: number) {
        return {
            sortIndex: i
        }
    }


    const mh = new MaxHeap()

    mh.push(
        createTask(4),
        createTask(3),
        createTask(6),
        createTask(16),
        createTask(8),
        createTask(8),
        createTask(6),
        createTask(3),
    )

    console.log(mh.data)

    function pop() {
        const v = mh.peek()
        console.log(v?.sortIndex, v === mh.pop())
    }
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
    pop()
})()
