export const CSS_DEFAULT_VAL: Record<string, number> = {
  opacity: 1,
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
}

/** 没有单位的 `CSS` 属性 */
export const WITHOUT_UNITS = new Set([
  'opacity',
  'lineHeight',
  'fontWeight',

  'counterReset',
  'counterIncrement',

  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',

  'scale',
  'scaleX',
  'scaleY',

  'order',
  'orphans',
  'widows',
  'zIndex',
])

/**
 * 常见transform属性的默认单位
 */
export const TRANSFORM_UNIT_MAP: Record<string, string> = {
  x: 'px',
  y: 'px',
  z: 'px',
  rotate: 'deg',
  rotateX: 'deg',
  rotateY: 'deg',
  rotateZ: 'deg',
  scale: '',
  scaleX: '',
  scaleY: '',
}
