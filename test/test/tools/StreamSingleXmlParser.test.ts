import { describe, expect, it } from 'vitest'
import { StreamSingleXmlParser } from '@/tools/StreamSingleXmlParser'

describe('StreamSingleXmlParser', () => {
  it('应该能解析完整的 XML 标签', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<name>张三</name><age>25</age><email>zhangsan@example.com</email>'

    const result = parser.append(xml)

    expect(result).toEqual({
      name: '张三',
      age: '25',
      email: 'zhangsan@example.com'
    })
  })

  it('应该能处理分块接收的 XML', () => {
    const parser = new StreamSingleXmlParser()

    // 第一块 - 不完整的标签
    let result = parser.append('<name>李四')
    expect(result).toEqual({ name: '李四' })

    // 第二块 - 完成第一个标签，开始第二个标签
    result = parser.append(' Doe</name><age>30')
    expect(result).toEqual({ name: '李四 Doe', age: '30' })

    // 第三块 - 完成第二个标签
    result = parser.append('</age>')
    expect(result).toEqual({ name: '李四 Doe', age: '30' })
  })

  it('应该能处理自闭合标签', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<name>王五</name><br/><email>wangwu@example.com</email>'

    const result = parser.append(xml)

    expect(result).toEqual({
      name: '王五',
      br: '',
      email: 'wangwu@example.com'
    })
  })

  it('应该能处理不完整的自闭合标签', () => {
    const parser = new StreamSingleXmlParser()

    // 不完整的自闭合标签
    let result = parser.append('<name>测试</name><br')
    expect(result).toEqual({ name: '测试' })

    // 完成自闭合标签
    result = parser.append('/>')
    expect(result).toEqual({ name: '测试', br: '' })
  })

  it('应该能处理标签内容中的空格和换行', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<message>  这是一条消息  \n  包含换行  </message>'

    const result = parser.append(xml)

    expect(result).toEqual({
      message: '  这是一条消息  \n  包含换行  '
    })
  })

  it('应该能处理多个相同标签名', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<item>商品1</item><item>商品2</item><item>商品3</item>'

    const result = parser.append(xml)

    // 注意：相同标签名会覆盖，这是单层解析器的特性
    expect(result).toEqual({ item: '商品3' })
  })

  it('应该能处理空标签', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<name></name><description>描述</description>'

    const result = parser.append(xml)

    expect(result).toEqual({
      name: '',
      description: '描述'
    })
  })

  it('应该能处理标签名包含空格的情况', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<user name>张三</user name><age>25</age>'

    const result = parser.append(xml)

    expect(result).toEqual({
      'user name': '张三',
      age: '25'
    })
  })

  it('应该能处理复杂的流式输入', () => {
    const parser = new StreamSingleXmlParser()

    // 模拟 AI 流式输出
    const chunks = [
      '<response>正在处理您的请求',
      '...</response><status>processing',
      '</status><progress>50</progress>'
    ]

    let result = parser.append(chunks[0])
    expect(result).toEqual({ response: '正在处理您的请求' })

    result = parser.append(chunks[1])
    expect(result).toEqual({
      response: '正在处理您的请求...',
      status: 'processing'
    })

    result = parser.append(chunks[2])
    expect(result).toEqual({
      response: '正在处理您的请求...',
      status: 'processing',
      progress: '50'
    })
  })

  it('应该能正确重置解析器状态', () => {
    const parser = new StreamSingleXmlParser()

    // 解析一些数据
    parser.append('<name>张三</name><age>25</age>')
    expect(parser.getResult()).toEqual({ name: '张三', age: '25' })

    // 重置
    parser.reset()
    expect(parser.getResult()).toEqual({})

    // 重新解析
    const result = parser.append('<email>test@example.com</email>')
    expect(result).toEqual({ email: 'test@example.com' })
  })

  it('应该能处理纯文本内容（无标签）', () => {
    const parser = new StreamSingleXmlParser()
    const text = '这是纯文本内容，没有 XML 标签'

    const result = parser.append(text)

    expect(result).toEqual({})
  })

  it('应该能处理混合内容', () => {
    const parser = new StreamSingleXmlParser()
    const content = '前缀文本<name>张三</name>中间文本<age>25</age>后缀文本'

    const result = parser.append(content)

    expect(result).toEqual({
      name: '张三',
      age: '25'
    })
  })

  it('应该能处理标签名包含特殊字符', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<user-name>张三</user-name><user_age>25</user_age>'

    const result = parser.append(xml)

    expect(result).toEqual({
      'user-name': '张三',
      user_age: '25'
    })
  })

  it('应该能处理非常长的标签内容', () => {
    const parser = new StreamSingleXmlParser()
    const longContent = 'a'.repeat(10000)
    const xml = `<content>${longContent}</content>`

    const result = parser.append(xml)

    expect(result).toEqual({
      content: longContent
    })
  })

  it('应该能处理标签内容为空的情况', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<empty></empty><filled>有内容</filled>'

    const result = parser.append(xml)

    expect(result).toEqual({
      empty: '',
      filled: '有内容'
    })
  })

  it('应该能处理连续的自闭合标签', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '<br/><hr/><img/><div>内容</div>'

    const result = parser.append(xml)

    expect(result).toEqual({
      br: '',
      hr: '',
      img: '',
      div: '内容'
    })
  })

  it('应该能处理标签名前后有空格的情况', () => {
    const parser = new StreamSingleXmlParser()
    const xml = '< name >张三</ name >< age >25</ age >'

    const result = parser.append(xml)

    expect(result).toEqual({
      ' name ': '张三',
      ' age ': '25'
    })
  })
})
