import { describe, expect, it } from 'vitest'
import { StreamXmlParser } from '@/tools/StreamXmlParser'

/** 喂入若干数据块并取出当前结果 */
function parse(parser: StreamXmlParser, ...chunks: string[]) {
  for (const c of chunks) {
    parser.append(c)
  }
  return parser.getResult()
}

/** 把字符串按固定长度切块，模拟流式输入 */
function chunk(input: string, size: number): string[] {
  const out: string[] = []
  for (let i = 0; i < input.length; i += size) {
    out.push(input.slice(i, i + size))
  }
  return out
}

describe('streamXmlParser 基础解析', () => {
  it('应该解析扁平结构', () => {
    expect(parse(new StreamXmlParser(), '<name>张三</name><age>25</age>')).toEqual({
      name: '张三',
      age: '25',
    })
  })

  it('应该解析嵌套结构', () => {
    expect(parse(new StreamXmlParser(), '<a><b>x</b></a>')).toEqual({ a: { b: 'x' } })
  })

  it('应该解析多层嵌套', () => {
    expect(parse(new StreamXmlParser(), '<a><b><c>深</c></b></a>')).toEqual({
      a: { b: { c: '深' } },
    })
  })

  it('应该处理自闭合标签', () => {
    expect(parse(new StreamXmlParser(), '<a>x</a><br/><c>y</c>')).toEqual({
      a: 'x',
      br: '',
      c: 'y',
    })
  })

  it('应该丢弃根层级的裸文本', () => {
    expect(parse(new StreamXmlParser(), '前缀<a>x</a>后缀')).toEqual({ a: 'x' })
  })

  it('应该在有子节点时丢弃父节点的裸文本', () => {
    expect(parse(new StreamXmlParser(), '<a>前<b>y</b>后</a>')).toEqual({ a: { b: 'y' } })
  })

  it('应该支持中文标签名', () => {
    expect(parse(new StreamXmlParser(), '<姓名>张三</姓名>')).toEqual({ 姓名: '张三' })
  })

  it('应该把裸尖括号当作文本而非标签', () => {
    expect(parse(new StreamXmlParser(), '<expr>1 < 2</expr>')).toEqual({ expr: '1 < 2' })
  })
})

describe('streamXmlParser 接口契约', () => {
  it('append 不应返回值', () => {
    const parser = new StreamXmlParser()
    /** 序列化成本只在 getResult 付出，append 保持轻量 */
    expect(parser.append('<a>x</a>')).toBeUndefined()
  })

  it('getResult 应该可以重复调用且结果一致', () => {
    const parser = new StreamXmlParser()
    parser.append('<a>x</a>')

    expect(parser.getResult()).toEqual({ a: 'x' })
    expect(parser.getResult()).toEqual({ a: 'x' })
  })

  it('end 应该返回最终结果', () => {
    const parser = new StreamXmlParser()
    parser.append('<a>x</a>')

    expect(parser.end()).toEqual({ a: 'x' })
  })

  it('未调用 getResult 时解析仍应正常推进', () => {
    const parser = new StreamXmlParser({ arrayTags: ['item'] })

    for (const c of chunk('<list><item>a</item><item>b</item></list>', 3)) {
      parser.append(c)
    }

    expect(parser.getResult()).toEqual({ list: { item: ['a', 'b'] } })
  })
})

describe('streamXmlParser 数组声明', () => {
  it('声明为数组的标签即使只出现一次也是数组', () => {
    expect(parse(new StreamXmlParser({ arrayTags: ['item'] }), '<item>a</item>')).toEqual({
      item: ['a'],
    })
  })

  it('应该把重复标签收集为数组', () => {
    const parser = new StreamXmlParser({ arrayTags: ['item'] })
    expect(parse(parser, '<item>a</item><item>b</item><item>c</item>')).toEqual({
      item: ['a', 'b', 'c'],
    })
  })

  it('数组形状在流式过程中应始终稳定', () => {
    const parser = new StreamXmlParser({ arrayTags: ['item'] })

    /** 第一个元素到达时就已经是数组，消费方无需处理类型突变 */
    expect(parse(parser, '<list><item>a</item>')).toEqual({ list: { item: ['a'] } })
    expect(parse(parser, '<item>b</item>')).toEqual({ list: { item: ['a', 'b'] } })
    expect(parse(parser, '</list>')).toEqual({ list: { item: ['a', 'b'] } })
  })

  it('未声明的重复标签应后者覆盖前者', () => {
    const parser = new StreamXmlParser({ logger: null })
    expect(parse(parser, '<item>a</item><item>b</item>')).toEqual({ item: 'b' })
  })

  it('isArray 应该能根据路径区分同名标签', () => {
    const parser = new StreamXmlParser({
      isArray: (tag, stack) => tag === 'item' && stack.includes('list'),
    })

    expect(parse(parser, '<list><item>a</item></list><box><item>b</item></box>')).toEqual({
      list: { item: ['a'] },
      box: { item: 'b' },
    })
  })

  it('isArray 收到的 tagStack 应是不含自身的祖先链', () => {
    const seen: Array<[string, string[]]> = []
    const parser = new StreamXmlParser({
      isArray: (tag, stack) => {
        seen.push([tag, [...stack]])
        return false
      },
    })

    parser.append('<a><b><c>x</c></b></a>')
    expect(seen).toEqual([
      ['a', []],
      ['b', ['a']],
      ['c', ['a', 'b']],
    ])
  })

  it('数组元素应该支持嵌套对象', () => {
    const parser = new StreamXmlParser({ arrayTags: ['item'] })
    expect(parse(parser, '<item><k>1</k></item><item><k>2</k></item>')).toEqual({
      item: [{ k: '1' }, { k: '2' }],
    })
  })
})

