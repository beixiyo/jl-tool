import { arrToChunk, arrToTree, binarySearch, getPageData, getSum, groupBy, searchTreeData } from '@/tools/arrTools'
import { describe, expect, test } from 'vitest'


describe('数组工具测试', () => {
    const pageArr = Array.from({ length: 200 }, (_, i) => i + 1),
        oneToTenArr = Array.from({ length: 10 }, (_, i) => i + 1)

    test('分页测试', () => {
        expect(getPageData(pageArr, 1, 10)).toEqual(oneToTenArr)
        expect(getPageData(pageArr, 2, 10)).toEqual(Array.from({ length: 10 }, (_, i) => i + 11))
    })

    test('求和测试', () => {
        const data = [
            { v: 1 }, { v: 2 }, { v: 3 },
        ]
        expect(getSum([1, 2, 3])).toBe(6)
        expect(getSum(data, item => item.v)).toBe(6)
    })

    test('数组分块测试', () => {
        expect(arrToChunk(oneToTenArr, 5)).toEqual([
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10]
        ])

        expect(arrToChunk([], 10)).toEqual([])
        expect(arrToChunk([1], 10)).toEqual([[1]])
    })

    test('二分查找测试', () => {
        expect(binarySearch(pageArr, 50)).toEqual(49)
        expect(binarySearch(pageArr, 1000)).toEqual(-1)
    })
})


describe('树形结构搜索测试', () => {
    const treeData = [
        {
            'name': 'apple',
            children: [
                {
                    'name': 'orange',
                    children: [
                        {
                            'name': 'banana'
                        }
                    ]
                },
                {
                    'name': 'pear'
                }
            ]
        },
        {
            name: 'watermelon'
        }
    ]
    

    test('默认配置', () => {
        expect(searchTreeData('app', treeData)).toEqual([treeData[0]])
        expect(searchTreeData('wat', treeData)).toEqual([treeData[1]])
    })

    test('手动配置', () => {
        expect(searchTreeData('WAT', treeData, {
            ignoreCase: false
        })).not.toEqual([treeData[1]])

        expect(searchTreeData('WAT', treeData, {
            ignoreCase: true,
            key: 'testKey'
        })).not.toEqual([treeData[1]])
    })

    test('搜索子级', () => {
        expect(searchTreeData('ban', treeData)).toEqual([
            {
                'name': 'apple',
                children: [
                    {
                        'name': 'orange',
                        children: [
                            {
                                'name': 'banana'
                            }
                        ]
                    },
                ]
            },
        ])

        expect(searchTreeData('pear', treeData)).toEqual([
            {
                'name': 'apple',
                children: [
                    {
                        'name': 'pear'
                    }
                ]
            },
        ])
    })
})


// ================================================


const input = [
    {
        type: 'math',
        score: 1
    },
    {
        type: 'english',
        score: 10
    },
    {
        type: 'math',
        score: 2
    },
    {
        type: 'english',
        score: 20
    },
    {
        type: 'math',
        score: 2
    },
    {
        type: 'english',
        score: 20
    }
]

describe('分组测试', () => {
    test('根据分数分类', () => {
        expect(groupBy(input, 'type', 'score')).toEqual([
            {
                type: 'math',
                score: [1, 2, 2]
            },
            {
                type: 'english',
                score: [10, 20, 20]
            },
        ])
    })

    test('根据分数分类并相加', () => {
        expect(groupBy(input, 'type', 'score', '+')).toEqual([
            {
                type: 'math',
                score: 1 + 2 + 2
            },
            {
                type: 'english',
                score: 10 + 20 + 20
            },
        ])
    })

    test('根据分数分类并相乘', () => {
        expect(groupBy(input, 'type', 'score', '*')).toEqual([
            {
                type: 'math',
                score: 1 * 2 * 2
            },
            {
                type: 'english',
                score: 10 * 20 * 20
            },
        ])
    })

    test('根据分数分类并相减', () => {
        expect(groupBy(input, 'type', 'score', '-')).toEqual([
            {
                type: 'math',
                score: 1 - 2 - 2
            },
            {
                type: 'english',
                score: 10 - 20 - 20
            },
        ])
    })

    test('收集整个对象', () => {
        expect(groupBy(input, 'type', null)).toEqual([
            {
                type: 'math',
                children: [
                    {
                        type: 'math',
                        score: 1
                    },
                    {
                        type: 'math',
                        score: 2
                    },
                    {
                        type: 'math',
                        score: 2
                    },
                ]
            },
            {
                type: 'english',
                children: [
                    {
                        type: 'english',
                        score: 10
                    },
                    {
                        type: 'english',
                        score: 20
                    },
                    {
                        type: 'english',
                        score: 20
                    },
                ]
            }
        ])
    })
})


const input2 = [
    {
        type: 'math',
        size: '1px'
    },
    {
        type: 'english',
        size: '10px'
    },
    {
        type: 'english',
        size: '20px'
    },
    {
        type: 'math',
        size: '2px'
    }
]

describe('分组配置测试', () => {
    test('parseFloat 测试', () => {
        expect(groupBy(input2, 'type', 'size', '+', true)).toEqual([
            {
                type: 'math',
                size: 1 + 2
            },
            {
                type: 'english',
                size: 10 + 20
            },
        ])
    })
})


// ================================================


describe('扁平数组转递归树测试', () => {
    const arr = [
        { id: 1, name: '部门1', pid: 0 },
        { id: 2, name: '部门2', pid: 1 },
        { id: 3, name: '部门3', pid: 1 },
        { id: 4, name: '部门4', pid: 3 },
        { id: 5, name: '部门5', pid: 4 },
        { id: 6, name: '部门6', pid: 1 },
    ]

    test('扁平数组转递归树测试', () => {
        expect(arrToTree(arr)).toEqual([
            {
                "id": 1,
                "name": "部门1",
                "pid": 0,
                "children": [
                    {
                        "id": 2,
                        "name": "部门2",
                        "pid": 1,
                        "children": []
                    },
                    {
                        "id": 3,
                        "name": "部门3",
                        "pid": 1,
                        "children": [
                            {
                                "id": 4,
                                "name": "部门4",
                                "pid": 3,
                                "children": [
                                    {
                                        "id": 5,
                                        "name": "部门5",
                                        "pid": 4,
                                        "children": []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": 6,
                        "name": "部门6",
                        "pid": 1,
                        "children": []
                    }
                ]
            }
        ])
    })
})