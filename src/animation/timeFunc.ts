import { TimeFunc } from '@/types'


/**
 * 生成贝塞尔曲线函数
 * @param name 动画函数名称
 * @returns 一个接收`0 ~ 1`进度参数的函数
 */
export function genTimeFunc(name?: TimeFunc) {
    if (typeof name === 'function') {
        return name
    }

    switch (name) {
        case 'linear':
            return (progress: number) => progress
        case 'ease':
            return (progress: number) => 0.5 - 0.5 * Math.cos(progress * Math.PI)
        case 'ease-in':
            return (progress: number) => progress * progress
        case 'ease-out':
            return (progress: number) => 1 - Math.pow(1 - progress, 2)
        case 'ease-in-out':
            return (progress: number) =>
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2

        default:
            return (progress: number) => progress
    }
}
