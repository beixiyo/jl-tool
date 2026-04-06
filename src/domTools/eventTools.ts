/**
 * 绑定事件并返回解绑函数；`target` 类型决定可用事件名与回调参数类型
 * @param eventName 与当前 `target` 对应 EventMap 一致的事件名
 * @param listener 事件回调
 * @param options addEventListener 配置项
 * @param target 监听目标；默认 `window`。可为 `document`、任意 `Element`（含 HTMLElement）、或另一 `Window`
 * @returns 解绑函数，调用后移除监听
 *
 * @example
 * ```ts
 * const off = bindWinEvent('resize', () => console.log('resize'))
 * // off()
 *
 * bindWinEvent('click', (e) => console.log(e.clientX), { passive: true }, document.body)
 * ```
 */
export function bindWinEvent<K extends keyof WindowEventMap>(
  eventName: K,
  listener: (this: Window, ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
  target?: Window,
): () => void
export function bindWinEvent<K extends keyof DocumentEventMap>(
  eventName: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => void,
  options: boolean | AddEventListenerOptions | undefined,
  target: Document,
): () => void
export function bindWinEvent<K extends keyof HTMLElementEventMap>(
  eventName: K,
  listener: (this: Element, ev: HTMLElementEventMap[K]) => void,
  options: boolean | AddEventListenerOptions | undefined,
  target: Element,
): () => void
export function bindWinEvent(
  eventName: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions,
  target: Window | Document | Element = window,
): () => void {
  const el = target
  el.addEventListener(eventName, listener, options)
  const unBind = () => {
    el.removeEventListener(eventName, listener, options)
  }

  return unBind
}

/**
 * 根据容器内每张 `<img>` 的加载 Promise，由调用方决定如何汇总为「是否视为就绪」
 * @param imageLoadPromises 与 `el.querySelectorAll('img')` 顺序一一对应
 */
export type JudgeImgLoadAggregate = (imageLoadPromises: Promise<unknown>[]) => Promise<boolean>

function defaultJudgeImgLoadAggregate(promises: Promise<unknown>[]): Promise<boolean> {
  return Promise.all(promises)
    .then(() => true)
    .catch(() => false)
}

/**
 * 判断指定容器内 `<img>` 加载情况：先为每张图构造加载 Promise，再交给 `aggregate` 汇总（默认行为等价于 `Promise.all` 全部成功为 `true`，任一张失败为 `false`）
 * @param el 要扫描的根节点，默认 `document`
 * @param aggregate 自定义汇总逻辑；无图时也会调用并传入空数组（默认下为 `true`）
 * @returns 由 `aggregate` 解析出的布尔结果
 *
 * @example
 * ```ts
 * const ok = await judgeImgLoad(document.getElementById('article')!)
 * if (ok) console.log('文章内图片已就绪')
 * ```
 *
 * @example
 * ```ts
 * // 用 allSettled：不因单张失败而整批短路，自行定义「就绪」条件
 * await judgeImgLoad(el, (ps) =>
 *   Promise.allSettled(ps).then(rs =>
 *     rs.every(r => r.status === 'fulfilled'),
 *   ),
 * )
 * ```
 */
export function judgeImgLoad(
  el: Document | Element = document,
  aggregate: JudgeImgLoadAggregate = defaultJudgeImgLoadAggregate,
): Promise<boolean> {
  const imgArr = el.querySelectorAll('img')

  const promArr = Array.from(imgArr).map((img) => {
    if (img.complete) {
      return img.naturalWidth !== 0
        ? Promise.resolve()
        : Promise.reject(new Error('img load error'))
    }
    return new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('img load error'))
    })
  })

  return aggregate(promArr)
}

/**
 * 返回一个在指定时间窗内连续两次按下同一键时触发的键盘处理函数，用于绑定到 `keydown` 等事件
 * @param key `KeyboardEvent.key` 或自定义字段（见 `opts.triggerKey`）
 * @param fn 第二次按键在间隔内命中时执行
 * @param gap 两次按键允许的最大间隔（毫秒），默认 `150`
 * @param options 可选配置
 * @param options.triggerKey 从事件对象上读取的字段名，默认 `'key'`（即使用 `KeyboardEvent.key`）
 * @returns 可直接作为 `addEventListener` 监听器的函数
 *
 * @example
 * ```ts
 * const onKey = doubleKeyDown('Enter', (e) => console.log('双击 Enter'), 200)
 * window.addEventListener('keydown', onKey)
 * ```
 */
export function doubleKeyDown<T, R>(
  key: string,
  fn: (this: T, e: KeyboardEvent, ...args: any[]) => R,
  gap = 150,
  {
    triggerKey = 'key',
  }: DoubleKeyDownOpts = {},
) {
  /**
   * 调用函数记录初始时间，你不可能立即点击
   * 所以下面的判断进不去
   */
  let st = Date.now()

  return (e: KeyboardEvent) => {
    if (e[triggerKey] !== key)
      return

    const now = Date.now()
    /**
     * 第一次点击肯定超过了间隔时间，所以重新赋值 st
     * 下次按下按键，只要在间隔时间内就算双击
     */
    if (now - st <= gap) {
      // @ts-ignore
      return fn.call(this, e) as R
    }
    st = now
  }
}

/**
 * 切换全屏：当前未全屏则进入全屏，已全屏则退出（含 webkit / moz / ms 前缀）
 * @param dom 要全屏的节点；不传则对 `document.documentElement` 切换
 * @returns 无；若环境不支持全屏 API 则静默返回
 *
 * @example
 * ```ts
 * fullScreen(document.getElementById('player')!)
 * // 再次调用可退出全屏（与浏览器当前全屏元素一致时）
 * ```
 */
export function fullScreen(dom?: HTMLElement) {
  const
    doc = document as any
  const root = document.documentElement as any
  const rfs
      = root.requestFullscreen
        || root.webkitRequestFullscreen
        || root.mozRequestFullScreen
        || root.msRequestFullscreen
  const efs
      = doc.exitFullscreen
        || doc.webkitCancelFullScreen
        || doc.webkitExitFullscreen
        || doc.mozCancelFullScreen
        || doc.msExitFullscreen

  if (!rfs)
    return

  const isFull
    = doc.fullscreenElement
      || doc.webkitFullscreenElement
      || doc.mozFullScreenElement
      || doc.msFullscreenElement

  if (dom) {
    isFull
      ? efs.call(dom)
      : rfs.call(dom)
  }
  else {
    isFull
      ? efs.call(root)
      : rfs.call(root)
  }
}

/**
 * 与原生 `window.addEventListener` 单重载参数一致，便于复用监听函数类型
 *
 * @example
 * ```ts
 * type L = WinListenerParams<'keydown'>[1]
 * ```
 */
export type WinListenerParams<K extends keyof WindowEventMap> = Parameters<typeof window.addEventListener<K>>

/**
 * {@link doubleKeyDown} 的可选配置
 *
 * @example
 * ```ts
 * doubleKeyDown('KeyW', fn, 150, { triggerKey: 'code' })
 * ```
 */
export type DoubleKeyDownOpts = {
  /**
   * 从 `KeyboardEvent` 上取哪个字段与 `key` 比较，默认 `'key'`
   * @default key
   */
  triggerKey?: keyof KeyboardEvent
}
