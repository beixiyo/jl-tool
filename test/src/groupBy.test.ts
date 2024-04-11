import { groupBy } from '@/tools/tools'


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

/**
 * 相加结果为
 * math: 5
 * english: 50
 */
console.log(groupBy(input, 'type', 'score'))
console.log(groupBy(input, 'type', 'score', '+'))
console.log(groupBy(input, 'type', 'score', '-'))
console.log(groupBy(input, 'type', 'score', '*'))
console.log(groupBy(input, 'type', 'score', '/'))
console.log(groupBy(input, 'type', 'score', '**'))
console.log(groupBy(input, 'type', null))

