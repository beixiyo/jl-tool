import { describe, expect, it, vi } from 'vitest'
import { arrIsEqual, arrToChunk, arrToTree, bfsFind, binarySearch, dfsFind, genArr, genTypedArr, getPageData, getSum, groupBy, searchTreeData } from '@/tools/arrTools'

describe('数组工具测试', () => {
  const pageArr = Array.from({ length: 200 }, (_, i) => i + 1)
  const pageItemArr = Array.from({ length: 200 }, (_, i) => ({ data: i + 1 }))
  const oneToTenArr = Array.from({ length: 10 }, (_, i) => i + 1)

  it('分页测试', () => {
    expect(getPageData(pageArr, 1, 10)).toEqual(oneToTenArr)
    expect(getPageData(pageArr, 2, 10)).toEqual(Array.from({ length: 10 }, (_, i) => i + 11))
  })

  it('求和测试', () => {
    const data = [
      { v: 1 },
      { v: 2 },
      { v: 3 },
    ]
    expect(getSum([1, 2, 3])).toBe(6)
    expect(getSum(data, item => item.v)).toBe(6)
  })

  it('数组分块测试', () => {
    expect(arrToChunk(oneToTenArr, 5)).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
    ])

    expect(arrToChunk([], 10)).toEqual([])
    expect(arrToChunk([1], 10)).toEqual([[1]])
  })

  it('二分查找测试', () => {
    expect(binarySearch(pageArr, 50)).toEqual(49)
    expect(binarySearch(pageArr, 1000)).toEqual(-1)

    expect(binarySearch(pageItemArr, 50, item => item.data)).toEqual(49)
    expect(binarySearch(pageItemArr, 500, item => item.data)).toEqual(-1)
  })

  it('二分查找重复元素找到第一个索引', () => {
    expect(binarySearch(
      [0, 1, 2, 2, 2, 3, 4, 8, 10, 32],
      2,
    )).toEqual(2)
  })
})

describe('类型化数组生成测试', () => {
  it('类型和长度测试', () => {
    const size = 5
    const genVal = vi.fn(index => index * 2)
    const result = genTypedArr(size, genVal)

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(size)
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(i * 2)
      expect(genVal).toHaveBeenCalledWith(i)
    }
  })

  it('指定类型测试', () => {
    const size = 5
    const genVal = (index: number) => index * 2
    const result = genTypedArr(size, genVal, Uint8Array)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(size)
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(i * 2)
    }
  })
})

it('数组生成测试', () => {
  const size = 5
  const genVal = vi.fn(index => index * 2)
  const result = genArr(size, genVal)

  expect(result.length).toBe(size)
  for (let i = 0; i < result.length; i++) {
    expect(result[i]).toBe(i * 2)
    expect(genVal).toHaveBeenCalledWith(i)
  }

  const genVal2 = vi.fn((index: number) => [index * 10])
  const result2 = genArr(size, genVal2)

  expect(result2.length).toBe(size)
  for (let i = 0; i < result2.length; i++) {
    expect(result2[i]).toEqual([i * 10])
    expect(genVal).toHaveBeenCalledWith(i)
  }
})

describe('树形结构搜索测试', () => {
  const treeData = [
    {
      name: 'apple',
      children: [
        {
          name: 'orange',
          children: [
            {
              name: 'banana',
            },
          ],
        },
        {
          name: 'pear',
        },
      ],
    },
    {
      name: 'watermelon',
    },
  ]

  it('默认配置', () => {
    expect(searchTreeData('app', treeData)).toEqual([treeData[0]])
    expect(searchTreeData('wat', treeData)).toEqual([treeData[1]])
  })

  it('手动配置', () => {
    expect(searchTreeData('WAT', treeData, {
      ignoreCase: false,
    })).not.toEqual([treeData[1]])

    expect(searchTreeData('WAT', treeData, {
      ignoreCase: true,
      key: 'testKey',
    })).not.toEqual([treeData[1]])
  })

  it('搜索子级', () => {
    expect(searchTreeData('ban', treeData)).toEqual([
      {
        name: 'apple',
        children: [
          {
            name: 'orange',
            children: [
              {
                name: 'banana',
              },
            ],
          },
        ],
      },
    ])

    expect(searchTreeData('pear', treeData)).toEqual([
      {
        name: 'apple',
        children: [
          {
            name: 'pear',
          },
        ],
      },
    ])
  })
})

// ================================================

const input = [
  {
    type: 'math',
    score: 1,
  },
  {
    type: 'english',
    score: 10,
  },
  {
    type: 'math',
    score: 2,
  },
  {
    type: 'english',
    score: 20,
  },
  {
    type: 'math',
    score: 2,
  },
  {
    type: 'english',
    score: 20,
  },
]

