/**
 * 虚假进度条
 * 
 * @example
 * ```ts
 * const progress = new FakeProgress({ ... })
 * console.log(progress.progress)
 * ```
 */
export class FakeProgress {

    timeConstant = 60000
    /** 进度，0 ~ 1 之间 */
    progress = 0

    onChange?: (progress: number) => void

    private intervalId?: number
    private intervalFrequency = 100
    private time = 0

    constructor(fakeProgressOpts: FakeProgressOpts = {}) {
        const {
            autoStart = true,
            timeConstant = 60000,
            onChange
        } = fakeProgressOpts

        this.timeConstant = timeConstant
        this.onChange = onChange

        autoStart && this.start()
    }

    start() {
        this.stop()
        this.intervalId = window.setInterval(() => {
            this.time += this.intervalFrequency
            this.setProgress(1 - Math.exp(-1 * this.time / this.timeConstant))   

        }, this.intervalFrequency)
    }

    stop() {
        clearInterval(this.intervalId)
    }

    end() {
        this.stop()
        this.setProgress(1)
    }

    setProgress(value: number) {
        this.progress = value
        this.onChange?.(value)
    }
}


export type FakeProgressOpts = {
    /**
     * 时间系数
     * @default 60000
     */
    timeConstant?: number
    /**
     * 是否自动开始
     * @default true
     */
    autoStart?: boolean

    onChange?: (progress: number) => void
}