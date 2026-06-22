import { describe, expect, it } from 'vitest'
import { Clock } from '@/tools/Clock'

describe('Clock', () => {
  it('应该使用注入的单调时间源计算 elapsed', () => {
    let now = 1000
    const clock = new Clock({ getNow: () => now })

    now = 3500

    expect(clock.elapsedMS).toBe(2500)
    expect(clock.elapsed).toBe(2.5)
  })

  it('暂停时 elapsed 应该冻结，恢复后排除暂停时长', () => {
    let now = 0
    const clock = new Clock({ getNow: () => now })

    now = 1000
    clock.pause()
    expect(clock.elapsedMS).toBe(1000)

    now = 6000
    expect(clock.elapsedMS).toBe(1000)

    clock.resume()
    now = 8000
    expect(clock.elapsedMS).toBe(3000)
  })

  it('应该通过 getter 暴露只读内部状态', () => {
    let now = 10
    const clock = new Clock({ getNow: () => now })

    expect(clock.now).toBe(10)
    expect(clock.startTime).toBe(10)
    expect(clock.curTime).toBe(10)
    expect(clock.lastUpdateAt).toBe(10)
    expect(clock.pausedAt).toBe(undefined)
    expect(clock.pausedDuration).toBe(0)
    expect(clock.isStarted).toBe(true)

    now = 30
    clock.pause()
    expect(clock.pausedAt).toBe(30)
    expect(clock.curTime).toBe(30)

    now = 80
    clock.resume()
    expect(clock.pausedAt).toBe(undefined)
    expect(clock.pausedDuration).toBe(50)
    expect(clock.lastUpdateAt).toBe(80)
  })

  it('autoStart=false 时应等待 start 后再计时', () => {
    let now = 100
    const clock = new Clock({
      autoStart: false,
      getNow: () => now,
    })

    now = 500
    expect(clock.elapsedMS).toBe(0)

    clock.start()
    now = 900
    expect(clock.elapsedMS).toBe(400)
  })

  it('update 应该显式更新 delta', () => {
    let now = 0
    const clock = new Clock({ getNow: () => now })

    now = 16
    expect(clock.deltaMS).toBe(0)

    clock.update()
    expect(clock.deltaMS).toBe(16)
    expect(clock.delta).toBe(0.016)
  })

  it('resume 后第一次 update 不应该把暂停时长计入 delta', () => {
    let now = 0
    const clock = new Clock({ getNow: () => now })

    now = 100
    clock.update()
    clock.pause()

    now = 1100
    clock.resume()

    now = 1116
    clock.update()
    expect(clock.deltaMS).toBe(16)
    expect(clock.elapsedMS).toBe(116)
  })

  it('reset 应该清空状态', () => {
    let now = 0
    const clock = new Clock({ getNow: () => now })

    now = 1200
    clock.reset()

    expect(clock.elapsedMS).toBe(0)
    expect(clock.deltaMS).toBe(0)
    expect(clock.isRunning).toBe(false)
    expect(clock.isPaused).toBe(false)
  })
})
