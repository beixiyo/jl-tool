import { describe, it, expect, expectTypeOf } from 'vitest'
import type { ParseMDCodeOpts, CodeType } from '@/markdown/types'

describe('markdown types', () => {
  describe('ParseMDCodeOpts', () => {
    it('应该有正确的类型结构', () => {
      const opts: ParseMDCodeOpts = {
        codeType: 'typescript',
        strictMatchCodeType: false,
        includeInlineCode: false,
        supportTildeFence: false
      }

      expectTypeOf(opts.codeType).toBeString()
      expectTypeOf(opts.strictMatchCodeType).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(opts.includeInlineCode).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(opts.supportTildeFence).toEqualTypeOf<boolean | undefined>()
    })

    it('应该要求 codeType 是必需的', () => {
      // @ts-expect-error - codeType 是必需的
      const invalidOpts: ParseMDCodeOpts = {
        strictMatchCodeType: false
      }
    })

    it('应该允许所有可选属性', () => {
      const minimalOpts: ParseMDCodeOpts = {
        codeType: 'typescript'
      }

      const fullOpts: ParseMDCodeOpts = {
        codeType: 'typescript',
        strictMatchCodeType: true,
        includeInlineCode: true,
        supportTildeFence: true
      }

      expectTypeOf(minimalOpts).toMatchTypeOf<ParseMDCodeOpts>()
      expectTypeOf(fullOpts).toMatchTypeOf<ParseMDCodeOpts>()
    })
  })

  describe('CodeType', () => {
    it('应该支持所有预定义的代码类型', () => {
      const validTypes: CodeType[] = [
        'json',
        'js',
        'ts',
        'javascript',
        'typescript',
        'html',
        'css',
        'markdown',
        'shell',
        'bash',
        'sh',
        'python',
        'py',
        'java',
        'c',
        'c++',
        'cpp',
        'c#',
        'csharp',
        'php',
        'ruby',
        'rb',
        'go',
        'golang',
        'rust',
        'rs',
        'scala',
        'kotlin',
        'kt',
        'swift',
        'dart',
        'elixir',
        'erlang',
        'haskell',
        'hs',
        'ocaml',
        'perl',
        'pl',
        'text',
        'plain',
        'sql',
        'xml',
        'yaml',
        'yml',
        'toml',
        'ini',
        'conf',
        'config',
        'log',
        'csv',
        'tsv',
        'jsonl',
        'jsonlines'
      ]

      validTypes.forEach(type => {
        expectTypeOf(type).toMatchTypeOf<CodeType>()
      })
    })

    it('应该支持任意字符串类型', () => {
      const customType: CodeType = 'custom-language'
      expectTypeOf(customType).toMatchTypeOf<CodeType>()
    })

    it('应该正确推断类型', () => {
      const getCodeType = (type: string): CodeType => type as CodeType

      const result = getCodeType('typescript')
      expectTypeOf(result).toMatchTypeOf<CodeType>()
    })
  })

  describe('类型兼容性', () => {
    it('ParseMDCodeOpts 应该与函数参数兼容', () => {
      const parseFunction = (content: string, opts: ParseMDCodeOpts) => {
        return opts.codeType
      }

      const result = parseFunction('test', {
        codeType: 'typescript',
        strictMatchCodeType: true
      })

      expectTypeOf(result).toBeString()
    })

    it('应该支持类型推断', () => {
      const createOpts = <T extends CodeType>(codeType: T, options?: Partial<Omit<ParseMDCodeOpts, 'codeType'>>): ParseMDCodeOpts => ({
        codeType,
        ...options
      })

      const opts = createOpts('typescript', { strictMatchCodeType: true })
      expectTypeOf(opts.codeType).toEqualTypeOf<CodeType>()
      expectTypeOf(opts.strictMatchCodeType).toEqualTypeOf<boolean | undefined>()
    })
  })

  describe('类型约束', () => {
    it('应该正确约束可选属性', () => {
      const opts: ParseMDCodeOpts = {
        codeType: 'typescript'
      }

      // 这些应该都是可选的
      expectTypeOf(opts.strictMatchCodeType).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(opts.includeInlineCode).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(opts.supportTildeFence).toEqualTypeOf<boolean | undefined>()
    })

    it('应该支持部分类型', () => {
      const partialOpts: Partial<ParseMDCodeOpts> = {
        strictMatchCodeType: true
      }

      expectTypeOf(partialOpts.codeType).toEqualTypeOf<CodeType | undefined>()
      expectTypeOf(partialOpts.strictMatchCodeType).toEqualTypeOf<boolean | undefined>()
    })
  })
})