describe('streamXmlParser 流式切块', () => {
  it('闭合标签被切开时内容不应重复累加', () => {
    /** 回归：旧实现产出 "hihi"，因为文本并入后没有截断缓冲区 */
    expect(parse(new StreamXmlParser(), '<a>hi</', 'a>')).toEqual({ a: 'hi' })
  })

  it('开始标签被切开时应正确解析', () => {
    expect(parse(new StreamXmlParser(), '<na', 'me>bob</name>')).toEqual({ name: 'bob' })
  })

  it('逐字符流式输入应与一次性输入结果一致', () => {
    const xml = '<list><item>a</item><item>b</item></list>'
    const once = parse(new StreamXmlParser({ arrayTags: ['item'] }), xml)
    const streamed = parse(new StreamXmlParser({ arrayTags: ['item'] }), ...xml.split(''))

    expect(streamed).toEqual(once)
  })

  it('任意切块尺寸下结果都应一致', () => {
    const xml = '<root><a>111</a><b><c>222</c></b><a>333</a></root>'
    const expected = parse(new StreamXmlParser({ logger: null }), xml)

    for (const size of [1, 2, 3, 5, 7, 11, 13]) {
      const streamed = parse(new StreamXmlParser({ logger: null }), ...chunk(xml, size))
      expect(streamed, `切块尺寸 ${size}`).toEqual(expected)
    }
  })

  it('未闭合标签的内容应随数据到达持续增长', () => {
    const parser = new StreamXmlParser()

    expect(parse(parser, '<msg>正在')).toEqual({ msg: '正在' })
    expect(parse(parser, '处理')).toEqual({ msg: '正在处理' })
    expect(parse(parser, '中</msg>')).toEqual({ msg: '正在处理中' })
  })
})

