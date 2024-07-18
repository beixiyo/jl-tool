import { TimeFunc } from '@/types'
import { genTimeFunc } from '@/animation/timeFunc'


/**
 * 根据传入的值，返回一个动画函数。通常用来做滚动动画值映射
 * #### 你可以拿到返回的函数，传入指定范围的值，他会映射成对应的值
 * 
 * @param stVal 动画起点，比如滚动起始位置
 * @param endVal 动画终点，比如滚动终点位置
 * @param animateStVal 动画起点对应的值
 * @param animateEndVal 动画终点对应的值
 * @param timeFunc 动画缓动函数，支持内置函数和自定义函数
 */
export function createAnimation(
    stVal: number,
    endVal: number,
    animateStVal: number,
    animateEndVal: number,
    timeFunc?: TimeFunc
) {
    /**
     * 根据当前值 返回动画值
     * @param curVal 当前值
     */
    return (curVal: number) => {
        if (curVal < stVal) {
            return animateStVal
        }
        if (curVal > endVal) {
            return animateEndVal
        }

        const
            _timeFunc = genTimeFunc(timeFunc),
            _progress = (curVal - stVal) / (endVal - stVal),
            progress = _timeFunc(_progress)

        return animateStVal + (animateEndVal - animateStVal) * progress
    }
}
