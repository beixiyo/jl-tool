import { ONE_DAY } from '@/shared/constant'
import type { TimeType } from '@/types/base'
import { getType } from './tools'


/** 今年的第几天 */
export const dayOfYear = (date = new Date()) =>
    Math.floor(
        (+date - +(new Date(date.getFullYear(), 0, 0)))
        / ONE_DAY
    )

/** 获取时分秒 */
export const timeFromDate = (date: Date) => date.toTimeString().slice(0, 8)

/** 获取日期间隔 单位(天) */
export function dayDiff(date1: TimeType, date2: TimeType) {
    const d1 = new Date(date1),
        d2 = new Date(date2)
    return Math.ceil(Math.abs(+d1 - +d2) / ONE_DAY)
}

/**
 * 日期补零 把`yyyy-MM-dd` 转成 `yyyy-MM-dd HH:mm:ss`
 * @param date 格式: `2016-06-10` 必须和它长度保持一致
 * @param placeholder 后面补充的字符串 默认`00:00:00`
 * @returns 如`2016-06-10 10:00:00`
 */
export function padDate(date: string, placeholder = '00:00:00') {
    if (!date) throw new Error('日期格式必须是`yyyy-MM-dd`')
    if (date.length !== '2016-06-10'.length) throw new Error('日期格式必须是`yyyy-MM-dd`')

    return date + ' ' + placeholder
}

/**
 * 把日期转为 `Date` 对象，非法日期则抛异常
 * @param date 日期，可以是字符串或者时间戳
 */
export function getValidDate(date: Date | string | number) {
    if (getType(date) !== 'date') {
        date = new Date(date)
        if (String(date) === 'Invalid Date') {
            throw new Error('日期格式错误')
        }
    }

    return date
}

/**
 * 返回给定日期是否小于某年`一月一日` 默认去年
 * @param curDate 当前日期
 * @param yearLen 年份长度，默认 `-1`，即去年
 */
export function isLtYear(curDate: Date | string | number, yearLen = -1) {
    curDate = getValidDate(curDate)

    const date = new Date()
    date.setFullYear(date.getFullYear() + yearLen)
    date.setMonth(0)
    date.setDate(0)

    return curDate < date
}

/**
 * 描述传入日期相对于当前时间的口头说法
 * @param date 需要计算时间间隔的日期
 */
export function timeGap(date?: TimeType, opts: TimeGapOpts = {}) {
    const { afterFn, beforeFn, fallback = '--' } = opts
    let isFuture = false,
        time = Date.now() - new Date(date ?? Date.now()).getTime()

    const detailMap = [
        { desc: '年', gap: 3600 * 24 * 365 * 1e3 },
        { desc: '个月', gap: 3600 * 24 * 30 * 1e3 },
        { desc: '天', gap: 3600 * 24 * 1e3 },
        { desc: '小时', gap: 3600 * 1e3 },
        { desc: '分钟', gap: 60 * 1e3 },
        { desc: '秒', gap: 1 * 1e3 },
        { desc: '刚刚', gap: 0 }
    ]

    if (Number.isNaN(time)) return fallback
    if (time === 0) return detailMap.find(item => item.gap === time).desc

    if (time < 0) {
        isFuture = true
        time = -time
    }

    for (let i = 0; i < detailMap.length; i++) {
        const { desc, gap } = detailMap[i]
        if (time >= gap) {
            const v = Math.floor(time / gap)
            const str = v + desc
            if (isFuture) {
                return afterFn
                    ? afterFn(str)
                    : str + '后'
            }
            return beforeFn
                ? beforeFn(str)
                : str + '前'
        }
    }
}


export type TimeGapOpts = {
    /** 兜底替代字符串，默认 -- */
    fallback?: string
    /** 以前日期格式化 */
    beforeFn?: (dateStr: string) => string
    /** 以后日期格式化 */
    afterFn?: (dateStr: string) => string
}