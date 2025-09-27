import type { ParseMDCodeOpts } from './types'

/** 代码类型别名映射 */
const CODE_TYPE_ALIAS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  hs: 'haskell',
  pl: 'perl',
  yml: 'yaml',
  jsonlines: 'jsonl',
  csharp: 'c#',
  golang: 'go',
  bash: 'shell',
  sh: 'shell',
  plain: 'text',
  config: 'conf',
} as const

/** 预编译的正则表达式 */
const CODE_BLOCK_REGEX = /```(\w*)\n([\s\S]*?)```/g
const TILDE_FENCE_REGEX = /~~~(\w*)\n([\s\S]*?)~~~/g
const INLINE_CODE_REGEX = /`([^`\n]+)`/g

/**
 * 解析 markdown 格式的代码块，支持任意代码块，返回数组
 *
 * @param content - markdown 内容
 * @param opts - 解析选项
 * @returns 匹配的代码块内容数组
 *
 * @example
 * ```typescript
 * const content = `\`\`\`typescript
 * const hello = 'world'
 * \`\`\``
 *
 * const codes = parseMDCode(content, { codeType: 'ts' })
 * console.log(codes) // ['const hello = \'world\'']
 * ```
 */
export function parseMDCode(content: string, opts: ParseMDCodeOpts): string[] {
  if (!content || typeof content !== 'string') {
    return []
  }

  const {
    codeType,
    strictMatchCodeType = false,
    includeInlineCode = false,
    supportTildeFence = false,
  } = opts

  if (!codeType) {
    return []
  }

  const results: string[] = []

  /** 解析标准代码块（```） */
  const codeBlocks = parseCodeBlocks(
    content,
    codeType,
    strictMatchCodeType,
    CODE_BLOCK_REGEX,
  )
  results.push(...codeBlocks)

  /** 解析波浪号围栏代码块（~~~） */
  if (supportTildeFence) {
    const tildeBlocks = parseCodeBlocks(
      content,
      codeType,
      strictMatchCodeType,
      TILDE_FENCE_REGEX,
    )
    results.push(...tildeBlocks)
  }

  /** 解析行内代码（`） */
  if (includeInlineCode) {
    const inlineCodes = parseInlineCode(
      content,
      codeType,
      strictMatchCodeType,
    )
    results.push(...inlineCodes)
  }

  return results
}

/**
 * 标准化代码类型名称
 */
function normalizeCodeType(type: string): string {
  return CODE_TYPE_ALIAS[type] || type
}

/**
 * 检查代码类型是否匹配
 */
function isCodeTypeMatch(
  language: string,
  targetType: string,
  strictMatch: boolean,
): boolean {
  if (strictMatch) {
    return language === targetType
  }

  const normalizedLanguage = normalizeCodeType(language)
  const normalizedTarget = normalizeCodeType(targetType)

  return normalizedLanguage === normalizedTarget
    || language === targetType
    || normalizedLanguage === targetType
}

/**
 * 解析代码块内容
 */
function parseCodeBlocks(
  content: string,
  codeType: string,
  strictMatch: boolean,
  regex: RegExp,
): string[] {
  const results: string[] = []
  const matches = content.matchAll(regex)

  for (const match of matches) {
    const [, language, code] = match

    /** 如果没有指定语言，跳过 */
    if (!language) {
      continue
    }

    if (isCodeTypeMatch(language, codeType, strictMatch)) {
      results.push(code.trim())
    }
  }

  return results
}

/**
 * 解析行内代码
 */
function parseInlineCode(
  content: string,
  codeType: string,
  strictMatch: boolean,
): string[] {
  const results: string[] = []
  const matches = content.matchAll(INLINE_CODE_REGEX)

  for (const match of matches) {
    const [, code] = match
    /**
     * 对于行内代码，我们假设它们匹配目标类型
     * 因为行内代码通常没有语言标识
     */
    results.push(code.trim())
  }

  return results
}