describe('streamXmlParser 容错', () => {
  it('游离的结束标签应被忽略且不卡死', () => {
    /** 回归：旧实现在此处陷入死循环 */
    const parser = new StreamXmlParser({ logger: null })

    expect(parse(parser, '</foo>')).toEqual({})
    expect(parse(parser, '<a>x</a>')).toEqual({ a: 'x' })
  })

  it('失配的结束标签应自动闭合中间层级', () => {
    const parser = new StreamXmlParser({ logger: null })
    expect(parse(parser, '<a><b>x</a>')).toEqual({ a: { b: 'x' } })
  })

  it('end 应该自动闭合所有未闭合标签', () => {
    const parser = new StreamXmlParser({ logger: null })
    parser.append('<a><b>x')

    expect(parser.end()).toEqual({ a: { b: 'x' } })
  })

  it('end 应该把残留的半截标签作为文本吐出', () => {
    const parser = new StreamXmlParser({ logger: null })
    parser.append('<a>x<b')

    expect(parser.end()).toEqual({ a: 'x<b' })
  })

  it('超过 maxDepth 的标签应被忽略且不影响外层结构', () => {
    const parser = new StreamXmlParser({ maxDepth: 2, logger: null })

    /** 超深子树整体丢弃，其中的文本不应泄漏到最后一个有效的祖先节点上 */
    expect(parse(parser, '<a><b><c><d>x</d></c></b></a>')).toEqual({ a: { b: '' } })
  })

  it('结束标签名含空白时仍应正确闭合', () => {
    /**
     * 回归：`</user name>` 若被判为非法标签名而当成文本，
     * `user` 会永不闭合，后续的兄弟节点被错误挂到它下面且内容丢失
     */
    expect(parse(new StreamXmlParser(), '<user name>张三</user name><age>25</age>')).toEqual({
      user: '张三',
      age: '25',
    })
  })

  it('标签名前后的空白应被裁剪', () => {
    expect(parse(new StreamXmlParser(), '< name >张三</ name >< age >25</ age >')).toEqual({
      name: '张三',
      age: '25',
    })
  })

  it('超深度时外层标签的结束符不应被吞掉', () => {
    /**
     * 回归：溢出区若用纯计数器记录，缺失结束标签的畸形输入会让外层合法的
     * </b>、</a> 被逐个吃掉，栈永远清不干净，后续兄弟节点被整段丢弃
     */
    const parser = new StreamXmlParser({ maxDepth: 2, logger: null })

    expect(parse(parser, '<a><b><c><d>x</b></a><sib>S</sib>')).toEqual({
      a: { b: '' },
      sib: 'S',
    })
  })

  it('超深度下结束标签缺失与否结果应一致', () => {
    const inputs = [
      '<a><b><c><d>x</b></a><sib>S</sib>',
      '<a><b><c>x</b></a><sib>S</sib>',
      '<a><b><c>x</c></b></a><sib>S</sib>',
    ]

    for (const xml of inputs) {
      const parser = new StreamXmlParser({ maxDepth: 2, logger: null })
      expect(parse(parser, xml), xml).toEqual({ a: { b: '' }, sib: 'S' })
    }
  })

  it('应该跳过注释', () => {
    expect(parse(new StreamXmlParser(), '<a>x<!-- 注释 -->y</a>')).toEqual({ a: 'xy' })
  })

  it('应该把 CDATA 当作纯文本', () => {
    expect(parse(new StreamXmlParser(), '<a><![CDATA[<b>不解析</b>]]></a>')).toEqual({
      a: '<b>不解析</b>',
    })
  })

  it('未闭合的注释应等待后续数据而非当作文本', () => {
    expect(parse(new StreamXmlParser(), '<a>x<!-- 注', '释 -->y</a>')).toEqual({ a: 'xy' })
  })

  it('未声明为数组的标签被覆盖时应告警', () => {
    const warns: Array<[string, unknown]> = []
    const parser = new StreamXmlParser({
      logger: { warn: (msg, ctx) => warns.push([msg, ctx]) },
    })

    /** 前一份数据被静默丢弃是最容易踩的坑，必须提示并指出解决办法 */
    expect(parse(parser, '<item>a</item><item>b</item>')).toEqual({ item: 'b' })
    expect(warns[0][0]).toContain('arrayTags')
    expect(warns[0][1]).toMatchObject({ tag: 'item', path: 'item' })
  })

  it('同一路径的重复覆盖只应告警一次', () => {
    const warns: string[] = []
    const parser = new StreamXmlParser({
      logger: { warn: msg => warns.push(msg) },
    })

    parse(parser, '<i>a</i><i>b</i><i>c</i><i>d</i>')
    expect(warns).toHaveLength(1)
  })

  it('告警路径应包含祖先链以便定位', () => {
    const warns: unknown[] = []
    const parser = new StreamXmlParser({
      logger: { warn: (_msg, ctx) => warns.push(ctx) },
    })

    parse(parser, '<a><b><i>1</i><i>2</i></b></a>')
    expect(warns[0]).toMatchObject({ path: 'a/b/i' })
  })

  it('已声明为数组的标签不应告警', () => {
    const warns: string[] = []
    const parser = new StreamXmlParser({
      arrayTags: ['item'],
      logger: { warn: msg => warns.push(msg) },
    })

    expect(parse(parser, '<item>a</item><item>b</item>')).toEqual({ item: ['a', 'b'] })
    expect(warns).toHaveLength(0)
  })

  it('logger 应该收到容错诊断信息', () => {
    const warns: string[] = []
    const parser = new StreamXmlParser({
      logger: { warn: msg => warns.push(msg) },
    })

    parser.append('</foo>')
    expect(warns).toContain('Unmatched closing tag ignored')
  })

  it('默认应通过 console 告警', () => {
    const original = console.warn
    const warns: string[] = []
    console.warn = (msg: string) => warns.push(msg)

    try {
      /** 告警对应着数据丢失，默认静音会让使用者拿到残缺结果而不自知 */
      new StreamXmlParser().append('<item>a</item><item>b</item>')
    }
    finally {
      console.warn = original
    }

    expect(warns[0]).toContain('arrayTags')
  })

  it('传 null 应完全静音', () => {
    const original = console.warn
    const warns: string[] = []
    console.warn = (msg: string) => warns.push(msg)

    try {
      new StreamXmlParser({ logger: null }).append('</foo><item>a</item><item>b</item>')
    }
    finally {
      console.warn = original
    }

    expect(warns).toHaveLength(0)
  })

  it('同类告警在畸形输入下不应刷屏', () => {
    const warns: string[] = []
    const parser = new StreamXmlParser({
      maxDepth: 1,
      logger: { warn: msg => warns.push(msg) },
    })

    /** 每个超深标签都会触发，不去重就是无上限的输出 */
    parser.append('<a><b><c><d><e><f><g>x</g></f></e></d></c></b></a>')
    expect(warns).toHaveLength(1)
  })
})

