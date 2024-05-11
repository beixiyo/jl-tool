import { padEmptyObj } from '@/tools/tools'

const o = {
    a: 0,
    b: '0',
    c: '\n',
    d: '\t',
    e: '  ',
    f: '',
    g: 'null',
    h: null,
    i: undefined,
    j: {},
    k: [],
}


const SEP = '---'
const r1 = padEmptyObj(o)
const r2 = padEmptyObj(o, { padStr: SEP, ignoreNum: false})

console.log(r1)
console.log(r2)

/** 不转换 0 */
console.log(
    r1.a === 0
    && r1.b === '0'
    && r1.e === '--'
    && r1.f === '--'
    && r1.g === 'null'
    && r1.h === '--'
    && r1.i === '--'
)

/** 转换 0 */
console.log(
    r2.a as any === SEP
    && r2.b === '0'
    && r2.e === SEP
    && r2.f === SEP
    && r2.g === 'null'
    && r2.h === SEP
    && r2.i === SEP
)