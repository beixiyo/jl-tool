import { timeGap } from '@/tools/dateTools'


console.log(timeGap())
console.log(timeGap('2023-10-25'))
console.log(timeGap('2024-10-25'))
console.log('---------------------------------')
console.log(timeGap('2024-4-12'))
console.log(timeGap('2024-4-13'))
console.log(timeGap('2024-4-14'))
console.log(timeGap('2024-4-15'))
console.log(timeGap('2024-4-16'))

console.log(timeGap('2024-4-12', {
    beforeFn: (str) => `${str}之前`,
}))

console.log(timeGap('2024-4-16', {
    afterFn: (str) => `${str}之后`,
}))

console.log(timeGap('asdfsad', {
    fallback: '未知时间',
}))

