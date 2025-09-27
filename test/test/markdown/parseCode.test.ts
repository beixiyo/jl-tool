import { describe, it, expect } from 'vitest'
import { parseMDCode } from '../../../src/markdown/parseCode'

describe('parseMDCode', () => {
  describe('基本功能', () => {
    it('应该解析基本的代码块', () => {
      const content = `\`\`\`typescript
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('应该解析多个代码块', () => {
      const content = `\`\`\`typescript
const hello = 'world'
\`\`\`

\`\`\`typescript
const foo = 'bar'
\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual([
        'const hello = \'world\'',
        'const foo = \'bar\''
      ])
    })

    it('应该只返回匹配的代码类型', () => {
      const content = `\`\`\`typescript
const hello = 'world'
\`\`\`

\`\`\`javascript
const foo = 'bar'
\`\`\`

\`\`\`python
print('hello')
\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual(['const hello = \'world\''])
    })
  })

  describe('别名匹配', () => {
    it('应该支持 js -> javascript 别名', () => {
      const content = `\`\`\`js
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, { codeType: 'javascript' })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('应该支持 ts -> typescript 别名', () => {
      const content = `\`\`\`ts
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, { codeType: 'typescript' })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('应该支持 py -> python 别名', () => {
      const content = `\`\`\`py
print('hello')
\`\`\``

      const result = parseMDCode(content, { codeType: 'python' })
      expect(result).toEqual(['print(\'hello\')'])
    })

    it('应该支持 rb -> ruby 别名', () => {
      const content = `\`\`\`rb
puts "hello"
\`\`\``

      const result = parseMDCode(content, { codeType: 'ruby' })
      expect(result).toEqual(['puts "hello"'])
    })

    it('应该支持 rs -> rust 别名', () => {
      const content = `\`\`\`rs
println!("hello");
\`\`\``

      const result = parseMDCode(content, { codeType: 'rust' })
      expect(result).toEqual(['println!("hello");'])
    })

    it('应该支持 yml -> yaml 别名', () => {
      const content = `\`\`\`yml
name: test
\`\`\``

      const result = parseMDCode(content, { codeType: 'yaml' })
      expect(result).toEqual(['name: test'])
    })
  })

  describe('严格匹配', () => {
    it('严格匹配模式下应该只匹配完全相同的类型', () => {
      const content = `\`\`\`js
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, {
        codeType: 'javascript',
        strictMatchCodeType: true
      })
      expect(result).toEqual([])
    })

    it('严格匹配模式下应该匹配完全相同的类型', () => {
      const content = `\`\`\`javascript
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, {
        codeType: 'javascript',
        strictMatchCodeType: true
      })
      expect(result).toEqual(['const hello = \'world\''])
    })
  })

  describe('波浪号围栏', () => {
    it('应该支持波浪号围栏代码块', () => {
      const content = `~~~typescript
const hello = 'world'
~~~`

      const result = parseMDCode(content, {
        codeType: 'typescript',
        supportTildeFence: true
      })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('默认情况下不应该解析波浪号围栏', () => {
      const content = `~~~
const hello = 'world'
~~~`

      const result = parseMDCode(content, {
        codeType: 'typescript'
      })
      expect(result).toEqual([])
    })

    it('应该同时支持反引号和波浪号围栏', () => {
      const content = `\`\`\`typescript
const hello = 'world'
\`\`\`

~~~typescript
const foo = 'bar'
~~~`

      const result = parseMDCode(content, {
        codeType: 'typescript',
        supportTildeFence: true
      })
      expect(result).toEqual([
        'const hello = \'world\'',
        'const foo = \'bar\''
      ])
    })
  })

  describe('行内代码', () => {
    it('应该支持行内代码', () => {
      const content = `这是一个 \`const hello = 'world'\` 行内代码`

      const result = parseMDCode(content, {
        codeType: 'typescript',
        includeInlineCode: true
      })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('默认情况下不应该解析行内代码', () => {
      const content = `这是一个 \`const hello = 'world'\` 行内代码`

      const result = parseMDCode(content, {
        codeType: 'typescript'
      })
      expect(result).toEqual([])
    })

    it('应该解析多个行内代码', () => {
      const content = `这里有 \`const a = 1\` 和 \`const b = 2\` 两个行内代码`

      const result = parseMDCode(content, {
        codeType: 'typescript',
        includeInlineCode: true
      })
      expect(result).toEqual(['const a = 1', 'const b = 2'])
    })

    it('应该同时支持代码块和行内代码', () => {
      const content = `\`\`\`typescript
const hello = 'world'
\`\`\`

这里有 \`const foo = 'bar'\` 行内代码`

      const result = parseMDCode(content, {
        codeType: 'typescript',
        includeInlineCode: true
      })
      expect(result).toEqual([
        'const hello = \'world\'',
        'const foo = \'bar\''
      ])
    })
  })

  describe('边界情况', () => {
    it('应该处理空内容', () => {
      const result = parseMDCode('', { codeType: 'typescript' })
      expect(result).toEqual([])
    })

    it('应该处理 null 输入', () => {
      const result = parseMDCode(null as any, { codeType: 'typescript' })
      expect(result).toEqual([])
    })

    it('应该处理 undefined 输入', () => {
      const result = parseMDCode(undefined as any, { codeType: 'typescript' })
      expect(result).toEqual([])
    })

    it('应该处理非字符串输入', () => {
      const result = parseMDCode(123 as any, { codeType: 'typescript' })
      expect(result).toEqual([])
    })

    it('应该处理没有 codeType 的情况', () => {
      const content = `\`\`\`typescript
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, { codeType: '' as any })
      expect(result).toEqual([])
    })

    it('应该处理没有语言标识的代码块', () => {
      const content = `\`\`\`
const hello = 'world'
\`\`\``

      const result = parseMDCode(content, { codeType: 'typescript' })
      expect(result).toEqual([])
    })

    it('应该处理不匹配的代码类型', () => {
      const content = `\`\`\`python
print('hello')
\`\`\``

      const result = parseMDCode(content, { codeType: 'typescript' })
      expect(result).toEqual([])
    })
  })

  describe('代码内容处理', () => {
    it('应该正确去除代码块前后的空白', () => {
      const content = `\`\`\`typescript

const hello = 'world'

\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('应该保留代码内部的空白和换行', () => {
      const content = `\`\`\`typescript
const hello = 'world'
const foo = 'bar'
\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual(['const hello = \'world\'\nconst foo = \'bar\''])
    })

    it('应该处理包含反引号的代码', () => {
      const content = `\`\`\`typescript
const template = \`hello \${name}\`
\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual(['const template = `hello ${name}`'])
    })
  })

  describe('复杂场景', () => {
    it('应该处理混合的代码块和普通文本', () => {
      const content = `这是一个文档

\`\`\`typescript
const hello = 'world'
\`\`\`

更多文本

\`\`\`javascript
const foo = 'bar'
\`\`\`

结束`

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toEqual(['const hello = \'world\''])
    })

    it('应该处理嵌套的代码块', () => {
      const content = `\`\`\`typescript
const code = \`\`\`typescript
const nested = 'code'
\`\`\`
\`\`\``

      const result = parseMDCode(content, { codeType: 'ts' })
      expect(result).toHaveLength(1)
      expect(result[0]).toContain('const code =')
    })

    it('应该处理所有选项的组合', () => {
      const content = `\`\`\`typescript
const block1 = 'code'
\`\`\`

~~~typescript
const block2 = 'code'
~~~

这里有 \`const inline = 'code'\` 行内代码`

      const result = parseMDCode(content, {
        codeType: 'ts',
        strictMatchCodeType: false,
        includeInlineCode: true,
        supportTildeFence: true
      })
      expect(result).toEqual([
        'const block1 = \'code\'',
        'const block2 = \'code\'',
        'const inline = \'code\''
      ])
    })
  })
})
