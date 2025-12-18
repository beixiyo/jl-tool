import type { ChromeDesktopTrackConstraints, DesktopStreamRequest, MicrophoneConfig, RecorderMimeType } from './type'

/**
 * 运行时检测：类型是否被支持
 */
export function isMimeTypeSupported(mimeType: RecorderMimeType): boolean {
  try {
    return typeof MediaRecorder !== 'undefined'
      ? MediaRecorder.isTypeSupported(mimeType)
      : false
  }
  catch {
    return false
  }
}

/**
 * 返回当前环境可用的媒体类型（按传入优先级过滤）
 */
export function pickSupportedMimeType(
  prefer: RecorderMimeType[] = [],
): RecorderMimeType | undefined {
  const candidates: RecorderMimeType[] = prefer.length > 0
    ? prefer
    : [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        /** 某些浏览器对 mp4 支持受限 */
        'video/mp4;codecs=h264,aac',
        'video/mp4',
      ]
  return candidates.find(isMimeTypeSupported)
}

/**
 * 将两个音频源混音为一个 MediaStream
 * - 使用 WebAudio 将系统音频与麦克风音频合成
 * - 注意：返回的流会持有 AudioContext 的引用，需要调用者管理 AudioContext 的生命周期
 */
export async function mixAudioStreams(
  a?: MediaStream,
  b?: MediaStream,
): Promise<{ stream: MediaStream | undefined, audioContext?: AudioContext }> {
  if (!a && !b)
    return { stream: undefined }
  if (a && !b) {
    /** 返回新的 MediaStream 实例，避免直接返回原始流 */
    const tracks = a.getAudioTracks()
    return {
      stream: tracks.length > 0
        ? new MediaStream(tracks)
        : undefined,
    }
  }
  if (!a && b) {
    const tracks = b.getAudioTracks()
    return {
      stream: tracks.length > 0
        ? new MediaStream(tracks)
        : undefined,
    }
  }
  /**
   * 两者都存在时混音
   * 兼容旧版浏览器的 webkitAudioContext
   */
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('当前浏览器不支持 AudioContext')
  }
  const audioContext = new AudioContextClass()
  const destination = audioContext.createMediaStreamDestination()
  const connect = (stream: MediaStream) => {
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(destination)
  }
  connect(a as MediaStream)
  connect(b as MediaStream)
  return { stream: destination.stream, audioContext }
}

/**
 * 构建麦克风约束
 */
export function buildMicConstraints(mic: MicrophoneConfig): MediaStreamConstraints {
  if (mic === true) {
    return { audio: true, video: false }
  }
  if (mic === false) {
    return { audio: false, video: false }
  }

  return {
    audio: mic,
    video: false,
  }
}

/**
 * 使用 desktopCapturer 源创建 MediaStream
 */
export async function createDesktopCaptureStream(request: DesktopStreamRequest) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前环境不支持桌面捕获')
  }
  const { source, withAudio, withVideo } = request
  const frameRate = source.frameRate ?? 30

  const audioConstraint: false | ChromeDesktopTrackConstraints = withAudio
    ? {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
        },
      }
    : false

  const videoConstraint: false | ChromeDesktopTrackConstraints = withVideo
    ? {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
          maxFrameRate: frameRate,
          ...(source.width
            ? { maxWidth: source.width }
            : {}),
          ...(source.height
            ? { maxHeight: source.height }
            : {}),
        },
        optional: [
          { maxFrameRate: frameRate },
        ],
      }
    : false

  const constraints = {
    audio: audioConstraint,
    video: videoConstraint,
  } as MediaStreamConstraints
  return navigator.mediaDevices.getUserMedia(constraints)
}
