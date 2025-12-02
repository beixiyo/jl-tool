/**
 * @description 音频格式转换工具
 * 使用 Web Audio API 将 WebM/Opus 等格式转换为 WAV
 */

/**
 * 将音频 Blob 转换为 WAV 格式
 *
 * @param audioBlob - 原始音频 Blob（支持 WebM、OGG、MP3 等浏览器支持的格式）
 * @param options - 转换选项
 * @returns 转换后的 WAV 格式 Blob
 *
 * @example
 * ```typescript
 * const webmBlob = await mediaRecorder.stop()
 * const wavBlob = await convertToWav(webmBlob, {
 *   sampleRate: 16000,  // 重采样到 16kHz（推荐用于语音识别）
 *   channels: 1,         // 单声道
 * })
 * ```
 */
export async function convertToWav(
  audioBlob: Blob,
  options: {
    /** 目标采样率，默认 16000 Hz（推荐用于语音识别） */
    sampleRate?: number
    /** 目标声道数，默认 1（单声道） */
    channels?: number
  } = {},
): Promise<Blob> {
  const { sampleRate = 16000, channels = 1 } = options

  // 1. 创建 AudioContext
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('当前环境不支持 AudioContext')
  }

  const audioContext = new AudioContextClass({ sampleRate })

  try {
    // 2. 解码音频 Blob 为 AudioBuffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // 3. 如果需要重采样或转换声道，创建新的 AudioBuffer
    let processedBuffer: AudioBuffer = audioBuffer

    if (audioBuffer.sampleRate !== sampleRate || audioBuffer.numberOfChannels !== channels) {
      /** 创建新的 AudioBuffer */
      processedBuffer = audioContext.createBuffer(
        channels,
        Math.floor((audioBuffer.length * sampleRate) / audioBuffer.sampleRate),
        sampleRate,
      )

      /** 复制并混合声道（如果是多声道转单声道） */
      const sourceData = audioBuffer.getChannelData(0)
      const targetData = processedBuffer.getChannelData(0)

      if (audioBuffer.numberOfChannels === 1 && channels === 1) {
        /** 单声道到单声道，只需要重采样 */
        const ratio = audioBuffer.sampleRate / sampleRate
        for (let i = 0; i < targetData.length; i++) {
          const sourceIndex = Math.floor(i * ratio)
          targetData[i] = sourceData[sourceIndex]
        }
      }
      else {
        /** 多声道混合或重采样 */
        const ratio = audioBuffer.sampleRate / sampleRate
        for (let i = 0; i < targetData.length; i++) {
          const sourceIndex = Math.floor(i * ratio)
          if (channels === 1 && audioBuffer.numberOfChannels > 1) {
            /** 多声道混合为单声道 */
            let sum = 0
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
              sum += audioBuffer.getChannelData(ch)[sourceIndex]
            }
            targetData[i] = sum / audioBuffer.numberOfChannels
          }
          else {
            /** 单声道或多声道直接复制 */
            targetData[i] = sourceData[sourceIndex]
          }
        }
      }
    }

    // 4. 将 AudioBuffer 转换为 WAV 格式的 Blob
    const wavBlob = audioBufferToWav(processedBuffer)
    return wavBlob
  }
  finally {
    /** 清理 AudioContext */
    await audioContext.close()
  }
}

/**
 * 将 AudioBuffer 转换为 WAV 格式的 Blob
 *
 * @param audioBuffer - 音频缓冲区
 * @returns WAV 格式的 Blob
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length

  // WAV 文件头大小：44 字节
  const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
  const view = new DataView(buffer)

  // WAV 文件头
  // RIFF 标识
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + length * numberOfChannels * 2, true) // 文件大小 - 8
  writeString(view, 8, 'WAVE')
  // fmt 子块
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt 子块大小
  view.setUint16(20, 1, true) // 音频格式：1 = PCM
  view.setUint16(22, numberOfChannels, true) // 声道数
  view.setUint32(24, sampleRate, true) // 采样率
  view.setUint32(28, sampleRate * numberOfChannels * 2, true) // 字节率
  view.setUint16(32, numberOfChannels * 2, true) // 块对齐
  view.setUint16(34, 16, true) // 位深度：16 位
  // data 子块
  writeString(view, 36, 'data')
  view.setUint32(40, length * numberOfChannels * 2, true) // 数据大小

  /** 写入 PCM 数据 */
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
      view.setInt16(offset, sample < 0
        ? sample * 0x8000
        : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * 在 DataView 中写入字符串
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
