/**
 * 开启摄像头
 * @param callbackOrVideoEl 视频元素或者回调
 * @returns 停止播放的函数
 */
export async function openCamera(callbackOrVideoEl: ((stream: MediaStream) => void) | HTMLVideoElement) {
  const stream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })

  switch (typeof callbackOrVideoEl) {
    case 'function':
      callbackOrVideoEl(stream)
      break
    case 'object':
      callbackOrVideoEl.srcObject = stream
      callbackOrVideoEl.play()
      break

    default:
      break
  }

  return new Promise<Function>((resolve) => {
    resolve(() => {
      stream.getTracks().forEach(item => item.stop())
    })
  })
}