describe('streamXmlParser 属性与文本节点', () => {
  it('默认应剥离并忽略属性', () => {
    expect(parse(new StreamXmlParser(), '<a id="1" type="x">v</a>')).toEqual({ a: 'v' })
  })

  it('开启 parseAttrs 后属性应带前缀', () => {
    expect(parse(new StreamXmlParser({ parseAttrs: true }), '<a id="1">v</a>')).toEqual({
      a: { '@id': '1', '#text': 'v' },
    })
  })

  it('应该支持单引号、无引号与无值属性', () => {
    const parser = new StreamXmlParser({ parseAttrs: true })
    expect(parse(parser, '<a p1=\'x\' p2=y p3>v</a>')).toEqual({
      a: { '@p1': 'x', '@p2': 'y', '@p3': '', '#text': 'v' },
    })
  })

  it('属性值含 > 时不应截断标签', () => {
    /**
     * 回归：XML 规范允许属性值出现未转义的 >（只有 < 与 & 必须转义），
     * 直接 indexOf('>') 会把标签截断，属性内容污染文本值。
     * 这条走默认配置，不开 parseAttrs 也会中招
     */
    expect(parse(new StreamXmlParser(), '<cond expr="a > b">yes</cond>')).toEqual({
      cond: 'yes',
    })
  })

  it('属性值含 > 时应完整保留属性', () => {
    const parser = new StreamXmlParser({ parseAttrs: true })
    expect(parse(parser, '<a cmp="x>y">t</a>')).toEqual({
      a: { '@cmp': 'x>y', '#text': 't' },
    })
  })

  it('单引号属性值含 > 同样不应截断', () => {
    expect(parse(new StreamXmlParser(), '<a x=\'a>b\'>t</a>')).toEqual({ a: 't' })
  })

  it('属性值只有一个 > 时也应正确解析', () => {
    expect(parse(new StreamXmlParser(), '<a x=">">t</a>')).toEqual({ a: 't' })
  })

  it('属性值里的 > 被切块分开时应等待后续数据', () => {
    expect(parse(new StreamXmlParser(), '<cond expr="a >', ' b">yes</cond>')).toEqual({
      cond: 'yes',
    })
  })

  it('应该支持自定义前缀与文本键名', () => {
    const parser = new StreamXmlParser({
      parseAttrs: true,
      attrPrefix: '$',
      textKey: '_value',
    })

    expect(parse(parser, '<a id="1">v</a>')).toEqual({ a: { $id: '1', _value: 'v' } })
  })

  it('关闭 simplifyTextNode 后叶子节点应统一为对象', () => {
    expect(parse(new StreamXmlParser({ simplifyTextNode: false }), '<a>x</a>')).toEqual({
      a: { '#text': 'x' },
    })
  })
})

describe('streamXmlParser 状态管理', () => {
  it('reset 应该清空所有状态', () => {
    const parser = new StreamXmlParser()

    expect(parse(parser, '<a>x</a>')).toEqual({ a: 'x' })

    parser.reset()
    expect(parser.getResult()).toEqual({})

    expect(parse(parser, '<b>y</b>')).toEqual({ b: 'y' })
  })

  it('reset 应该清空未消费的缓冲区', () => {
    const parser = new StreamXmlParser()

    parser.append('<a>x')
    parser.reset()

    expect(parse(parser, '<b>y</b>')).toEqual({ b: 'y' })
  })

  it('getResult 不应受外部修改影响', () => {
    const parser = new StreamXmlParser()
    parser.append('<a><b>x</b></a>')

    const first = parser.getResult() as any
    first.a.b = '被篡改'

    expect(parser.getResult()).toEqual({ a: { b: 'x' } })
  })

  it('纯文本输入应返回空对象', () => {
    expect(parse(new StreamXmlParser(), '这是纯文本，没有标签')).toEqual({})
  })
})
