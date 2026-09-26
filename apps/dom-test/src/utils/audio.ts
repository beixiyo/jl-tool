/** DOM 测试页共享的音频分析工具：电平表、Opus 头声道数、时长解码与输出文件信息 */

export interface LevelMeter {
  dispose: () => void
}

/**
 * 在指定 AudioContext 里分析一个音频源，按动画帧回报峰值；分析链不接扬声器
 *
 * 传入 AudioNode 时 dispose 只断开内部 analyser，不会断开该节点本身——
 * 它可能同时被接给录制器等其他目的地
 */
export function createLevelMeter(
  context: AudioContext,
  source: AudioNode | MediaStream,
  onLevel: (peak: number) => void,
): LevelMeter {
  const node = source instanceof MediaStream
    ? context.createMediaStreamSource(source)
    : source
  const analyser = context.createAnalyser()
  analyser.fftSize = 2048
  node.connect(analyser)
  const buffer = new Float32Array(analyser.fftSize)
  let frame = 0

  const tick = () => {
    analyser.getFloatTimeDomainData(buffer)
    let peak = 0
    for (const sample of buffer) peak = Math.max(peak, Math.abs(sample))
    onLevel(peak)
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)

  return {
    dispose: () => {
      cancelAnimationFrame(frame)
      node.disconnect()
      analyser.disconnect()
    },
  }
}

/**
 * 读取 Opus 头里的声道数
 *
 * OpusHead 结构：8 字节魔数 "OpusHead" + 1 字节版本 + 1 字节声道数，
 * WebM 把它整体放在 CodecPrivate 里，因此在文件头部找到魔数后偏移 +9 即可
 */
export async function readOpusChannelCount(blob: Blob): Promise<number | null> {
  const bytes = new Uint8Array(await blob.slice(0, 4096).arrayBuffer())
  const magic = [...'OpusHead'].map((char) => char.charCodeAt(0))
  for (let i = 0; i + magic.length + 1 < bytes.length; i++) {
    if (magic.every((byte, offset) => bytes[i + offset] === byte)) return bytes[i + 9]
  }
  return null
}

/** MediaRecorder 产出的 WebM 没有写时长，解码一遍得到真实时长 */
export async function decodeDuration(context: AudioContext, blob: Blob): Promise<number | null> {
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer())
    return audio.duration
  }
  catch {
    return null
  }
}

export function formatDuration(duration: number | null): string {
  return duration === null
    ? '—'
    : `${duration.toFixed(2)} s`
}

export function extensionOf(mimeType: string): string {
  return mimeType.includes('mp4')
    ? 'm4a'
    : 'webm'
}