describe('分组测试', () => {
  it('根据分数分类', () => {
    expect(groupBy(input, 'type', 'score')).toEqual([
      {
        type: 'math',
        score: [1, 2, 2],
      },
      {
        type: 'english',
        score: [10, 20, 20],
      },
    ])
  })

  it('根据分数分类并相加', () => {
    expect(groupBy(input, 'type', 'score', '+')).toEqual([
      {
        type: 'math',
        score: 1 + 2 + 2,
      },
      {
        type: 'english',
        score: 10 + 20 + 20,
      },
    ])
  })

  it('根据分数分类并相乘', () => {
    expect(groupBy(input, 'type', 'score', '*')).toEqual([
      {
        type: 'math',
        score: 1 * 2 * 2,
      },
      {
        type: 'english',
        score: 10 * 20 * 20,
      },
    ])
  })

  it('根据分数分类并相减', () => {
    expect(groupBy(input, 'type', 'score', '-')).toEqual([
      {
        type: 'math',
        score: 1 - 2 - 2,
      },
      {
        type: 'english',
        score: 10 - 20 - 20,
      },
    ])
  })

  it('收集整个对象', () => {
    expect(groupBy(input, 'type', null)).toEqual([
      {
        type: 'math',
        children: [
          {
            type: 'math',
            score: 1,
          },
          {
            type: 'math',
            score: 2,
          },
          {
            type: 'math',
            score: 2,
          },
        ],
      },
      {
        type: 'english',
        children: [
          {
            type: 'english',
            score: 10,
          },
          {
            type: 'english',
            score: 20,
          },
          {
            type: 'english',
            score: 20,
          },
        ],
      },
    ])
  })
})

const input2 = [
  {
    type: 'math',
    size: '1px',
  },
  {
    type: 'english',
    size: '10px',
  },
  {
    type: 'english',
    size: '20px',
  },
  {
    type: 'math',
    size: '2px',
  },
]

describe('分组配置测试', () => {
  it('parseFloat 测试', () => {
    expect(groupBy(input2, 'type', 'size', '+', true)).toEqual([
      {
        type: 'math',
        size: 1 + 2,
      },
      {
        type: 'english',
        size: 10 + 20,
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

  it('扁平数组转递归树测试', () => {
    expect(arrToTree(arr)).toEqual([
      {
        id: 1,
        name: '部门1',
        pid: 0,
        children: [
          {
            id: 2,
            name: '部门2',
            pid: 1,
            children: [],
          },
          {
            id: 3,
            name: '部门3',
            pid: 1,
            children: [
              {
                id: 4,
                name: '部门4',
                pid: 3,
                children: [
                  {
                    id: 5,
                    name: '部门5',
                    pid: 4,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: 6,
            name: '部门6',
            pid: 1,
            children: [],
          },
        ],
      },
    ])
  })
})

// ================================================

describe('数组内容比较', () => {
  const arr1 = [1, 8, '123', 'asdf2', 45]
  const arr2 = ['123', 8, 'asdf2', 45, 1]

  it('默认忽略排序', () => {
    expect(arrIsEqual(arr1, arr2)).toBeTruthy()
  })

  it('不忽略排序', () => {
    expect(arrIsEqual(arr1, arr2, false)).toBeFalsy()
    expect(arrIsEqual(arr1, arr1, true)).toBeTruthy()
  })

  it('空数组测试', () => {
    expect(arrIsEqual([], [], true)).toBeTruthy()
    expect(arrIsEqual([], [], false)).toBeTruthy()
  })
})

// ================================================

const input3 = [
  {
    value: 1,
    children: [
      {
        value: 2,
        children: [
          { value: 4, children: [] },
          { value: 5, children: [] },
        ],
      },
      {
        value: 3,
        children: [
          { value: 6, children: [] },
          { value: 7, children: [] },
        ],
      },
    ],
  },
]

const findValue = (target: number) => (node: typeof input3[0]) => node.value === target

it('广度遍历测试', () => {
  expect(bfsFind(input3, findValue(1))?.value).toBe(1)
  expect(bfsFind(input3, findValue(4))?.value).toBe(4)
  expect(bfsFind(input3, findValue(7))?.value).toBe(7)
  expect(bfsFind(input3, findValue(100))).toBe(null)
})

it('深度遍历测试', () => {
  expect(dfsFind(input3, findValue(1))?.value).toBe(1)
  expect(dfsFind(input3, findValue(4))?.value).toBe(4)
  expect(dfsFind(input3, findValue(7))?.value).toBe(7)
  expect(dfsFind(input3, findValue(100))).toBe(null)
})
