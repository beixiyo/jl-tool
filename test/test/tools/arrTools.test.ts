import { describe, expect, it } from 'vitest'
import { arrToTree, bfsFind, binarySearch, dfsFind, groupBy } from '@/tools/arrTools'

describe('groupBy', () => {
  const data = [
    { id: 1, name: 'Alice', age: 25, category: 'A' },
    { id: 2, name: 'Bob', age: 30, category: 'B' },
    { id: 3, name: 'Charlie', age: 25, category: 'A' },
    { id: 4, name: 'David', age: 35, category: 'B' },
  ]

  it('应该按指定键分组', () => {
    const result = groupBy(data, 'category', null, 'arr')

    expect(result).toEqual([
      {
        type: 'A',
        children: [
          { id: 1, name: 'Alice', age: 25, category: 'A' },
          { id: 3, name: 'Charlie', age: 25, category: 'A' },
        ],
      },
      {
        type: 'B',
        children: [
          { id: 2, name: 'Bob', age: 30, category: 'B' },
          { id: 4, name: 'David', age: 35, category: 'B' },
        ],
      },
    ])
  })

  it('应该按年龄分组并计算总和', () => {
    const result = groupBy(data, 'age', 'age', '+')

    expect(result).toEqual([
      { age: 50, category: 'A', id: 1, name: 'Alice' }, // 25 + 25
      { age: 30, category: 'B', id: 2, name: 'Bob' },
      { age: 35, category: 'B', id: 4, name: 'David' },
    ])
  })

  it('应该处理空数组', () => {
    const result = groupBy([], 'category', null, 'arr')
    expect(result).toEqual([])
  })
})

describe('arrToTree', () => {
  const data = [
    { id: 1, pid: 0, name: 'Root' },
    { id: 2, pid: 1, name: 'Child 1' },
    { id: 3, pid: 1, name: 'Child 2' },
    { id: 4, pid: 2, name: 'Grandchild 1' },
    { id: 5, pid: 0, name: 'Root 2' },
  ]

  it('应该将数组转换为树形结构', () => {
    const result = arrToTree(data)

    expect(result).toHaveLength(2) // 两个根节点
    expect(result[0].name).toBe('Root')
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children![0].name).toBe('Child 1')
    expect(result[0].children![0].children).toHaveLength(1)
  })

  it('应该使用自定义字段名', () => {
    const customData = [
      { key: 1, parentKey: 0, name: 'Root' },
      { key: 2, parentKey: 1, name: 'Child' },
    ]

    const result = arrToTree(customData, {
      idField: 'key',
      pidField: 'parentKey',
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Root')
    expect(result[0].children).toHaveLength(1)
  })

  it('应该处理空数组', () => {
    const result = arrToTree([])
    expect(result).toEqual([])
  })
})

describe('binarySearch', () => {
  const sortedArray = [1, 3, 5, 7, 9, 11, 13, 15]

  it('应该找到存在的值', () => {
    const result = binarySearch(sortedArray, 7)
    expect(result).toBe(3) // 索引3
  })

  it('应该返回 -1 当值不存在', () => {
    const result = binarySearch(sortedArray, 6)
    expect(result).toBe(-1)
  })

  it('应该处理边界值', () => {
    expect(binarySearch(sortedArray, 1)).toBe(0)
    expect(binarySearch(sortedArray, 15)).toBe(7)
  })

  it('应该使用自定义获取值函数', () => {
    const objects = [
      { id: 1, value: 10 },
      { id: 2, value: 20 },
      { id: 3, value: 30 },
    ]

    const result = binarySearch(objects, 20, item => item.value)
    expect(result).toBe(1)
  })
})

describe('bfsFind', () => {
  const treeData = [
    {
      id: 1,
      name: 'Root',
      children: [
        {
          id: 2,
          name: 'Child 1',
          children: [
            { id: 4, name: 'Grandchild 1', children: [] },
            { id: 5, name: 'Grandchild 2', children: [] },
          ],
        },
        {
          id: 3,
          name: 'Child 2',
          children: [
            { id: 6, name: 'Grandchild 3', children: [] },
          ],
        },
      ],
    },
  ]

  it('应该使用广度优先搜索找到节点', () => {
    const result = bfsFind(treeData, node => node.name === 'Grandchild 1')
    expect(result).toEqual({ id: 4, name: 'Grandchild 1', children: [] })
  })

  it('应该返回 null 当找不到节点', () => {
    const result = bfsFind(treeData, node => node.name === 'Not Found')
    expect(result).toBeNull()
  })

  it('应该处理空数组', () => {
    const result = bfsFind([], (node: any) => node.name === 'test')
    expect(result).toBeNull()
  })
})

describe('dfsFind', () => {
  const treeData = [
    {
      id: 1,
      name: 'Root',
      children: [
        {
          id: 2,
          name: 'Child 1',
          children: [
            { id: 4, name: 'Grandchild 1', children: [] },
            { id: 5, name: 'Grandchild 2', children: [] },
          ],
        },
        {
          id: 3,
          name: 'Child 2',
          children: [
            { id: 6, name: 'Grandchild 3', children: [] },
          ],
        },
      ],
    },
  ]

  it('应该使用深度优先搜索找到节点', () => {
    const result = dfsFind(treeData, node => node.name === 'Grandchild 3')
    expect(result).toEqual({ id: 6, name: 'Grandchild 3', children: [] })
  })

  it('应该返回 null 当找不到节点', () => {
    const result = dfsFind(treeData, node => node.name === 'Not Found')
    expect(result).toBeNull()
  })

  it('应该处理空数组', () => {
    const result = dfsFind([], (node: any) => node.name === 'test')
    expect(result).toBeNull()
  })
})
