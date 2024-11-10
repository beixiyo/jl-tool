/**
 * 开启摄像头
 * @param callbackOrVideoEl 视频元素或者回调
 * @returns 停止播放的函数
 */
export const openCamera = async (callbackOrVideoEl: ((stream: MediaStream) => void) | HTMLVideoElement) => {
  const stream = await navigator.mediaDevices
    .getUserMedia({
      audio: true, video: true
    })

  switch (typeof callbackOrVideoEl) {
    case 'function':
      callbackOrVideoEl(stream)
      break
    case 'object':
      callbackOrVideoEl.srcObject = stream
      callbackOrVideoEl.play()

    default:
      break
  }

  return new Promise<Function>((resolve) => {
    resolve(() => {
      stream.getTracks().forEach((item) => item.stop())
    })
  })
}


/** 录屏 */
export const screenCAP = async (fileName?: string) => {
  const
    stream = await navigator.mediaDevices.getDisplayMedia(),
    recoder = new MediaRecorder(stream),
    [video] = stream.getVideoTracks()

  recoder.start()
  video.addEventListener("ended", () => {
    recoder.stop()
  })
  recoder.addEventListener("dataavailable", (evt) => {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(evt.data)
    a.download = `${fileName || Date.now()}.webm`
    a.click()
  })
}
