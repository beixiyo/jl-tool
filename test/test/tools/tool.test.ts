import { padEmptyObj } from '@/tools/tools'
import { describe, expect, test } from 'vitest'


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

describe('padEmptyObj', () => {
    test('忽略 0', () => {
        expect(padEmptyObj(o)).toEqual(getBaseRes())
    })

    test('不忽略 0', () => {
        expect(padEmptyObj(o, {
            ignoreNum: false
        })).toEqual({
            ...getBaseRes(),
            a: '--'
        })
    })

    test('忽略 0 并自定义分隔符', () => {
        const sep = '***'
        expect(padEmptyObj(o, {
            ignoreNum: false,
            padStr: sep
        }))
            .toEqual({
                ...getBaseRes(sep),
                a: sep
            })
    })
})


function getBaseRes(sep = '--') {
    return {
        a: 0,
        b: '0',
        c: sep,
        d: sep,
        e: sep,
        f: sep,
        g: 'null',
        h: sep,
        i: sep,
        j: {},
        k: [],
    }
}