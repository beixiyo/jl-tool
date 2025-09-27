export type ParseMDCodeOpts = {
  /** 要匹配的代码类型 */
  codeType: CodeType
  /**
   * 严格匹配代码类型，不匹配潜在的代码类型别名。
   * 如果关闭，js 会匹配到 javascript，ts 会匹配到 typescript
   * @default false
   */
  strictMatchCodeType?: boolean
  /**
   * 是否包含行内代码（单个反引号包围的代码）
   * @default false
   */
  includeInlineCode?: boolean
  /**
   * 是否支持波浪号围栏代码块（~~~）
   * @default false
   */
  supportTildeFence?: boolean
}

/** 支持的代码类型 */
export type CodeType =
  | 'json'
  | 'js'
  | 'ts'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'markdown'
  | 'shell'
  | 'bash'
  | 'sh'
  | 'python'
  | 'py'
  | 'java'
  | 'c'
  | 'c++'
  | 'cpp'
  | 'c#'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'rb'
  | 'go'
  | 'golang'
  | 'rust'
  | 'rs'
  | 'scala'
  | 'kotlin'
  | 'kt'
  | 'swift'
  | 'dart'
  | 'elixir'
  | 'erlang'
  | 'haskell'
  | 'hs'
  | 'ocaml'
  | 'perl'
  | 'pl'
  | 'text'
  | 'plain'
  | 'sql'
  | 'xml'
  | 'yaml'
  | 'yml'
  | 'toml'
  | 'ini'
  | 'conf'
  | 'config'
  | 'log'
  | 'csv'
  | 'tsv'
  | 'jsonl'
  | 'jsonlines'
  | (string & {})
