const FALLBACK_FRAME_MS = Math.round(1000 / 60)

export type AnimationFrameId = number | ReturnType<typeof setTimeout>

export interface AnimationFrameScheduler {
  request: (...args: Parameters<typeof requestAnimationFrame>) => AnimationFrameId
  cancel: (id: AnimationFrameId | undefined) => void
}

export function createAnimationFrameScheduler(): AnimationFrameScheduler {
  if (
    typeof requestAnimationFrame !== 'undefined'
    && typeof cancelAnimationFrame !== 'undefined'
  ) {
    return {
      request: (...args) => requestAnimationFrame(...args),
      cancel: (id) => {
        if (id !== undefined)
          cancelAnimationFrame(id as number)
      },
    }
  }

  return {
    request: (...args) => {
      const [cb] = args
      return setTimeout(() => cb(getNow()), FALLBACK_FRAME_MS)
    },
    cancel: (id) => {
      if (id !== undefined)
        clearTimeout(id)
    },
  }
}

function getNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}
