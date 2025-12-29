import { describe, expect, it } from 'vitest'
import { celsiusToFahrenheit, truncate, TruncateOptions, excludeKeys, excludeVals, fahrenheitToCelsius, filterKeys, filterVals, getRandomNum, getType, padEmptyObj, padNum, randomStr, toCamel } from '@/tools/tools'

it('获取类型', () => {
  expect(getType(undefined)).toBe('undefined')
  expect(getType(null)).toBe('null')
  expect(getType({})).toBe('object')

  expect(getType(1)).toBe('number')
  expect(getType(Number.NaN)).toBe('number')
  expect(getType('1')).toBe('string')

  expect(getType(new Map())).toBe('map')
  expect(getType(new Set())).toBe('set')

  expect(getType(() => { })).toBe('function')
  expect(getType(() => { })).toBe('function')
  expect(getType(async () => { })).toBe('asyncfunction')
})

it('随机字符串', () => {
  expect(randomStr()).toHaveLength(10)
  expect(typeof randomStr()).toBe('string')
})

it('温度转换', () => {
  expect(celsiusToFahrenheit(40)).toBe(104)
  expect(fahrenheitToCelsius(104)).toBe(40)
})

describe('随机数字', () => {
  const count = 2000

  it('整数', () => {
    for (let i = 0; i < count; i++) {
      const n = getRandomNum(0, 100)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(100)
    }
  })

  it('浮点数', () => {
    for (let i = 0; i < count; i++) {
      const n = getRandomNum(0.1, 100.9, true)
      expect(n).toBeGreaterThanOrEqual(0.1)
      expect(n).toBeLessThan(100.9)
    }
  })
})

describe('截取字符串', () => {
  it('基础用法', () => {
    const str = '123456789'
    expect(truncate(str, 6)).toBe('123...')
    expect(truncate(str, 7)).toBe('1234...')

    expect(truncate(str, 3)).toBe('123')
    expect(truncate(str, 0)).toBe('')
    expect(truncate(str, -1)).toBe('12345678')

    expect(truncate(str, 6, '---')).toBe('123---')
    expect(truncate(str, 6, '--')).toBe('1234--')
  })

  it('数组支持 - 默认分隔符', () => {
    expect(truncate([1, 2, 3, 4, 5], 3)).toBe('1,2...')
    expect(truncate(['a', 'b', 'c'], 5)).toBe('a,b,c')
    expect(truncate([1, 2, 3, 4, 5], 3, 'more')).toBe('1,2more')
    expect(truncate([1, 2, 3], 5)).toBe('1,2,3')
    expect(truncate([1, 2, 3], 0)).toBe('')
  })

  it('数组支持 - 自定义分隔符和后缀', () => {
    expect(truncate([1, 2, 3, 4, 5], 3, { separator: ' | ', suffix: '...' })).toBe('1 | 2...')
    expect(truncate(['a', 'b', 'c', 'd'], 2, { separator: '-', suffix: '等' })).toBe('a等')
    expect(truncate([1, 2, 3], 5, { separator: ' | ' })).toBe('1 | 2 | 3')
    expect(truncate([1, 2, 3, 4], 3, { separator: ',', suffix: ' 等' })).toBe('1,2 等')
  })

  it('数组支持 - 自定义拼接函数', () => {
    // 使用自定义 join 函数添加括号
    expect(truncate([1, 2, 3, 4, 5], 3, {
      join: (arr, sep) => arr.map(x => `[${x}]`).join(sep)
    })).toBe('[1],[2]...')

    // 自定义 join 函数，忽略 separator 参数
    expect(truncate(['apple', 'banana', 'cherry'], 2, {
      separator: ' | ',
      suffix: ' 等',
      join: (arr) => arr.join('、')
    })).toBe('apple 等')

    // 自定义 join 函数处理对象数组
    expect(truncate([{ name: 'a' }, { name: 'b' }, { name: 'c' }], 2, {
      join: (arr) => arr.map(item => item.name).join(', ')
    })).toBe('a...')

    // 自定义 join 函数，使用 separator 参数
    expect(truncate([1, 2, 3, 4], 3, {
      separator: ' | ',
      join: (arr, sep) => arr.join(sep)
    })).toBe('1 | 2...')

    // 数组未超过长度时也使用自定义 join
    expect(truncate([1, 2, 3], 5, {
      join: (arr) => arr.map(x => `(${x})`).join(' + ')
    })).toBe('(1) + (2) + (3)')
  })

  it('配置项类型导出', () => {
    // 验证 CutStrOptions 类型可以正常使用
    const options: TruncateOptions<number> = {
      separator: ',',
      suffix: '...',
      join: (arr) => arr.join(',')
    }
    expect(truncate([1, 2, 3], 2, options)).toBe('1...')

    // 测试自定义 join 函数
    const optionsWithJoin: TruncateOptions<string> = {
      separator: ',',
      suffix: '...',
      join: (arr) => arr.map(s => s.toUpperCase()).join(' | ')
    }
    expect(truncate(['a', 'b', 'c', 'd'], 3, optionsWithJoin)).toBe('A | B...')
  })
})

// ==========================================================

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

describe('填补对象空值', () => {
  it('忽略 0', () => {
    expect(padEmptyObj(o)).toEqual(getBaseRes())
  })

  it('不忽略 0', () => {
    expect(padEmptyObj(o, {
      ignoreNum: false,
    })).toEqual({
      ...getBaseRes(),
      a: '--',
    })
  })

  it('忽略 0 并自定义分隔符', () => {
    const sep = '***'
    expect(padEmptyObj(o, {
      ignoreNum: false,
      padStr: sep,
    }))
      .toEqual({
        ...getBaseRes(sep),
        a: sep,
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

// ==========================================================

it('蛇形转驼峰', () => {
  expect(toCamel('my_ass_oh_no')).toBe('myAssOhNo')
})

it('自定义转换符号', () => {
  expect(toCamel('test/a', '/')).toBe('testA')
})

it('数字补齐精度', () => {
  expect(padNum(1)).toBe('1.00')
  expect(padNum(1, 3)).toBe('1.000')

  expect(padNum(1, 3, '1')).toBe('1.111')
  expect(padNum(3.59, 4)).toBe('3.5900')
})

// ==========================================================

describe('提取 | 排除对象值', () => {
  const obj = {
    a: 1,
    b: 0,
    c: null,
    d: undefined,
    f: 100,
  }

  it('提取键测试', () => {
    expect(filterKeys(obj, ['a', 'b'])).toEqual({
      a: 1,
      b: 0,
    })
  })
  it('排除键测试', () => {
    expect(excludeKeys(obj, ['a', 'b'])).toEqual({
      c: null,
      d: undefined,
      f: 100,
    })
  })

  it('提取值测试', () => {
    expect(filterVals(obj, [1, 0])).toEqual({
      a: 1,
      b: 0,
    })
  })
  it('排除值测试', () => {
    expect(excludeVals(obj, [1, 0])).toEqual({
      c: null,
      d: undefined,
      f: 100,
    })
  })
})
