import { groupBy } from '@/tools/arrTools'
import { describe, expect, test } from 'vitest'


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

describe('配置测试', () => {
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