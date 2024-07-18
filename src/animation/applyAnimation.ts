/**
 * 在一帧中执行你的函数
 * @param fn 将此函数放在 *requestAnimationFrame* 内递归执行，如果此函数返回 `stop` 则停止执行
 * @returns 返回一个函数，用于取消函数执行
 */
export const applyAnimation = (fn: () => 'stop' | void) => {
    let id: number
    const animate = () => {
        if (fn() === 'stop') return cancelAnimationFrame(id)
        id = requestAnimationFrame(animate)
    }

    animate()
    return () => {
        cancelAnimationFrame(id)
    }
}
