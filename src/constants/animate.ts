/** 默认 `CSS` 值为 *1* 的`CSS`属性 */
export const CSS_DEFAULT_VAL_KEYS = [
  'opacity',
  'fill-opacity',
  'z-index',
  'stroke-opacity',
  'scale',
  'scaleX',
  'scaleY',
  'zoom',
]

/** 没有单位的 `CSS` 属性 */
export const WITHOUT_UNITS = [
  'opacity',
  'line-height',
  'counter-reset',
  'counter-increment',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'order',
  'orphans',
  'widows',
  'z-index',
]

/** 所有 `transform` 的键 */
export const TRANSFORM_KEYS = [
  'matrix',
  'matrix3d',
  'perspective',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'rotate3d',
  'scale',
  'scaleX',
  'scaleY',
  'scaleZ',
  'scale3d',
  'skew',
  'skewX',
  'skewY',
  'translate',
  'translateX',
  'translateY',
  'translateZ',
  'translate3d',
]

/** `transform` 属性的默认映射单位 */
export const TRANSFORM_UNIT_MAP = {
  scale: '',
  scaleX: '',
  scaleY: '',
  scaleZ: '',
  scale3d: '',
  rotate: 'deg',
  rotateX: 'deg',
  rotateY: 'deg',
  rotateZ: 'deg',
  rotate3d: 'deg',
  skew: 'deg',
  skewX: 'deg',
  skewY: 'deg',
  translate: 'px',
  translateX: 'px',
  translateY: 'px',
  translateZ: 'px',
  translate3d: 'px',
  perspective: 'px',
  matrix: '',
  matrix3d: ''
}
