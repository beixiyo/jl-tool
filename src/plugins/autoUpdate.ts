const CONFIRM_GAP = 1000 * 60 * 5,
    REFRESH_GAP = 1000 * 10


/** 检查页面更新 */
export function autoUpdate(opts: Opts = {}) {
    let timer: number,
        srcArr: string[] = []

    const {
        needUpate = () => true,
        confirmGap = CONFIRM_GAP,
        refreshGap = REFRESH_GAP
    } = opts

    timer = window.setInterval(async () => {
        const flag = await hasChange()
        if (flag && needUpate()) {
            const userConfirm = window.confirm('页面有更新，是否刷新？')
            if (userConfirm) {
                window.location.reload()
            }
            // 若用户点击不更新 则一定时间后 再重新轮询
            else {
                clear()
                setTimeout(autoUpdate, confirmGap)
            }
        }
    }, refreshGap)


    /** ------------------------------- 辅助实现函数 ---------------------------------- */
    function getSrcArr(str: string) {
        const reg = /<script.*src=["'](?<src>.*?)["']>.*<\/script>/mig
        const res = []

        let match: RegExpExecArray
        while ((match = reg.exec(str))) {
            res.push(match.groups.src)
        }
        return res
    }

    /** 检查页面是否更新 */
    async function hasChange() {
        const html = await fetch(`/?timestamp=${Date.now()}`).then(res => res.text())

        const arr = getSrcArr(html)
        if (srcArr.length === 0) {
            srcArr = arr
            return false
        }

        for (let i = 0; i < arr.length; i++) {
            if (srcArr[i] !== arr[i]) return true
        }
        return false
    }

    function clear() {
        clearInterval(timer)
        timer = null
    }
}


type Opts = {
    /** 你可以根据环境变量决定是否自动检查更新 */
    needUpate?: () => boolean
    /** 再次询问是否更新的间隔，默认 5 分钟 */
    confirmGap?: number
    /** 检查更新间隔，默认 10 秒 */
    refreshGap?: number
}
