import { createAnimationByTime } from '@/animation'
import { BaseType } from '@/types'

export type PropMap<T> = {
  [K in keyof T]: {
    initVal: number
    diffVal: number
    unit: string | null
    /** 非`transform`属性才有的 */
    rawElUnit?: string | null
  }
}

/** 支持 `string | nunber` 类型  在`getDiff`函数已经处理过了 */
export type FinalProp = {
  scale?: BaseType
  scaleX?: BaseType
  scaleY?: BaseType
  scaleZ?: BaseType
  rotate?: BaseType
  rotateX?: BaseType
  rotateY?: BaseType
  rotateZ?: BaseType
  skew?: BaseType
  skewX?: BaseType
  skewY?: BaseType
  translateX?: BaseType
  translateY?: BaseType
  translateZ?: BaseType
  perspective?: BaseType
  matrix?: BaseType
  left?: BaseType
  top?: BaseType
  right?: BaseType
  bottom?: BaseType
  width?: BaseType
  height?: BaseType
  opacity?: BaseType
}
  & Record<string, any>

export type AnimiateParams = Parameters<typeof createAnimationByTime>