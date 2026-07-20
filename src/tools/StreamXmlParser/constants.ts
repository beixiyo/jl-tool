/**
 * 流式 XML 解析器的默认配置
 *
 * 属性与文本的命名跟随 `fast-xml-parser` 的事实标准，
 * 便于使用者复用已有的心智模型
 */
export const DEFAULT_ATTR_PREFIX = '@'

export const DEFAULT_TEXT_KEY = '#text'

export const DEFAULT_MAX_DEPTH = 100

/**
 * 合法标签名：以字母或下划线开头，允许 Unicode 字母以支持中文标签
 *
 * 用于把 `1 < 2` 这类裸尖括号判定为普通文本而非标签
 */
export const TAG_NAME_RE = /^[\p{L}_][\p{L}\p{N}_.\-:]*$/u

/**
 * 属性匹配：支持双引号、单引号、无引号以及无值的布尔属性
 */
export const ATTR_RE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
