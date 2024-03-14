import { deepCompare } from '@/tools/tools'


const testCases = [
    // 基本类型
    [null, null],                                                                           // 0
    [undefined, undefined],                                                                 // 1
    [true, true],                                                                           // 2
    [false, false],                                                                         // 3
    [42, 42],                                                                               // 4
    ['hello', 'hello'],                                                                     // 5

    // 特殊值
    [NaN, NaN],                                                                             // 6
    [Infinity, Infinity],                                                                   // 7

    // 对象
    [{ a: 1, b: { c: 'nested' } }, { a: 1, b: { c: 'nested' } }],                           // 8
    [{ a: 1, b: { c: 'nested' } }, { a: 1, b: { c: 'different' } }],                        // 9 false

    // 数组
    [[1, 2, 3], [1, 2, 3]],                                                                 // 10
    [[1, 2, 3], [1, 2, 4]],                                                                 // 11 false

    // Map
    [new Map([[1, 'one'], [2, 'two']]), new Map([[1, 'one'], [2, 'two']])],                 // 12
    // 测试失败
    [new Map([[1, 'one'], [2, 'two']]), new Map([[1, 'one'], [2, 'three']])],               // 13

    // Set
    [new Set([1, 2, 3]), new Set([1, 2, 3])],                                               // 14
    // 测试失败
    [new Set([1, 2, 3]), new Set([1, 2, 4])],                                               // 15

    // Symbol
    [Symbol('foo'), Symbol('foo')],                                                         // 16 false

    // 函数
    [() => { }, () => { }],                                                                  // 17 false

    // undefined
    [undefined, undefined],                                                                 // 18

    // 复杂对象                                                                              // 19
    [
        { a: [1, 2, { b: 'nested' }], c: { d: 'hello', e: [null, { f: 'world' }] } },
        { a: [1, 2, { b: 'nested' }], c: { e: [null, { f: 'world' }], d: 'hello' } }
    ],

    // 循环引用测试                                                                           // 20
    (() => {
        const obj: any = { a: 1 }
        const obj2: any = { a: 1 }
        
        obj2.self = obj
        obj.self = obj2
        return [obj, obj2]
    })(),

    [                                                                                       // 21 false
        { a: undefined, b: undefined },
        { a: null, b: undefined }
    ]
]

console.log(testCases.map(([data1, data2]) => deepCompare(data1, data2)));

