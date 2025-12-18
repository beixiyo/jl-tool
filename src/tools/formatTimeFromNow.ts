import type { TimeType } from '@/types/base'

const TIME_FROM_NOW_DESC_MAP: Record<FormatTimeFromNowLanguage, Record<FormatTimeFromNowDesc, string>> = {
  'en-US': {
    year: 'year',
    month: 'month',
    day: 'day',
    hour: 'hour',
    minute: 'minute',
    second: 'second',
    justNow: 'just now',
  },
  'zh-CN': {
    year: '年',
    month: '个月',
    day: '天',
    hour: '小时',
    minute: '分钟',
    second: '秒',
    justNow: '刚刚',
  },
  'ja-JP': {
    year: '年',
    month: 'ヶ月',
    day: '日',
    hour: '時間',
    minute: '分',
    second: '秒',
    justNow: 'たった今',
  },
  'ko-KR': {
    year: '년',
    month: '개월',
    day: '일',
    hour: '시간',
    minute: '분',
    second: '초',
    justNow: '방금 전',
  },
  'es-ES': {
    year: 'año',
    month: 'mes',
    day: 'día',
    hour: 'hora',
    minute: 'minuto',
    second: 'segundo',
    justNow: 'justo ahora',
  },
  'fr-FR': {
    year: 'année',
    month: 'mois',
    day: 'jour',
    hour: 'heure',
    minute: 'minute',
    second: 'seconde',
    justNow: 'juste maintenant',
  },
  'de-DE': {
    year: 'Jahr',
    month: 'Monat',
    day: 'Tag',
    hour: 'Stunde',
    minute: 'Minute',
    second: 'Sekunde',
    justNow: 'gerade eben',
  },
}

const TIME_FROM_NOW_TRANSLATE_MAP: Record<FormatTimeFromNowLanguage, Record<string, string>> = {
  'zh-CN': {
    ago: '前',
    in: '后',
  },
  'en-US': {
    ago: 'ago',
    in: 'in',
  },
  'ja-JP': {
    ago: '前',
    in: '後',
  },
  'ko-KR': {
    ago: '전',
    in: '후',
  },
  'es-ES': {
    ago: '前',
    in: '後',
  },
  'fr-FR': {
    ago: '前',
    in: '後',
  },
  'de-DE': {
    ago: '前',
    in: '後',
  },
}

const SUPPORTED_LANGS = Object.keys(TIME_FROM_NOW_DESC_MAP) as FormatTimeFromNowLanguage[]

const DEFAULT_LANG: FormatTimeFromNowLanguage = 'zh-CN'

const DETAIL_MAP: Array<{ desc: FormatTimeFromNowDesc, gap: number }> = [
  { desc: 'year', gap: 3600 * 24 * 365 * 1e3 },
  { desc: 'month', gap: 3600 * 24 * 30 * 1e3 },
  { desc: 'day', gap: 3600 * 24 * 1e3 },
  { desc: 'hour', gap: 3600 * 1e3 },
  { desc: 'minute', gap: 60 * 1e3 },
  { desc: 'second', gap: 1 * 1e3 },
  { desc: 'justNow', gap: 0 },
]

function normalizeLanguage(language?: FormatTimeFromNowLanguage): FormatTimeFromNowLanguage {
  if (!language)
    return DEFAULT_LANG

  if (SUPPORTED_LANGS.includes(language))
    return language

  return DEFAULT_LANG
}

function getDescByLanguage(language: FormatTimeFromNowLanguage, desc: FormatTimeFromNowDesc) {
  const lang = normalizeLanguage(language)
  const map = TIME_FROM_NOW_DESC_MAP[lang] || TIME_FROM_NOW_DESC_MAP[DEFAULT_LANG]

  return map[desc] ?? TIME_FROM_NOW_DESC_MAP[DEFAULT_LANG][desc]
}

function getTranslateByLanguage(language: FormatTimeFromNowLanguage, type: 'ago' | 'in') {
  const lang = normalizeLanguage(language)
  const map = TIME_FROM_NOW_TRANSLATE_MAP[lang]

  if (!map)
    return TIME_FROM_NOW_TRANSLATE_MAP[DEFAULT_LANG][type]

  return map[type] ?? TIME_FROM_NOW_TRANSLATE_MAP[DEFAULT_LANG][type]
}

