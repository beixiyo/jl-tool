import type { ScrollTrigger } from './ScrollTrigger'
import type { SmoothScroller } from './SmoothScroller'

export const ScrollConfig = {
  /** 是否已经添加了全局滚动监听器 */
  isScrollListenerAdded: false,

  /** 存储所有触发器实例 */
  instances: new Map<string, ScrollTrigger>(),

  /** 存储已添加监听器的滚动容器 */
  scrollerListeners: new WeakMap<HTMLElement | Window, Set<string>>(),

  /** 存储 SmoothScroller 实例 */
  smoothScrollers: new WeakMap<HTMLElement | Window, SmoothScroller>(),
}
