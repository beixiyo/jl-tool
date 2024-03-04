import { isNode } from './constant'


/** 检查是否为浏览器环境，并且根据参数决定是否警告 */
export const checkEnv = (needWarn = false) => {
    if (isNode) {
        needWarn && console.warn('this api only run in window')
        return 'node'
    }
    return 'browser'
}

/**
 * 根据运行环境，如果是浏览器环境，则返回函数，node 环境则返回空函数
 * @param fn 要检查的函数
 */
export function adaptEnv<T extends Function>(fn: T): T {
    const env = checkEnv()

    if (env === 'browser') {
        return fn
    }
    return (() => { }) as unknown as T
}