/**
 * 描述传入日期相对于当前时间的口头说法
 * 例如：刚刚、1分钟前、1小时前、1天前、1个月前、1年前...
 * @param date 需要计算时间间隔的日期
 * @example
 * ```ts
 * console.log(formatTimeFromNow()) // 刚刚
 * ```
 */
export function formatTimeFromNow(date?: TimeType, opts: FormatTimeFromNowOpts = {}) {
  const {
    afterFn,
    beforeFn,
    fallback = '--',
    language = DEFAULT_LANG,
    shouldFormat,
  } = opts
  let isFuture = false
  const rawDate = date ?? Date.now()
  let time = Date.now() - new Date(rawDate).getTime()

  const defaultBeforeFn = (str: string) => {
    const lang = normalizeLanguage(language)
    const before = getTranslateByLanguage(lang, 'ago')

    if (lang === 'en-US')
      return `${str.trim()} ${before}`

    return `${str}${before}`
  }

  const defaultAfterFn = (str: string) => {
    const lang = normalizeLanguage(language)
    const after = getTranslateByLanguage(lang, 'in')

    if (lang === 'en-US')
      return `${after} ${str.trim()}`

    return `${str}${after}`
  }

  if (Number.isNaN(time))
    return fallback
  const lang = normalizeLanguage(language)
  const absTime = Math.abs(time)

  if (absTime < 1e3) {
    /** 小于 1 秒都返回 "刚刚" / "just now" */
    return getDescByLanguage(lang, 'justNow')
  }

  if (typeof shouldFormat === 'function' && !shouldFormat(absTime, rawDate))
    return rawDate

  if (time < 0) {
    isFuture = true
    time = -time
  }

  for (let i = 0; i < DETAIL_MAP.length; i++) {
    const { desc, gap } = DETAIL_MAP[i]
    if (time >= gap) {
      const v = Math.floor(time / gap)
      const str = `${v}${getDescByLanguage(lang, desc)}`
      if (isFuture)
        return (afterFn || defaultAfterFn)(str)

      return (beforeFn || defaultBeforeFn)(str)
    }
  }

  /** 这行实际上不会执行到，但为了类型安全保留 */
  return fallback
}

/**
 * @deprecated 请使用 `formatTimeFromNow` 代替
 */
export const timeGap = formatTimeFromNow

export type FormatTimeFromNowOpts = {
  /**
   * 当传入时间非法或无法计算间隔时返回的兜底文案
   * @default '--'
   */
  fallback?: string
  /**
   * 「过去」时间的最终文案拼接函数
   * 例如把 `1天` 处理成 `1天前`，默认会根据 language 自动加上「前 / ago」
   */
  beforeFn?: (dateStr: string) => string
  /**
   * 「未来」时间的最终文案拼接函数
   * 例如把 `1天` 处理成 `1天后`，默认会根据 language 自动加上「后 / in」
   */
  afterFn?: (dateStr: string) => string
  /**
   * 文案语言，用于单位与「前 / 后」等词的本地化
   * @default 'zh-cn'
   */
  language?: FormatTimeFromNowLanguage
  /**
   * 自定义是否需要进行相对时间格式化
   * - 入参为当前时间与目标时间的绝对时间差（毫秒）以及传入的原始日期值
   * - 返回 true 表示进行「xx 秒前 / in xx seconds」这种格式化
   * - 返回 false 表示直接返回原始日期（date）
   *
   * 示例：只在 30 天内才显示相对时间，否则直接返回原始时间
   * ```ts
   * formatTimeFromNow(someDate, {
   *   shouldFormat: (diff) => diff <= 30 * 24 * 60 * 60 * 1000,
   * })
   * ```
   */
  shouldFormat?: (diffMs: number, date: TimeType) => boolean
}

export type FormatTimeFromNowLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' | 'de-DE'
export type FormatTimeFromNowDesc = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'justNow'
